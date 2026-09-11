const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting RecordVault Ledger Seeding ---');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.passwordResetOtp.deleteMany();
  await prisma.record.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const userPasswordHash = await bcrypt.hash('User1234!', 10);

  const mayurAdmin = await prisma.user.create({
    data: {
      name: 'Mayur Gawas',
      email: 'mayurgawas0025@gmail.com',
      password_hash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  const sarahUser = await prisma.user.create({
    data: {
      name: 'Sarah Chen',
      email: 'user@recordvault.internal',
      password_hash: userPasswordHash,
      role: 'USER'
    }
  });

  const johnUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@gmail.com',
      password_hash: userPasswordHash,
      role: 'USER'
    }
  });

  console.log(`Created Admin User: ${mayurAdmin.email}`);
  console.log(`Created Standard User: ${sarahUser.email}`);
  console.log(`Created Standard User: ${johnUser.email}`);

  const userList = [mayurAdmin, sarahUser, johnUser];

  const categories = [
    'Architecture',
    'Feature Spec',
    'QA Test Suite',
    'Bug Docket',
    'Release Build',
    'Security Audit',
    'API Spec'
  ];

  const statuses = ['active', 'archived'];

  const sampleTitles = [
    'System Architecture Plan',
    'User Authentication Spec',
    'QA Regression Test Suite',
    'API Gateway Contract',
    'Database Performance Plan',
    'Security Audit Report',
    'Billing & Payments Spec',
    'Container Security Manifest',
    'Frontend UI Spec',
    'Release Manifest v1.0'
  ];

  console.log('Seeding 10,000 records divided among users...');

  const batchSize = 1000;
  const totalRecords = 10000;
  const startTime = Date.now();

  for (let b = 0; b < totalRecords / batchSize; b++) {
    const recordBatch = [];
    for (let i = 0; i < batchSize; i++) {
      const index = b * batchSize + i + 1;
      const assignedOwner = userList[index % userList.length];
      const cat = categories[index % categories.length];
      const stat = statuses[index % statuses.length];
      const titleTemplate = sampleTitles[index % sampleTitles.length];
      const isSoftDeleted = index % 25 === 0; // 4% soft deleted

      recordBatch.push({
        owner_id: assignedOwner.id,
        title: `${titleTemplate} #${index}`,
        description: `Technical record #${index} with verified details and specifications.`,
        category: cat,
        status: stat,
        is_deleted: isSoftDeleted,
        deleted_at: isSoftDeleted ? new Date(Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)) : null,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000))
      });
    }

    await prisma.record.createMany({ data: recordBatch });
    console.log(`Seeded batch ${b + 1} / ${totalRecords / batchSize} (${(b + 1) * batchSize} records)`);
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`Successfully seeded ${totalRecords} records divided among 3 users in ${elapsed.toFixed(2)}s`);
  console.log('--- Record Vault Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
