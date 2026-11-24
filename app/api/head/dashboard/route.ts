import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Get all teachers
    const teachers = await prisma.user.findMany({
      where: { role: 'Teacher' },
      include: {
        learners: {
          include: {
            progress: true
          }
        }
      }
    })

    // 2. Calculate system-wide stats
    let totalLearners = 0
    let totalSessions = 0
    let totalAccuracy = 0
    let totalComprehension = 0

    const teacherStats = teachers.map(teacher => {
      const learnerCount = teacher.learners.length
      totalLearners += learnerCount

      let teacherSessions = 0
      let teacherAccuracy = 0
      let teacherComprehension = 0

      teacher.learners.forEach(learner => {
        teacherSessions += learner.progress.length
        learner.progress.forEach(p => {
          teacherAccuracy += p.accuracy
          teacherComprehension += p.comprehension
        })
      })

      totalSessions += teacherSessions
      totalAccuracy += teacherAccuracy
      totalComprehension += teacherComprehension

      const avgAccuracy = teacherSessions > 0 
        ? (teacherAccuracy / teacherSessions).toFixed(1)
        : '0.0'
      
      const avgComprehension = teacherSessions > 0 
        ? (teacherComprehension / teacherSessions).toFixed(1)
        : '0.0'

      return {
        id: teacher.id,
        username: teacher.username,
        learnerCount,
        sessionCount: teacherSessions,
        avgAccuracy,
        avgComprehension
      }
    })

    // 3. Calculate overall averages
    const overallAvgAccuracy = totalSessions > 0 
      ? (totalAccuracy / totalSessions).toFixed(1)
      : '0.0'
    
    const overallAvgComprehension = totalSessions > 0 
      ? (totalComprehension / totalSessions).toFixed(1)
      : '0.0'

    return NextResponse.json({
      totalTeachers: teachers.length,
      totalLearners,
      totalSessions,
      overallAvgAccuracy,
      overallAvgComprehension,
      teacherStats
    })

  } catch (error) {
    console.error('Head dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}