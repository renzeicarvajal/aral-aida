import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  
  const hashedHeadPassword = await bcrypt.hash('admin123', 10)
  const hashedTeacherPassword = await bcrypt.hash('teacher123', 10)

  
  const head = await prisma.user.upsert({
    where: { username: 'head' },
    update: {},
    create: {
      username: 'head',
      password: hashedHeadPassword,
      role: 'Head',
    },
  })

  
  const teacher = await prisma.user.upsert({
    where: { username: 'teacher' },
    update: {},
    create: {
      username: 'teacher',
      password: hashedTeacherPassword,
      role: 'Teacher',
    },
  })

  console.log(' Seed completed successfully!')
  console.log(`   School Head: username "head", password "admin123"`)
  console.log(`   Teacher: username "teacher", password "teacher123"`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })