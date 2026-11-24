import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET: Fetch all teachers
export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'Teacher' },
      select: { id: true, username: true, role: true },
      orderBy: { username: 'asc' }
    })
    return NextResponse.json(teachers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }
}

// POST: Create a new teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newTeacher = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'Teacher'
      }
    })

    return NextResponse.json(newTeacher)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 })
  }
}

// PUT: Update a teacher's username or password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, username, password } = body

    const updateData: any = { username }
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedTeacher = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json(updatedTeacher)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}

// DELETE: Delete a teacher
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing teacher id' }, { status: 400 })

    // Note: If your schema has onDelete: Cascade for Learners, this will automatically delete their students too.
    await prisma.user.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 })
  }
}