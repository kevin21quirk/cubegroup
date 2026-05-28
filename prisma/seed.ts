import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a default admin user
  const adminUser = await prisma.user.upsert({
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
  console.log('✅ Admin user created:', adminUser.email)

  // Create a default umbrella company
  const umbrellaCompany = await prisma.umbrellaCompany.upsert({
    where: { name: 'Cube Umbrella Ltd' },
    update: {},
    create: {
      name: 'Cube Umbrella Ltd',
      contactEmail: 'info@cubeumbrella.co.uk',
      registrationNumber: '12345678',
      processingFee: 25.00,
      address: '1 Cube Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
    },
  })
  console.log('✅ Umbrella company created:', umbrellaCompany.name)

  // Create a sample client company
  const sampleCompany = await prisma.company.upsert({
    where: { registrationNumber: 'SAMPLE001' },
    update: {},
    create: {
      name: 'Sample Construction Ltd',
      registrationNumber: 'SAMPLE001',
      industry: 'Construction',
      payrollFrequency: 'Weekly',
      paymentTerms: 30,
      onboardingStatus: 'Active',
      umbrellaCompanyId: umbrellaCompany.id,
      createdById: adminUser.id,
      billingAddress: '123 Sample Lane',
      billingCity: 'London',
      billingPostcode: 'EC1A 1BB',
      emailDomains: ['sampleconstruction.co.uk'],
      emailKeywords: ['payroll', 'timesheet', 'weekly hours'],
      remoteFolder: 'AI-Incoming/SampleConstruction',
    },
  })
  console.log('✅ Sample company created:', sampleCompany.name)

  console.log('🎉 Seed data created successfully!')
  console.log('')
  console.log('📝 Login Credentials:')
  console.log('   Email:    kevin@aibridgesolutions.co.uk')
  console.log('   Password: a15Dz6fl!')
  console.log('   Company:  Sample Construction Ltd (or any)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
