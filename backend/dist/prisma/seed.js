"use strict";
// backend/prisma/seed.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    // Clear existing data
    await prisma.ledgerEntry.deleteMany();
    await prisma.voucherItem.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleared existing data');
    const passwordHash = await bcrypt_1.default.hash('password123', 10);
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
    // Create Bank Accounts (Global)
    const bankHDFC = await prisma.account.create({
        data: {
            name: 'Bank Account - HDFC',
            type: 'ASSET',
            openingBalance: 0, // Opening balance for global accounts should be 0, users add their own via vouchers or we handle it differently. 
            // Actually, for simplicity in this demo, let's keep opening balance but it will be visible to everyone as a "starting point" if we include it in balance calc. 
            // BETTER: Global accounts have 0 opening balance. Users create "Capital" vouchers to add money.
        },
    });
    const cash = await prisma.account.create({
        data: {
            name: 'Cash in Hand',
            type: 'ASSET',
            openingBalance: 0,
        },
    });
    // Create Income Accounts (Global)
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
    // Create Expense Accounts (Global)
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
    // Create GST Accounts (Global)
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
    // Create Capital Account (Global)
    const capital = await prisma.account.create({
        data: {
            name: 'Capital Account',
            type: 'LIABILITY',
            openingBalance: 0,
        },
    });
    console.log('✅ Created global system accounts');
    // Create Customers (Global)
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
    console.log('✅ Created global customers');
    // Create Suppliers (Global)
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
    console.log('✅ Created global suppliers');
    // --- VOUCHERS ---
    // 1. Sales Voucher (Credit Sale)
    // Sold goods to Customer 1 (Reliance)
    // Base: 100,000, GST: 18% (18,000), Total: 118,000
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'SV-0001',
            type: 'SALES',
            date: new Date('2024-01-15'),
            partyId: customer1.id,
            narration: 'Sales of IT Equipment',
            totalAmount: 118000,
            items: {
                create: [
                    {
                        description: 'Dell Latitude Laptop',
                        quantity: 2,
                        rate: 50000,
                        amount: 100000,
                        gstRate: 18,
                        gstAmount: 18000,
                        total: 118000,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: customer1.id, debit: 118000, credit: 0, date: new Date('2024-01-15') }, // Debit Party
                    { userId: accountant.id, accountId: salesAccount.id, debit: 0, credit: 100000, date: new Date('2024-01-15') }, // Credit Sales
                    { userId: accountant.id, accountId: outputGST.id, debit: 0, credit: 18000, date: new Date('2024-01-15') }, // Credit GST
                ]
            }
        }
    });
    // 2. Sales Voucher (Credit Sale)
    // Sold to Customer 2 (TCS)
    // Base: 50,000, GST: 18% (9,000), Total: 59,000
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'SV-0002',
            type: 'SALES',
            date: new Date('2024-01-20'),
            partyId: customer2.id,
            narration: 'Software License Fees',
            totalAmount: 59000,
            items: {
                create: [
                    {
                        description: 'Annual License',
                        quantity: 1,
                        rate: 50000,
                        amount: 50000,
                        gstRate: 18,
                        gstAmount: 9000,
                        total: 59000,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: customer2.id, debit: 59000, credit: 0, date: new Date('2024-01-20') },
                    { userId: accountant.id, accountId: salesAccount.id, debit: 0, credit: 50000, date: new Date('2024-01-20') },
                    { userId: accountant.id, accountId: outputGST.id, debit: 0, credit: 9000, date: new Date('2024-01-20') },
                ]
            }
        }
    });
    // 3. Purchase Voucher (Credit Purchase)
    // Bought from Supplier 1 (ABC)
    // Base: 50,000, GST: 18% (9,000), Total: 59,000
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'PV-0001',
            type: 'PURCHASE',
            date: new Date('2024-01-10'),
            partyId: supplier1.id,
            narration: 'Purchase of Office Supplies',
            totalAmount: 59000,
            items: {
                create: [
                    {
                        description: 'Office Chairs',
                        quantity: 10,
                        rate: 5000,
                        amount: 50000,
                        gstRate: 18,
                        gstAmount: 9000,
                        total: 59000,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: purchaseAccount.id, debit: 50000, credit: 0, date: new Date('2024-01-10') }, // Debit Purchase
                    { userId: accountant.id, accountId: inputGST.id, debit: 9000, credit: 0, date: new Date('2024-01-10') }, // Debit Input GST
                    { userId: accountant.id, accountId: supplier1.id, debit: 0, credit: 59000, date: new Date('2024-01-10') }, // Credit Party
                ]
            }
        }
    });
    // 4. Receipt Voucher (Received Payment)
    // Received 50,000 from Customer 1 (Reliance) into HDFC Bank
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'RC-0001',
            type: 'RECEIPT',
            date: new Date('2024-02-01'),
            partyId: customer1.id,
            narration: 'Partial payment received via NEFT',
            totalAmount: 50000,
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: bankHDFC.id, debit: 50000, credit: 0, date: new Date('2024-02-01') }, // Debit Bank
                    { userId: accountant.id, accountId: customer1.id, debit: 0, credit: 50000, date: new Date('2024-02-01') }, // Credit Customer
                ]
            }
        }
    });
    // 5. Payment Voucher (Made Payment)
    // Paid 20,000 to Supplier 1 (ABC) from HDFC Bank
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'PY-0001',
            type: 'PAYMENT',
            date: new Date('2024-02-05'),
            partyId: supplier1.id,
            narration: 'Part payment via Cheque',
            totalAmount: 20000,
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: supplier1.id, debit: 20000, credit: 0, date: new Date('2024-02-05') }, // Debit Supplier
                    { userId: accountant.id, accountId: bankHDFC.id, debit: 0, credit: 20000, date: new Date('2024-02-05') }, // Credit Bank
                ]
            }
        }
    });
    // 6. Payment Voucher (Expense Payment)
    // Paid Rent 10,000 from Cash
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'PY-0002',
            type: 'PAYMENT',
            date: new Date('2024-02-01'),
            narration: 'Office Rent for Jan',
            totalAmount: 10000,
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: rentExpense.id, debit: 10000, credit: 0, date: new Date('2024-02-01') }, // Debit Expense
                    { userId: accountant.id, accountId: cash.id, debit: 0, credit: 10000, date: new Date('2024-02-01') }, // Credit Cash
                ]
            }
        }
    });
    // --- ADDITIONAL VOUCHERS FOR OTHER PARTIES ---
    // 7. Sales Voucher - Customer 3 (Infosys)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'SV-0003',
            type: 'SALES',
            date: new Date('2024-01-25'),
            partyId: customer3.id,
            narration: 'Consulting Services',
            totalAmount: 236000,
            items: {
                create: [
                    {
                        description: 'IT Consulting',
                        quantity: 1,
                        rate: 200000,
                        amount: 200000,
                        gstRate: 18,
                        gstAmount: 36000,
                        total: 236000,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: customer3.id, debit: 236000, credit: 0, date: new Date('2024-01-25') },
                    { userId: accountant.id, accountId: serviceIncome.id, debit: 0, credit: 200000, date: new Date('2024-01-25') },
                    { userId: accountant.id, accountId: outputGST.id, debit: 0, credit: 36000, date: new Date('2024-01-25') },
                ]
            }
        }
    });
    // 8. Sales Voucher - Customer 4 (Wipro)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'SV-0004',
            type: 'SALES',
            date: new Date('2024-02-02'),
            partyId: customer4.id,
            narration: 'Hardware Supply',
            totalAmount: 88500,
            items: {
                create: [
                    {
                        description: 'Server Rack',
                        quantity: 1,
                        rate: 75000,
                        amount: 75000,
                        gstRate: 18,
                        gstAmount: 13500,
                        total: 88500,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: customer4.id, debit: 88500, credit: 0, date: new Date('2024-02-02') },
                    { userId: accountant.id, accountId: salesAccount.id, debit: 0, credit: 75000, date: new Date('2024-02-02') },
                    { userId: accountant.id, accountId: outputGST.id, debit: 0, credit: 13500, date: new Date('2024-02-02') },
                ]
            }
        }
    });
    // 9. Sales Voucher - Customer 5 (HCL)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'SV-0005',
            type: 'SALES',
            date: new Date('2024-02-10'),
            partyId: customer5.id,
            narration: 'Maintenance Contract',
            totalAmount: 118000,
            items: {
                create: [
                    {
                        description: 'AMC Charges',
                        quantity: 1,
                        rate: 100000,
                        amount: 100000,
                        gstRate: 18,
                        gstAmount: 18000,
                        total: 118000,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: customer5.id, debit: 118000, credit: 0, date: new Date('2024-02-10') },
                    { userId: accountant.id, accountId: serviceIncome.id, debit: 0, credit: 100000, date: new Date('2024-02-10') },
                    { userId: accountant.id, accountId: outputGST.id, debit: 0, credit: 18000, date: new Date('2024-02-10') },
                ]
            }
        }
    });
    // 10. Purchase Voucher - Supplier 2 (XYZ Traders)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'PV-0002',
            type: 'PURCHASE',
            date: new Date('2024-01-12'),
            partyId: supplier2.id,
            narration: 'Purchase of Raw Materials',
            totalAmount: 118000,
            items: {
                create: [
                    {
                        description: 'Steel Sheets',
                        quantity: 50,
                        rate: 2000,
                        amount: 100000,
                        gstRate: 18,
                        gstAmount: 18000,
                        total: 118000,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: purchaseAccount.id, debit: 100000, credit: 0, date: new Date('2024-01-12') },
                    { userId: accountant.id, accountId: inputGST.id, debit: 18000, credit: 0, date: new Date('2024-01-12') },
                    { userId: accountant.id, accountId: supplier2.id, debit: 0, credit: 118000, date: new Date('2024-01-12') },
                ]
            }
        }
    });
    // 11. Purchase Voucher - Supplier 3 (PQR Enterprises)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'PV-0003',
            type: 'PURCHASE',
            date: new Date('2024-01-18'),
            partyId: supplier3.id,
            narration: 'Packaging Material',
            totalAmount: 29500,
            items: {
                create: [
                    {
                        description: 'Boxes',
                        quantity: 1000,
                        rate: 25,
                        amount: 25000,
                        gstRate: 18,
                        gstAmount: 4500,
                        total: 29500,
                    }
                ]
            },
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: purchaseAccount.id, debit: 25000, credit: 0, date: new Date('2024-01-18') },
                    { userId: accountant.id, accountId: inputGST.id, debit: 4500, credit: 0, date: new Date('2024-01-18') },
                    { userId: accountant.id, accountId: supplier3.id, debit: 0, credit: 29500, date: new Date('2024-01-18') },
                ]
            }
        }
    });
    // 12. Receipt Voucher - Customer 3 (Infosys)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'RC-0002',
            type: 'RECEIPT',
            date: new Date('2024-02-15'),
            partyId: customer3.id,
            narration: 'Full payment received',
            totalAmount: 236000,
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: bankHDFC.id, debit: 236000, credit: 0, date: new Date('2024-02-15') },
                    { userId: accountant.id, accountId: customer3.id, debit: 0, credit: 236000, date: new Date('2024-02-15') },
                ]
            }
        }
    });
    // 13. Payment Voucher - Supplier 2 (XYZ Traders)
    await prisma.voucher.create({
        data: {
            userId: accountant.id,
            voucherNumber: 'PY-0003',
            type: 'PAYMENT',
            date: new Date('2024-02-20'),
            partyId: supplier2.id,
            narration: 'Payment via Bank Transfer',
            totalAmount: 118000,
            ledgerEntries: {
                create: [
                    { userId: accountant.id, accountId: supplier2.id, debit: 118000, credit: 0, date: new Date('2024-02-20') },
                    { userId: accountant.id, accountId: bankHDFC.id, debit: 0, credit: 118000, date: new Date('2024-02-20') },
                ]
            }
        }
    });
    console.log('✅ Created vouchers');
    console.log('🎉 Seed completed successfully!');
    console.log(`
  📊 Summary:
  - Users: 2 (Accountant, Manager)
  - System Accounts: 11 (Assigned to Accountant)
  - Customers: 5 (Assigned to Accountant)
  - Suppliers: 3 (Assigned to Accountant)
  - Vouchers: 6 (Sales, Purchase, Receipt, Payment)
  
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
