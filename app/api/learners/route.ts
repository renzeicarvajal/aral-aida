import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const learners = await prisma.learner.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(learners)
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, grade, section, philIriLevel, userId } = body

    const newLearner = await prisma.learner.create({
      data: { 
        name, 
        grade: parseInt(grade), 
        section, 
        philIriLevel, 
        userId: parseInt(userId) 
      }
    })
    return NextResponse.json(newLearner)
  } catch (error) {
    console.error('Add learner error:', error)
    return NextResponse.json({ error: 'Failed to add learner' }, { status: 500 })
  }
}

// PUT
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, grade, section, philIriLevel } = body

    const updatedLearner = await prisma.learner.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        grade: parseInt(grade), 
        section, 
        philIriLevel 
      }
    })
    return NextResponse.json(updatedLearner)
  } catch (error) {
    console.error('Update learner error:', error)
    return NextResponse.json({ error: 'Failed to update learner' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing learner id' }, { status: 400 })

    await prisma.learner.delete({
      where: { id: parseInt(id) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete learner error:', error)
    return NextResponse.json({ error: 'Failed to delete learner' }, { status: 500 })
  }
}