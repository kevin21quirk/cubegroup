import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a default admin user
  const user = await prisma.user.upsert({
    where: { email: 'admin@cubegroup.com' },
    update: {},
    create: {
      clerkId: 'system_admin',
      email: 'admin@cubegroup.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
    },
  })

  console.log('✅ Seed data created successfully')
  console.log('Default user:', user.email)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
