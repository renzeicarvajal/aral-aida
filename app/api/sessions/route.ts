import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { learnerId, date, status, accuracy, comprehension, notes } = body

    await prisma.attendance.create({
      data: {
        learnerId: parseInt(learnerId),
        date: new Date(date),
        status: status,
      }
    })

    if (status === 'Present') {
      await prisma.progress.create({
        data: {
          learnerId: parseInt(learnerId),
          sessionDate: new Date(date),
          accuracy: parseFloat(accuracy),
          comprehension: parseFloat(comprehension),
          notes: notes || null,
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session log error:', error)
    return NextResponse.json({ error: 'Failed to log session' }, { status: 500 })
  }
}


export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get('learnerId')
  if (!learnerId) return NextResponse.json({ error: 'Missing learnerId' }, { status: 400 })

  const progresses = await prisma.progress.findMany({
    where: { learnerId: parseInt(learnerId) },
    orderBy: { sessionDate: 'desc' }
  })

  const attendances = await prisma.attendance.findMany({
    where: { learnerId: parseInt(learnerId) },
    orderBy: { date: 'desc' }
  })

  const formattedSessions = attendances.map(att => {
    const attDate = new Date(att.date).toISOString().split('T')[0]
    
    const matchingProgress = progresses.find(p => {
      const pDate = new Date(p.sessionDate).toISOString().split('T')[0]
      return pDate === attDate
    })

    return {
      attendanceId: att.id,
      progressId: matchingProgress?.id || null,
      sessionDate: att.date,
      status: matchingProgress ? 'Present' : att.status, // Upgrade to Present if progress exists
      accuracy: matchingProgress?.accuracy || null,
      comprehension: matchingProgress?.comprehension || null,
      notes: matchingProgress?.notes || null,
    }
  })

  const attendanceDates = new Set(attendances.map(a => new Date(a.date).toISOString().split('T')[0]))
  
  const legacyPresentSessions = progresses
    .filter(p => {
      const pDate = new Date(p.sessionDate).toISOString().split('T')[0]
      return !attendanceDates.has(pDate)
    })
    .map(p => ({
      attendanceId: null,
      progressId: p.id,
      sessionDate: p.sessionDate,
      status: 'Present',
      accuracy: p.accuracy,
      comprehension: p.comprehension,
      notes: p.notes,
    }))

  const allSessions = [...formattedSessions, ...legacyPresentSessions].sort((a, b) => {
    return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  })

  return NextResponse.json(allSessions)
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { progressId, accuracy, comprehension, notes } = body

    await prisma.progress.update({
      where: { id: parseInt(progressId) },
      data: {
        accuracy: parseFloat(accuracy),
        comprehension: parseFloat(comprehension),
        notes: notes || null,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const attendanceId = request.nextUrl.searchParams.get('attendanceId')
    const progressId = request.nextUrl.searchParams.get('progressId')

    if (progressId) {
      await prisma.progress.delete({ where: { id: parseInt(progressId) } })
    }
    if (attendanceId) {
      await prisma.attendance.delete({ where: { id: parseInt(attendanceId) } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session delete error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}