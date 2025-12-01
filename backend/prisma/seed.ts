// backend/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.ledgerEntry.deleteMany();
  await prisma.voucherItem.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Users
  const accountant = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'accountant@company.com',
      role: 'ACCOUNTANT',
      passwordHash,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'manager@company.com',
      role: 'MANAGER',
      passwordHash,
    },
  });

  console.log('✅ Created users');

  // Create Bank Accounts
  const bankHDFC = await prisma.account.create({
    data: {
      name: 'Bank Account - HDFC',
      type: 'ASSET',
      openingBalance: 500000,
    },
  });

  const cash = await prisma.account.create({
    data: {
      name: 'Cash in Hand',
      type: 'ASSET',
      openingBalance: 50000,
    },
  });

  // Create Income Accounts
  const salesAccount = await prisma.account.create({
    data: {
      name: 'Sales Account',
      type: 'INCOME',
    },
  });

  const serviceIncome = await prisma.account.create({
    data: {
      name: 'Service Income',
      type: 'INCOME',
    },
  });

  // Create Expense Accounts
  const purchaseAccount = await prisma.account.create({
    data: {
      name: 'Purchase Account',
      type: 'EXPENSE',
    },
  });

  const rentExpense = await prisma.account.create({
    data: {
      name: 'Rent Expense',
      type: 'EXPENSE',
    },
  });

  const salaryExpense = await prisma.account.create({
    data: {
      name: 'Salary Expense',
      type: 'EXPENSE',
    },
  });

  const electricityExpense = await prisma.account.create({
    data: {
      name: 'Electricity Expense',
      type: 'EXPENSE',
    },
  });

  // Create GST Accounts
  const outputGST = await prisma.account.create({
    data: {
      name: 'Output GST',
      type: 'LIABILITY',
    },
  });

  const inputGST = await prisma.account.create({
    data: {
      name: 'Input GST',
      type: 'ASSET',
    },
  });

  // Create Capital Account
  const capital = await prisma.account.create({
    data: {
      name: 'Capital Account',
      type: 'LIABILITY',
      openingBalance: 1000000,
    },
  });

  console.log('✅ Created system accounts');

  // Create Customers (Debtors)
  const customer1 = await prisma.account.create({
    data: {
      name: 'Reliance Industries Ltd',
      type: 'ASSET',
      isParty: true,
      gstNumber: '27AAACR5055K1Z5',
    },
  });

  const customer2 = await prisma.account.create({
    data: {
      name: 'Tata Consultancy Services',
      type: 'ASSET',
      isParty: true,
      gstNumber: '27AAACT2727Q1ZV',
    },
  });

  const customer3 = await prisma.account.create({
    data: {
      name: 'Infosys Limited',
      type: 'ASSET',
      isParty: true,
      gstNumber: '29AAACI1681G1ZA',
    },
  });

  const customer4 = await prisma.account.create({
    data: {
      name: 'Wipro Limited',
      type: 'ASSET',
      isParty: true,
      gstNumber: '29AAACW3775F000',
    },
  });

  const customer5 = await prisma.account.create({
    data: {
      name: 'HCL Technologies',
      type: 'ASSET',
      isParty: true,
      gstNumber: '06AAACH2702H1Z0',
    },
  });

  console.log('✅ Created customers');

  // Create Suppliers (Creditors)
  const supplier1 = await prisma.account.create({
    data: {
      name: 'ABC Suppliers',
      type: 'LIABILITY',
      isParty: true,
      gstNumber: '27AABCA1234B1Z1',
    },
  });

  const supplier2 = await prisma.account.create({
    data: {
      name: 'XYZ Traders',
      type: 'LIABILITY',
      isParty: true,
      gstNumber: '27AABCX5678C1Z2',
    },
  });

  const supplier3 = await prisma.account.create({
    data: {
      name: 'PQR Enterprises',
      type: 'LIABILITY',
      isParty: true,
      gstNumber: '29AABCP9012D1Z3',
    },
  });

  console.log('✅ Created suppliers');

  console.log('🎉 Seed completed successfully!');
  console.log(`
  📊 Summary:
  - Users: 2 (Accountant, Manager)
  - System Accounts: 11
  - Customers: 5
  - Suppliers: 3
  
  🚀 You can now start creating vouchers!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });