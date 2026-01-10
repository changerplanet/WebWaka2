/**
 * LEGAL PRACTICE SUITE — Demo Data Seeder
 * Phase 7B.1, S5 Admin UI + Demo Data
 * 
 * Creates Nigerian law firm demo data for testing and demonstration.
 * 
 * Run: npx ts-node scripts/seed-legal-practice-demo.ts
 * Or: npx tsx scripts/seed-legal-practice-demo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo Tenant ID - use existing demo tenant or create one
const DEMO_TENANT_ID = 'demo-legal-practice-tenant';
const DEMO_PLATFORM_INSTANCE_ID = 'demo-legal-practice-instance';

// Nigerian Law Firm Data
const NIGERIAN_LAWYERS = [
  { id: 'lawyer-1', name: 'Barr. Adaeze Nwosu', role: 'Partner', rate: 50000 },
  { id: 'lawyer-2', name: 'Barr. Chidi Okoro', role: 'Senior Associate', rate: 40000 },
  { id: 'lawyer-3', name: 'Barr. Funmi Adeola', role: 'Associate', rate: 30000 },
  { id: 'lawyer-4', name: 'Barr. Emeka Obi', role: 'Partner', rate: 60000 },
];

const NIGERIAN_CLIENTS = [
  { id: 'client-1', name: 'Chief Emeka Okafor', type: 'individual', phone: '08033445566', email: 'chief.okafor@email.com' },
  { id: 'client-2', name: 'Zenith Bank Plc', type: 'corporate', phone: '07012345678', email: 'legal@zenithbank.com' },
  { id: 'client-3', name: 'Mr. Tunde Adebayo', type: 'individual', phone: '08098765432', email: 'tunde.adebayo@email.com' },
  { id: 'client-4', name: 'NaijaTech Solutions Ltd', type: 'corporate', phone: '09011223344', email: 'legal@naijatech.ng' },
  { id: 'client-5', name: 'Mrs. Aisha Mohammed', type: 'individual', phone: '08055667788', email: 'aisha.mohammed@email.com' },
  { id: 'client-6', name: 'ABC Construction Ltd', type: 'corporate', phone: '08099887766', email: 'info@abcconstruction.ng' },
  { id: 'client-7', name: 'Dr. Ngozi Eze', type: 'individual', phone: '08044556677', email: 'ngozi.eze@medical.ng' },
  { id: 'client-8', name: 'Dangote Industries Ltd', type: 'corporate', phone: '07088990011', email: 'legal@dangote.com' },
];

const NIGERIAN_COURTS = [
  'Federal High Court, Lagos',
  'Federal High Court, Abuja',
  'Lagos State High Court, Ikeja',
  'Lagos State High Court, Lagos Island',
  'Court of Appeal, Lagos Division',
  'Court of Appeal, Abuja Division',
  'Supreme Court of Nigeria',
  'National Industrial Court, Lagos',
  'Customary Court, Abuja',
  'High Court of FCT, Abuja',
];

async function seedLegalPracticeDemo() {
  console.log('🏛️ Starting Legal Practice Suite Demo Data Seeding...\n');

  try {
    // Clean existing demo data
    console.log('🧹 Cleaning existing demo data...');
    await prisma.leg_retainer_transaction.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_retainer.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_time_entry.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_deadline.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_disbursement.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_filing.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_document.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_matter_party.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.leg_matter.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });

    // Seed Matters (10 matters)
    console.log('📋 Creating matters...');
    const matters = await Promise.all([
      prisma.leg_matter.create({
        data: {
          id: 'matter-1',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0001',
          title: 'Chief Okafor v. ABC Construction Ltd - Breach of Contract',
          description: 'Civil suit for breach of construction contract. Client seeking damages for incomplete work.',
          matterType: 'CIVIL',
          status: 'ACTIVE',
          practiceArea: 'Civil Litigation',
          clientId: 'client-1',
          clientName: 'Chief Emeka Okafor',
          clientPhone: '08033445566',
          clientEmail: 'chief.okafor@email.com',
          court: 'Federal High Court, Lagos',
          division: 'Civil Division',
          suitNumber: 'FHC/L/CS/245/2026',
          judgeRef: 'Hon. Justice A.O. Faji',
          billingType: 'RETAINER',
          agreedFee: 5000000,
          retainerAmount: 2000000,
          leadLawyerId: 'lawyer-1',
          leadLawyerName: 'Barr. Adaeze Nwosu',
          openDate: new Date('2026-01-02'),
          tags: ['construction', 'breach', 'damages'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-2',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0002',
          title: 'State v. Mr. Adebayo - Criminal Defense',
          description: 'Criminal defense case. Client accused of financial misconduct.',
          matterType: 'CRIMINAL',
          status: 'ACTIVE',
          practiceArea: 'Criminal Defense',
          clientId: 'client-3',
          clientName: 'Mr. Tunde Adebayo',
          clientPhone: '08098765432',
          clientEmail: 'tunde.adebayo@email.com',
          court: 'Lagos State High Court, Ikeja',
          division: 'Criminal Division',
          suitNumber: 'ID/234C/2025',
          judgeRef: 'Hon. Justice B.T. Benson',
          billingType: 'RETAINER',
          agreedFee: 3000000,
          retainerAmount: 1500000,
          leadLawyerId: 'lawyer-2',
          leadLawyerName: 'Barr. Chidi Okoro',
          openDate: new Date('2025-11-15'),
          tags: ['criminal', 'defense', 'financial'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-3',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0003',
          title: 'Zenith Bank Plc v. Pinnacle Enterprises - Loan Recovery',
          description: 'Banking litigation for recovery of outstanding loan facility.',
          matterType: 'BANKING',
          status: 'ACTIVE',
          practiceArea: 'Banking & Finance',
          clientId: 'client-2',
          clientName: 'Zenith Bank Plc',
          clientPhone: '07012345678',
          clientEmail: 'legal@zenithbank.com',
          court: 'Court of Appeal, Lagos Division',
          division: 'Commercial Division',
          suitNumber: 'CA/L/456/2025',
          judgeRef: 'Hon. Justice C.N. Uwa',
          billingType: 'HOURLY',
          agreedFee: 8000000,
          retainerAmount: 5000000,
          leadLawyerId: 'lawyer-1',
          leadLawyerName: 'Barr. Adaeze Nwosu',
          openDate: new Date('2025-09-20'),
          tags: ['banking', 'loan', 'recovery', 'appeal'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-4',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2025-0089',
          title: 'NaijaTech Solutions - Trademark Registration',
          description: 'Intellectual property matter for trademark registration of company logo and name.',
          matterType: 'INTELLECTUAL_PROPERTY',
          status: 'ON_HOLD',
          practiceArea: 'Intellectual Property',
          clientId: 'client-4',
          clientName: 'NaijaTech Solutions Ltd',
          clientPhone: '09011223344',
          clientEmail: 'legal@naijatech.ng',
          billingType: 'FLAT_FEE',
          agreedFee: 500000,
          retainerAmount: 500000,
          leadLawyerId: 'lawyer-3',
          leadLawyerName: 'Barr. Funmi Adeola',
          openDate: new Date('2025-06-10'),
          tags: ['trademark', 'registration', 'ip'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-5',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2025-0045',
          title: 'Mrs. Aisha Mohammed - Divorce Proceedings',
          description: 'Family law matter for dissolution of marriage and property settlement.',
          matterType: 'FAMILY',
          status: 'CLOSED',
          practiceArea: 'Family Law',
          clientId: 'client-5',
          clientName: 'Mrs. Aisha Mohammed',
          clientPhone: '08055667788',
          clientEmail: 'aisha.mohammed@email.com',
          court: 'Customary Court, Abuja',
          suitNumber: 'CCA/FCT/78/2025',
          billingType: 'RETAINER',
          agreedFee: 1000000,
          leadLawyerId: 'lawyer-3',
          leadLawyerName: 'Barr. Funmi Adeola',
          openDate: new Date('2025-03-15'),
          closeDate: new Date('2025-12-20'),
          tags: ['family', 'divorce', 'property'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-6',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0004',
          title: 'Dr. Ngozi Eze - Medical Malpractice Defense',
          description: 'Defense of medical practitioner in malpractice claim.',
          matterType: 'CIVIL',
          status: 'ACTIVE',
          practiceArea: 'Medical Law',
          clientId: 'client-7',
          clientName: 'Dr. Ngozi Eze',
          clientPhone: '08044556677',
          clientEmail: 'ngozi.eze@medical.ng',
          court: 'Lagos State High Court, Lagos Island',
          suitNumber: 'LD/789/2026',
          billingType: 'RETAINER',
          agreedFee: 2500000,
          retainerAmount: 1000000,
          leadLawyerId: 'lawyer-4',
          leadLawyerName: 'Barr. Emeka Obi',
          openDate: new Date('2026-01-05'),
          tags: ['medical', 'malpractice', 'defense'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-7',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0005',
          title: 'Dangote Industries - Employment Dispute',
          description: 'Employment matter involving wrongful termination claim by former executive.',
          matterType: 'EMPLOYMENT',
          status: 'ACTIVE',
          practiceArea: 'Employment Law',
          clientId: 'client-8',
          clientName: 'Dangote Industries Ltd',
          clientPhone: '07088990011',
          clientEmail: 'legal@dangote.com',
          court: 'National Industrial Court, Lagos',
          suitNumber: 'NICN/LA/123/2026',
          billingType: 'HOURLY',
          agreedFee: 4000000,
          retainerAmount: 2000000,
          leadLawyerId: 'lawyer-2',
          leadLawyerName: 'Barr. Chidi Okoro',
          openDate: new Date('2026-01-03'),
          tags: ['employment', 'termination', 'corporate'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-8',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0006',
          title: 'Chief Okafor - Land Dispute (Lekki Property)',
          description: 'Property matter involving disputed land ownership in Lekki.',
          matterType: 'PROPERTY',
          status: 'DRAFT',
          practiceArea: 'Property Law',
          clientId: 'client-1',
          clientName: 'Chief Emeka Okafor',
          clientPhone: '08033445566',
          clientEmail: 'chief.okafor@email.com',
          billingType: 'RETAINER',
          agreedFee: 3000000,
          leadLawyerId: 'lawyer-4',
          leadLawyerName: 'Barr. Emeka Obi',
          openDate: new Date('2026-01-07'),
          tags: ['property', 'land', 'dispute'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-9',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2026-0007',
          title: 'ABC Construction - Tax Appeal',
          description: 'Tax matter involving appeal against FIRS assessment.',
          matterType: 'TAX',
          status: 'ACTIVE',
          practiceArea: 'Tax Law',
          clientId: 'client-6',
          clientName: 'ABC Construction Ltd',
          clientPhone: '08099887766',
          clientEmail: 'info@abcconstruction.ng',
          court: 'Tax Appeal Tribunal, Lagos',
          suitNumber: 'TAT/LZ/001/2026',
          billingType: 'FLAT_FEE',
          agreedFee: 1500000,
          leadLawyerId: 'lawyer-1',
          leadLawyerName: 'Barr. Adaeze Nwosu',
          openDate: new Date('2026-01-04'),
          tags: ['tax', 'appeal', 'firs'],
        },
      }),
      prisma.leg_matter.create({
        data: {
          id: 'matter-10',
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_PLATFORM_INSTANCE_ID,
          matterNumber: 'MAT-2025-0100',
          title: 'Zenith Bank - Arbitration (Oil & Gas Contract)',
          description: 'Commercial arbitration matter involving oil and gas supply contract.',
          matterType: 'ARBITRATION',
          status: 'CLOSED',
          practiceArea: 'Oil & Gas',
          clientId: 'client-2',
          clientName: 'Zenith Bank Plc',
          clientPhone: '07012345678',
          clientEmail: 'legal@zenithbank.com',
          court: 'Lagos Court of Arbitration',
          suitNumber: 'LCA/ARB/2025/015',
          billingType: 'HOURLY',
          agreedFee: 10000000,
          leadLawyerId: 'lawyer-4',
          leadLawyerName: 'Barr. Emeka Obi',
          openDate: new Date('2025-06-01'),
          closeDate: new Date('2025-12-15'),
          tags: ['arbitration', 'oil', 'gas', 'contract'],
        },
      }),
    ]);
    console.log(`✅ Created ${matters.length} matters`);

    // Seed Parties (20 parties)
    console.log('👥 Creating parties...');
    const parties = await Promise.all([
      // Matter 1 parties
      prisma.leg_matter_party.create({ data: { id: 'party-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', partyRole: 'CLIENT', name: 'Chief Emeka Okafor', phone: '08033445566', email: 'chief.okafor@email.com' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', partyRole: 'OPPOSING_PARTY', name: 'ABC Construction Ltd', organization: 'Construction', isAdverseParty: true } }),
      prisma.leg_matter_party.create({ data: { id: 'party-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', partyRole: 'OPPOSING_COUNSEL', name: 'Barr. James Ojo', organization: 'Ojo & Associates', isAdverseParty: true } }),
      prisma.leg_matter_party.create({ data: { id: 'party-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', partyRole: 'WITNESS', name: 'Engr. Bola Adesanya', notes: 'Site engineer who witnessed work stoppage' } }),
      // Matter 2 parties
      prisma.leg_matter_party.create({ data: { id: 'party-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', partyRole: 'CLIENT', name: 'Mr. Tunde Adebayo', phone: '08098765432', email: 'tunde.adebayo@email.com' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-6', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', partyRole: 'OPPOSING_PARTY', name: 'The State (Lagos)', organization: 'DPP Lagos State', isAdverseParty: true } }),
      // Matter 3 parties
      prisma.leg_matter_party.create({ data: { id: 'party-7', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', partyRole: 'CLIENT', name: 'Zenith Bank Plc', organization: 'Banking', phone: '07012345678', email: 'legal@zenithbank.com' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-8', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', partyRole: 'OPPOSING_PARTY', name: 'Pinnacle Enterprises Ltd', isAdverseParty: true } }),
      prisma.leg_matter_party.create({ data: { id: 'party-9', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', partyRole: 'OPPOSING_COUNSEL', name: 'Barr. Hassan Usman', organization: 'Usman & Partners', isAdverseParty: true } }),
      prisma.leg_matter_party.create({ data: { id: 'party-10', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', partyRole: 'EXPERT', name: 'Dr. Femi Olaniyan', notes: 'Banking Expert Witness' } }),
      // Matter 6 parties
      prisma.leg_matter_party.create({ data: { id: 'party-11', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', partyRole: 'CLIENT', name: 'Dr. Ngozi Eze', phone: '08044556677' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-12', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', partyRole: 'OPPOSING_PARTY', name: 'Mr. Kunle Bakare', notes: 'Plaintiff - patient family', isAdverseParty: true } }),
      prisma.leg_matter_party.create({ data: { id: 'party-13', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', partyRole: 'EXPERT', name: 'Prof. Akin Ogunleye', notes: 'Medical Expert - Cardiology' } }),
      // Matter 7 parties
      prisma.leg_matter_party.create({ data: { id: 'party-14', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', partyRole: 'CLIENT', name: 'Dangote Industries Ltd', organization: 'Manufacturing' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-15', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', partyRole: 'OPPOSING_PARTY', name: 'Mr. Charles Ibe', notes: 'Former CFO', isAdverseParty: true } }),
      // Matter 9 parties
      prisma.leg_matter_party.create({ data: { id: 'party-16', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', partyRole: 'CLIENT', name: 'ABC Construction Ltd' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-17', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', partyRole: 'OPPOSING_PARTY', name: 'Federal Inland Revenue Service', organization: 'FIRS', isAdverseParty: true } }),
      // Additional parties
      prisma.leg_matter_party.create({ data: { id: 'party-18', tenantId: DEMO_TENANT_ID, matterId: 'matter-4', partyRole: 'CLIENT', name: 'NaijaTech Solutions Ltd' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-19', tenantId: DEMO_TENANT_ID, matterId: 'matter-5', partyRole: 'CLIENT', name: 'Mrs. Aisha Mohammed' } }),
      prisma.leg_matter_party.create({ data: { id: 'party-20', tenantId: DEMO_TENANT_ID, matterId: 'matter-5', partyRole: 'OPPOSING_PARTY', name: 'Mr. Ibrahim Mohammed', notes: 'Respondent (Husband)', isAdverseParty: true } }),
    ]);
    console.log(`✅ Created ${parties.length} parties`);

    // Seed Time Entries (30 entries)
    console.log('⏱️ Creating time entries...');
    const timeEntries = await Promise.all([
      // Matter 1 time entries
      prisma.leg_time_entry.create({ data: { id: 'time-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2026-01-06'), hours: 2.5, activityType: 'RESEARCH', description: 'Legal research on precedents for breach of contract claims in construction matters', billable: true, rate: 50000, amount: 125000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2026-01-05'), hours: 4.0, activityType: 'DRAFTING', description: 'Draft motion for adjournment and supporting affidavit', billable: true, rate: 50000, amount: 200000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: false } }),
      prisma.leg_time_entry.create({ data: { id: 'time-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2026-01-04'), hours: 1.5, activityType: 'CALL', description: 'Client call to discuss case strategy and evidence gathering', billable: true, rate: 50000, amount: 75000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2026-01-03'), hours: 2.0, activityType: 'MEETING', description: 'Meeting with client at chambers to review documents', billable: true, rate: 50000, amount: 100000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      // Matter 2 time entries
      prisma.leg_time_entry.create({ data: { id: 'time-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', date: new Date('2026-01-06'), hours: 1.0, activityType: 'CALL', description: 'Client call regarding bail hearing preparation', billable: true, rate: 40000, amount: 40000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-6', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', date: new Date('2026-01-05'), hours: 3.0, activityType: 'APPEARANCE', description: 'Court appearance - Bail hearing', billable: true, rate: 40000, amount: 120000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-7', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', date: new Date('2026-01-04'), hours: 2.5, activityType: 'DRAFTING', description: 'Draft bail application and affidavit of means', billable: true, rate: 40000, amount: 100000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true } }),
      // Matter 3 time entries
      prisma.leg_time_entry.create({ data: { id: 'time-8', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', date: new Date('2026-01-06'), hours: 3.0, activityType: 'RESEARCH', description: 'Research on Court of Appeal precedents for loan recovery', billable: true, rate: 50000, amount: 150000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-9', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', date: new Date('2026-01-05'), hours: 5.0, activityType: 'DRAFTING', description: "Draft Appellant's Brief of Argument", billable: true, rate: 50000, amount: 250000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-10', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', date: new Date('2026-01-04'), hours: 2.0, activityType: 'REVIEW', description: 'Review trial court judgment and identify grounds of appeal', billable: true, rate: 50000, amount: 100000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      // Matter 6 time entries
      prisma.leg_time_entry.create({ data: { id: 'time-11', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', date: new Date('2026-01-06'), hours: 2.0, activityType: 'CONSULTATION', description: 'Initial client consultation - medical malpractice case', billable: true, rate: 60000, amount: 120000, staffId: 'lawyer-4', staffName: 'Barr. Emeka Obi', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-12', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', date: new Date('2026-01-05'), hours: 1.5, activityType: 'RESEARCH', description: 'Research on medical malpractice defenses', billable: true, rate: 60000, amount: 90000, staffId: 'lawyer-4', staffName: 'Barr. Emeka Obi', staffRole: 'Partner', approved: false } }),
      // Matter 7 time entries
      prisma.leg_time_entry.create({ data: { id: 'time-13', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', date: new Date('2026-01-06'), hours: 3.5, activityType: 'MEETING', description: 'Meeting with HR Director to review termination process', billable: true, rate: 40000, amount: 140000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-14', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', date: new Date('2026-01-05'), hours: 2.0, activityType: 'REVIEW', description: 'Review employment contract and company policies', billable: true, rate: 40000, amount: 80000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true } }),
      // Matter 9 time entries
      prisma.leg_time_entry.create({ data: { id: 'time-15', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', date: new Date('2026-01-06'), hours: 2.5, activityType: 'RESEARCH', description: 'Research on FIRS assessment procedures and grounds for appeal', billable: true, rate: 50000, amount: 125000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-16', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', date: new Date('2026-01-05'), hours: 3.0, activityType: 'DRAFTING', description: 'Draft notice of appeal to Tax Appeal Tribunal', billable: true, rate: 50000, amount: 150000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      // More entries for variety
      prisma.leg_time_entry.create({ data: { id: 'time-17', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2026-01-02'), hours: 1.0, activityType: 'FILING', description: 'Filing of originating summons at court registry', billable: true, rate: 30000, amount: 30000, staffId: 'lawyer-3', staffName: 'Barr. Funmi Adeola', staffRole: 'Associate', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-18', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', date: new Date('2026-01-03'), hours: 2.0, activityType: 'CORRESPONDENCE', description: 'Correspondence with opposing counsel regarding hearing dates', billable: true, rate: 30000, amount: 60000, staffId: 'lawyer-3', staffName: 'Barr. Funmi Adeola', staffRole: 'Associate', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-19', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', date: new Date('2026-01-03'), hours: 0.5, activityType: 'TRAVEL', description: 'Travel to Ikeja High Court for hearing', billable: false, rate: 0, amount: 0, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-20', tenantId: DEMO_TENANT_ID, matterId: 'matter-4', date: new Date('2025-06-15'), hours: 2.0, activityType: 'RESEARCH', description: 'Research on trademark registration requirements in Nigeria', billable: true, rate: 30000, amount: 60000, staffId: 'lawyer-3', staffName: 'Barr. Funmi Adeola', staffRole: 'Associate', approved: true, invoiced: true } }),
      // Additional entries
      prisma.leg_time_entry.create({ data: { id: 'time-21', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2026-01-01'), hours: 1.5, activityType: 'REVIEW', description: 'Review of construction contract and site documents', billable: true, rate: 50000, amount: 75000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-22', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', date: new Date('2025-12-30'), hours: 4.0, activityType: 'APPEARANCE', description: 'Court of Appeal mention - Notice of Appeal', billable: true, rate: 50000, amount: 200000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-23', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', date: new Date('2026-01-04'), hours: 3.0, activityType: 'MEETING', description: 'Meeting with medical expert witness', billable: true, rate: 60000, amount: 180000, staffId: 'lawyer-4', staffName: 'Barr. Emeka Obi', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-24', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', date: new Date('2026-01-04'), hours: 2.5, activityType: 'DRAFTING', description: 'Draft statement of defense', billable: true, rate: 40000, amount: 100000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: false } }),
      prisma.leg_time_entry.create({ data: { id: 'time-25', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', date: new Date('2026-01-04'), hours: 1.5, activityType: 'CALL', description: 'Client call - tax assessment review', billable: true, rate: 50000, amount: 75000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-26', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', date: new Date('2025-12-28'), hours: 3.0, activityType: 'DRAFTING', description: 'Draft statement of claim', billable: true, rate: 50000, amount: 150000, staffId: 'lawyer-1', staffName: 'Barr. Adaeze Nwosu', staffRole: 'Partner', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-27', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', date: new Date('2025-12-20'), hours: 2.0, activityType: 'CONSULTATION', description: 'Initial client consultation - criminal matter', billable: true, rate: 40000, amount: 80000, staffId: 'lawyer-2', staffName: 'Barr. Chidi Okoro', staffRole: 'Senior Associate', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-28', tenantId: DEMO_TENANT_ID, matterId: 'matter-5', date: new Date('2025-12-15'), hours: 2.5, activityType: 'APPEARANCE', description: 'Final hearing - divorce decree', billable: true, rate: 30000, amount: 75000, staffId: 'lawyer-3', staffName: 'Barr. Funmi Adeola', staffRole: 'Associate', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-29', tenantId: DEMO_TENANT_ID, matterId: 'matter-10', date: new Date('2025-12-10'), hours: 6.0, activityType: 'APPEARANCE', description: 'Arbitration hearing - final day', billable: true, rate: 60000, amount: 360000, staffId: 'lawyer-4', staffName: 'Barr. Emeka Obi', staffRole: 'Partner', approved: true, invoiced: true } }),
      prisma.leg_time_entry.create({ data: { id: 'time-30', tenantId: DEMO_TENANT_ID, matterId: 'matter-10', date: new Date('2025-12-05'), hours: 4.0, activityType: 'DRAFTING', description: 'Draft closing submissions for arbitration', billable: true, rate: 60000, amount: 240000, staffId: 'lawyer-4', staffName: 'Barr. Emeka Obi', staffRole: 'Partner', approved: true, invoiced: true } }),
    ]);
    console.log(`✅ Created ${timeEntries.length} time entries`);

    // Seed Retainers (5 retainers)
    console.log('💰 Creating retainers...');
    const retainers = await Promise.all([
      prisma.leg_retainer.create({ data: { id: 'retainer-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', clientId: 'client-1', clientName: 'Chief Emeka Okafor', initialAmount: 2000000, currentBalance: 1250000, minimumBalance: 200000, currency: 'NGN', isActive: true } }),
      prisma.leg_retainer.create({ data: { id: 'retainer-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', clientId: 'client-2', clientName: 'Zenith Bank Plc', initialAmount: 5000000, currentBalance: 3200000, minimumBalance: 500000, currency: 'NGN', isActive: true } }),
      prisma.leg_retainer.create({ data: { id: 'retainer-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', clientId: 'client-3', clientName: 'Mr. Tunde Adebayo', initialAmount: 1500000, currentBalance: 150000, minimumBalance: 200000, currency: 'NGN', isActive: true, exhausted: false } }),
      prisma.leg_retainer.create({ data: { id: 'retainer-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', clientId: 'client-7', clientName: 'Dr. Ngozi Eze', initialAmount: 1000000, currentBalance: 800000, minimumBalance: 100000, currency: 'NGN', isActive: true } }),
      prisma.leg_retainer.create({ data: { id: 'retainer-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', clientId: 'client-8', clientName: 'Dangote Industries Ltd', initialAmount: 2000000, currentBalance: 1800000, minimumBalance: 500000, currency: 'NGN', isActive: true } }),
    ]);
    console.log(`✅ Created ${retainers.length} retainers`);

    // Seed Retainer Transactions
    console.log('📝 Creating retainer transactions...');
    await Promise.all([
      // Retainer 1 transactions
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-1', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-1', transactionType: 'DEPOSIT', amount: 2000000, balanceAfter: 2000000, description: 'Initial retainer deposit', transactionDate: new Date('2026-01-02') } }),
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-2', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-1', transactionType: 'WITHDRAWAL', amount: 500000, balanceAfter: 1500000, description: 'Billing for January time entries', transactionDate: new Date('2026-01-05') } }),
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-3', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-1', transactionType: 'WITHDRAWAL', amount: 250000, balanceAfter: 1250000, description: 'Court filing fees and disbursements', transactionDate: new Date('2026-01-06') } }),
      // Retainer 2 transactions
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-4', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-2', transactionType: 'DEPOSIT', amount: 5000000, balanceAfter: 5000000, description: 'Initial retainer deposit', transactionDate: new Date('2025-09-20') } }),
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-5', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-2', transactionType: 'WITHDRAWAL', amount: 1200000, balanceAfter: 3800000, description: 'Q4 2025 billing', transactionDate: new Date('2025-12-31') } }),
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-6', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-2', transactionType: 'WITHDRAWAL', amount: 600000, balanceAfter: 3200000, description: 'January 2026 partial billing', transactionDate: new Date('2026-01-05') } }),
      // Retainer 3 transactions
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-7', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-3', transactionType: 'DEPOSIT', amount: 1500000, balanceAfter: 1500000, description: 'Initial retainer deposit', transactionDate: new Date('2025-11-15') } }),
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-8', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-3', transactionType: 'WITHDRAWAL', amount: 800000, balanceAfter: 700000, description: 'Bail application and court fees', transactionDate: new Date('2025-11-25') } }),
      prisma.leg_retainer_transaction.create({ data: { id: 'rtxn-9', tenantId: DEMO_TENANT_ID, retainerId: 'retainer-3', transactionType: 'WITHDRAWAL', amount: 550000, balanceAfter: 150000, description: 'December billing', transactionDate: new Date('2025-12-31') } }),
    ]);
    console.log(`✅ Created 9 retainer transactions`);

    // Seed Deadlines
    console.log('📅 Creating deadlines...');
    const deadlines = await Promise.all([
      prisma.leg_deadline.create({ data: { id: 'deadline-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', deadlineType: 'FILING_DEADLINE', title: 'Filing Deadline - Motion for Adjournment', description: 'File motion and supporting affidavit', dueDate: new Date('2026-01-08'), dueTime: '16:00', court: 'Federal High Court, Lagos', assignedTo: 'lawyer-1', assignedName: 'Barr. Adaeze Nwosu', priority: 1, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', deadlineType: 'COURT_DATE', title: 'Court Appearance - Hearing', description: 'Substantive hearing on bail application', dueDate: new Date('2026-01-10'), dueTime: '09:00', court: 'Lagos State High Court, Ikeja', courtroom: 'Court 5', assignedTo: 'lawyer-2', assignedName: 'Barr. Chidi Okoro', priority: 1, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', deadlineType: 'FILING_DEADLINE', title: 'Brief Submission Deadline', description: "Submit Appellant's Brief of Argument", dueDate: new Date('2026-01-12'), dueTime: '12:00', court: 'Court of Appeal, Lagos Division', assignedTo: 'lawyer-1', assignedName: 'Barr. Adaeze Nwosu', priority: 2, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-8', deadlineType: 'LIMITATION', title: 'Limitation Period - File or Lose', description: 'Statute of limitations expires for land dispute claim', dueDate: new Date('2026-02-15'), assignedTo: 'lawyer-4', assignedName: 'Barr. Emeka Obi', priority: 1, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', deadlineType: 'FILING_DEADLINE', title: 'Response to Interrogatories', description: 'File response to defendant interrogatories', dueDate: new Date('2026-01-05'), court: 'Federal High Court, Lagos', assignedTo: 'lawyer-1', assignedName: 'Barr. Adaeze Nwosu', priority: 2, status: 'COMPLETED', completedDate: new Date('2026-01-04') } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-6', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', deadlineType: 'FILING_DEADLINE', title: 'Statement of Defense', description: 'File statement of defense and witness statements', dueDate: new Date('2026-01-20'), court: 'Lagos State High Court, Lagos Island', assignedTo: 'lawyer-4', assignedName: 'Barr. Emeka Obi', priority: 2, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-7', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', deadlineType: 'COURT_DATE', title: 'Pre-Trial Conference', description: 'Mandatory pre-trial conference', dueDate: new Date('2026-01-25'), dueTime: '10:00', court: 'National Industrial Court, Lagos', assignedTo: 'lawyer-2', assignedName: 'Barr. Chidi Okoro', priority: 2, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-8', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', deadlineType: 'FILING_DEADLINE', title: 'Notice of Appeal Filing', description: 'File Notice of Appeal at Tax Appeal Tribunal', dueDate: new Date('2026-01-15'), court: 'Tax Appeal Tribunal, Lagos', assignedTo: 'lawyer-1', assignedName: 'Barr. Adaeze Nwosu', priority: 1, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-9', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', deadlineType: 'COURT_DATE', title: 'Appeal Hearing Date', description: 'Substantive hearing of appeal', dueDate: new Date('2026-02-10'), dueTime: '09:00', court: 'Court of Appeal, Lagos Division', assignedTo: 'lawyer-1', assignedName: 'Barr. Adaeze Nwosu', priority: 1, status: 'PENDING' } }),
      prisma.leg_deadline.create({ data: { id: 'deadline-10', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', deadlineType: 'INTERNAL', title: 'Witness Interview', description: 'Schedule interview with site engineer witness', dueDate: new Date('2026-01-09'), assignedTo: 'lawyer-3', assignedName: 'Barr. Funmi Adeola', priority: 3, status: 'PENDING' } }),
    ]);
    console.log(`✅ Created ${deadlines.length} deadlines`);

    // Seed Documents (15 documents)
    console.log('📄 Creating documents...');
    const documents = await Promise.all([
      prisma.leg_document.create({ data: { id: 'doc-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', title: 'Motion for Adjournment', category: 'motion', description: 'Application for adjournment of hearing', authorId: 'lawyer-1', authorName: 'Barr. Adaeze Nwosu', status: 'Draft' } }),
      prisma.leg_document.create({ data: { id: 'doc-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', title: 'Witness Statement - Mr. Eze', category: 'evidence', description: 'Statement of site engineer witness', isEvidence: true, exhibitNumber: 'Exhibit C', authorId: 'lawyer-1', authorName: 'Barr. Adaeze Nwosu', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', title: 'Construction Contract', category: 'evidence', description: 'Original construction contract between parties', isEvidence: true, exhibitNumber: 'Exhibit A', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', title: 'Bail Application', category: 'motion', description: 'Application for bail pending trial', authorId: 'lawyer-2', authorName: 'Barr. Chidi Okoro', status: 'Filed' } }),
      prisma.leg_document.create({ data: { id: 'doc-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', title: 'Client Engagement Letter', category: 'correspondence', description: 'Terms of engagement with Zenith Bank', isConfidential: true, authorId: 'lawyer-1', authorName: 'Barr. Adaeze Nwosu', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-6', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', title: 'Loan Agreement', category: 'evidence', description: 'Loan facility agreement - disputed document', isEvidence: true, exhibitNumber: 'Exhibit A', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-7', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', title: "Appellant's Brief of Argument", category: 'brief', description: 'Brief of argument for Court of Appeal', authorId: 'lawyer-1', authorName: 'Barr. Adaeze Nwosu', status: 'Draft' } }),
      prisma.leg_document.create({ data: { id: 'doc-8', tenantId: DEMO_TENANT_ID, matterId: 'matter-4', title: 'Trademark Application Form', category: 'draft', description: 'Form for trademark registration', authorId: 'lawyer-3', authorName: 'Barr. Funmi Adeola', status: 'Draft' } }),
      prisma.leg_document.create({ data: { id: 'doc-9', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', title: 'Medical Records Summary', category: 'evidence', description: 'Summary of patient medical records', isEvidence: true, exhibitNumber: 'Exhibit B', isConfidential: true, status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-10', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', title: 'Expert Medical Opinion', category: 'evidence', description: 'Opinion from Prof. Akin Ogunleye', isEvidence: true, exhibitNumber: 'Exhibit D', authorName: 'Prof. Akin Ogunleye', status: 'Draft' } }),
      prisma.leg_document.create({ data: { id: 'doc-11', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', title: 'Employment Contract', category: 'evidence', description: 'Former CFO employment contract', isEvidence: true, exhibitNumber: 'Exhibit A', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-12', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', title: 'Termination Letter', category: 'evidence', description: 'Letter of termination issued to claimant', isEvidence: true, exhibitNumber: 'Exhibit B', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-13', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', title: 'FIRS Assessment Notice', category: 'evidence', description: 'Tax assessment notice from FIRS', isEvidence: true, exhibitNumber: 'Exhibit A', status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-14', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', title: 'Company Financial Statements', category: 'evidence', description: 'Audited financial statements 2024', isEvidence: true, exhibitNumber: 'Exhibit B', isConfidential: true, status: 'Final' } }),
      prisma.leg_document.create({ data: { id: 'doc-15', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', title: 'Site Visit Report', category: 'evidence', description: 'Report of site inspection visit', isEvidence: true, exhibitNumber: 'Exhibit D', authorName: 'Engr. Bola Adesanya', status: 'Final' } }),
    ]);
    console.log(`✅ Created ${documents.length} documents`);

    // Seed Filings (10 filings)
    console.log('⚖️ Creating filings...');
    const filings = await Promise.all([
      prisma.leg_filing.create({ data: { id: 'filing-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', filingType: 'MOTION', title: 'Motion for Adjournment', court: 'Federal High Court, Lagos', filedDate: new Date('2026-01-05'), filedBy: 'Barr. Adaeze Nwosu', filingNumber: 'FHC/MOT/2026/012', filingFee: 5000, feePaid: true, served: false } }),
      prisma.leg_filing.create({ data: { id: 'filing-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', filingType: 'ORIGINATING_PROCESS', title: 'Originating Summons', court: 'Federal High Court, Lagos', filedDate: new Date('2026-01-02'), filedBy: 'Barr. Adaeze Nwosu', filingNumber: 'FHC/OS/2026/003', filingFee: 15000, feePaid: true, served: true, servedDate: new Date('2026-01-03'), servedOn: 'ABC Construction Ltd' } }),
      prisma.leg_filing.create({ data: { id: 'filing-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', filingType: 'MOTION', title: 'Bail Application', court: 'Lagos State High Court, Ikeja', filedDate: new Date('2025-11-20'), filedBy: 'Barr. Chidi Okoro', filingNumber: 'LD/MOT/2025/189', filingFee: 3000, feePaid: true, served: true, servedDate: new Date('2025-11-21'), servedOn: 'DPP Lagos State' } }),
      prisma.leg_filing.create({ data: { id: 'filing-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', filingType: 'NOTICE', title: 'Notice of Appeal', court: 'Court of Appeal, Lagos', filedDate: new Date('2025-09-25'), filedBy: 'Barr. Adaeze Nwosu', filingNumber: 'CA/L/NOA/2025/078', filingFee: 25000, feePaid: true, served: true, servedDate: new Date('2025-09-27'), servedOn: 'Pinnacle Enterprises Ltd' } }),
      prisma.leg_filing.create({ data: { id: 'filing-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', filingType: 'BRIEF', title: "Appellant's Brief of Argument", court: 'Court of Appeal, Lagos', filedDate: new Date('2025-12-15'), filedBy: 'Barr. Adaeze Nwosu', filingNumber: 'CA/L/BRF/2025/112', filingFee: 10000, feePaid: true, served: false } }),
      prisma.leg_filing.create({ data: { id: 'filing-6', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', filingType: 'ORIGINATING_PROCESS', title: 'Statement of Defense', court: 'Lagos State High Court, Lagos Island', filedDate: new Date('2026-01-05'), filedBy: 'Barr. Emeka Obi', filingNumber: 'LD/DEF/2026/001', filingFee: 8000, feePaid: true, served: false } }),
      prisma.leg_filing.create({ data: { id: 'filing-7', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', filingType: 'ORIGINATING_PROCESS', title: 'Memorandum of Appearance', court: 'National Industrial Court, Lagos', filedDate: new Date('2026-01-04'), filedBy: 'Barr. Chidi Okoro', filingNumber: 'NICN/APP/2026/005', filingFee: 5000, feePaid: true, served: true, servedDate: new Date('2026-01-05'), servedOn: 'Mr. Charles Ibe' } }),
      prisma.leg_filing.create({ data: { id: 'filing-8', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', filingType: 'NOTICE', title: 'Notice of Appeal to TAT', court: 'Tax Appeal Tribunal, Lagos', filedDate: new Date('2026-01-04'), filedBy: 'Barr. Adaeze Nwosu', filingNumber: 'TAT/LZ/NOA/2026/001', filingFee: 20000, feePaid: true, served: true, servedDate: new Date('2026-01-05'), servedOn: 'FIRS Lagos' } }),
      prisma.leg_filing.create({ data: { id: 'filing-9', tenantId: DEMO_TENANT_ID, matterId: 'matter-5', filingType: 'JUDGMENT', title: 'Final Decree of Divorce', court: 'Customary Court, Abuja', filedDate: new Date('2025-12-20'), filingNumber: 'CCA/JUD/2025/045', filingFee: 0, feePaid: true, served: true, servedDate: new Date('2025-12-22'), servedOn: 'Both Parties' } }),
      prisma.leg_filing.create({ data: { id: 'filing-10', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', filingType: 'AFFIDAVIT', title: 'Supporting Affidavit', court: 'Federal High Court, Lagos', filedDate: new Date('2026-01-05'), filedBy: 'Barr. Funmi Adeola', filingNumber: 'FHC/AFF/2026/008', filingFee: 2000, feePaid: true, served: false } }),
    ]);
    console.log(`✅ Created ${filings.length} filings`);

    // Seed Disbursements
    console.log('💵 Creating disbursements...');
    const disbursements = await Promise.all([
      prisma.leg_disbursement.create({ data: { id: 'disb-1', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', category: 'FILING_FEE', description: 'Court filing fee - Originating summons', amount: 15000, date: new Date('2026-01-02'), vendor: 'Federal High Court Registry', billable: true, submittedBy: 'lawyer-3', submittedName: 'Barr. Funmi Adeola' } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-2', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', category: 'FILING_FEE', description: 'Motion filing fee', amount: 5000, date: new Date('2026-01-05'), vendor: 'Federal High Court Registry', billable: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-3', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', category: 'TRANSPORT', description: 'Transport to court for filing', amount: 8000, date: new Date('2026-01-02'), billable: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-4', tenantId: DEMO_TENANT_ID, matterId: 'matter-2', category: 'FILING_FEE', description: 'Bail application filing fee', amount: 3000, date: new Date('2025-11-20'), vendor: 'Lagos High Court Registry', billable: true, invoiced: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-5', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', category: 'FILING_FEE', description: 'Notice of Appeal filing fee', amount: 25000, date: new Date('2025-09-25'), vendor: 'Court of Appeal Registry', billable: true, invoiced: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-6', tenantId: DEMO_TENANT_ID, matterId: 'matter-3', category: 'PRINTING', description: 'Printing of Appeal records', amount: 45000, date: new Date('2025-12-10'), vendor: 'Premium Print Services', billable: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-7', tenantId: DEMO_TENANT_ID, matterId: 'matter-6', category: 'EXPERT_FEE', description: 'Medical expert consultation fee', amount: 150000, date: new Date('2026-01-04'), vendor: 'Prof. Akin Ogunleye', billable: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-8', tenantId: DEMO_TENANT_ID, matterId: 'matter-7', category: 'SEARCH_FEE', description: 'Company search at CAC', amount: 5000, date: new Date('2026-01-03'), vendor: 'CAC Abuja', billable: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-9', tenantId: DEMO_TENANT_ID, matterId: 'matter-9', category: 'FILING_FEE', description: 'Tax Appeal Tribunal filing fee', amount: 20000, date: new Date('2026-01-04'), vendor: 'TAT Registry', billable: true } }),
      prisma.leg_disbursement.create({ data: { id: 'disb-10', tenantId: DEMO_TENANT_ID, matterId: 'matter-1', category: 'COURIER', description: 'Service of process by courier', amount: 12000, date: new Date('2026-01-03'), vendor: 'DHL Nigeria', billable: true } }),
    ]);
    console.log(`✅ Created ${disbursements.length} disbursements`);

    console.log('\n✅ Legal Practice Suite Demo Data Seeding Complete!');
    console.log(`
📊 Summary:
   - 10 Matters (various types and statuses)
   - 20 Parties (clients, opposing parties, witnesses)
   - 30 Time Entries (billable hours)
   - 5 Retainers with transactions
   - 10 Deadlines (court dates, filing deadlines)
   - 15 Documents (motions, evidence, briefs)
   - 10 Court Filings
   - 10 Disbursements

🔑 Demo Tenant ID: ${DEMO_TENANT_ID}
    `);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedLegalPracticeDemo();
