import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create Institutions
  const inst1 = await prisma.institution.upsert({
    where: { code: 'TTC' },
    update: {},
    create: {
      name: 'Tech Training Center',
      code: 'TTC',
    },
  });

  const inst2 = await prisma.institution.upsert({
    where: { code: 'SA' },
    update: {},
    create: {
      name: 'Skill Academy',
      code: 'SA',
    },
  });

  const inst3 = await prisma.institution.upsert({
    where: { code: 'DIA' },
    update: {},
    create: {
      name: 'Digital Innovation Academy',
      code: 'DIA',
    },
  });

  console.log('✅ Institutions created:', inst1.name, inst2.name, inst3.name);

  // Create Batches
  const batch1 = await prisma.batch.create({
    data: {
      name: 'Full Stack Development - Batch 5',
      institutionId: inst1.id,
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      name: 'Data Science Fundamentals - Batch 3',
      institutionId: inst1.id,
    },
  });

  const batch3 = await prisma.batch.create({
    data: {
      name: 'Cloud Computing - Batch 2',
      institutionId: inst2.id,
    },
  });

  const batch4 = await prisma.batch.create({
    data: {
      name: 'UI/UX Design - Batch 1',
      institutionId: inst2.id,
    },
  });

  const batch5 = await prisma.batch.create({
    data: {
      name: 'AI/ML Engineering - Batch 1',
      institutionId: inst3.id,
    },
  });

  console.log('✅ Batches created');

  console.log('\n📝 Seed data summary:');
  console.log(`   Institutions: 3`);
  console.log(`   Batches: 5`);
  console.log('\n⚠️  Note: Users must be created via Clerk signup flow.');
  console.log('   After signing up, users will be assigned to institutions and batches.');
  console.log('   Use the following test accounts as documented in the PRD:');
  console.log('   - student@skillbridge.test (Student)');
  console.log('   - trainer@skillbridge.test (Trainer)');
  console.log('   - institution@skillbridge.test (Institution)');
  console.log('   - manager@skillbridge.test (Programme Manager)');
  console.log('   - monitor@skillbridge.test (Monitoring Officer)');
  console.log('\n🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
