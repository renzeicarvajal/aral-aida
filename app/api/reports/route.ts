import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // 1. Get all learners for this teacher, including their progress records
  const learners = await prisma.learner.findMany({
    where: { userId: parseInt(userId) },
    include: {
      progress: {
        orderBy: { sessionDate: 'desc' },
      }
    }
  })

  // 2. Calculate stats for each learner
  const reportData = learners.map(learner => {
    const sessions = learner.progress
    const totalSessions = sessions.length
    
    const avgAccuracy = totalSessions > 0 
      ? sessions.reduce((sum: number, p: any) => sum + p.accuracy, 0) / totalSessions 
      : 0
      
    const avgComprehension = totalSessions > 0 
      ? sessions.reduce((sum: number, p: any) => sum + p.comprehension, 0) / totalSessions 
      : 0
      
    const lastSession = sessions.length > 0 ? sessions[0].sessionDate : null

    return {
      id: learner.id,
      name: learner.name,
      grade: learner.grade,
      section: learner.section,
      philIriLevel: learner.philIriLevel,
      totalSessions,
      avgAccuracy: avgAccuracy.toFixed(1),
      avgComprehension: avgComprehension.toFixed(1),
      lastSessionDate: lastSession
    }
  })

  return NextResponse.json(reportData)
}