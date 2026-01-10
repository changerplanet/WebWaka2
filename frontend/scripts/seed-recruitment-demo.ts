/**
 * RECRUITMENT & ONBOARDING SUITE — Demo Data Seeder
 * Phase 7C.1, S5 Demo Data
 * 
 * Seeds Nigerian-centric recruitment data for demo purposes.
 * Run with: npx ts-node scripts/seed-recruitment-demo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo tenant ID - replace with actual tenant from your demo environment
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID || 'demo-recruitment-tenant';
const DEMO_INSTANCE_ID = process.env.DEMO_INSTANCE_ID || 'demo-recruitment-instance';

// Nigerian names for realistic demo data
const NIGERIAN_NAMES = {
  firstNames: {
    male: ['Chukwudi', 'Emeka', 'Ibrahim', 'Tunde', 'Chidi', 'Olumide', 'Abdullahi', 'Yusuf', 'Kelechi', 'Obinna'],
    female: ['Adaeze', 'Ngozi', 'Fatima', 'Amaka', 'Blessing', 'Chioma', 'Aisha', 'Funke', 'Nneka', 'Yetunde'],
  },
  lastNames: ['Okonkwo', 'Nwosu', 'Abdullahi', 'Eze', 'Okafor', 'Ajayi', 'Musa', 'Adeyemi', 'Obi', 'Bello', 'Amadi', 'Okoro', 'Danladi', 'Igwe', 'Babatunde'],
};

const DEPARTMENTS = ['Sales', 'Finance', 'IT', 'Operations', 'Admin', 'HR', 'Marketing', 'Customer Service'];
const LOCATIONS = ['Lagos, Nigeria', 'Abuja, Nigeria', 'Port Harcourt, Nigeria', 'Ibadan, Nigeria', 'Kano, Nigeria'];
const SOURCES = ['LinkedIn', 'Jobberman', 'Referral', 'Direct', 'Company Website', 'Walk-in'];

// Job templates with Nigerian salary context
const JOB_TEMPLATES = [
  {
    title: 'Sales Representative',
    department: 'Sales',
    description: 'Drive sales growth by identifying and developing new business opportunities. Build relationships with clients and meet sales targets.',
    requirements: 'OND/HND/BSc in any discipline. 2+ years sales experience. Strong communication skills. Valid driver\'s license preferred.',
    salaryMin: 150000,
    salaryMax: 250000,
    employmentType: 'FULL_TIME',
    openings: 3,
  },
  {
    title: 'Senior Accountant',
    department: 'Finance',
    description: 'Manage financial records, prepare reports, ensure compliance with Nigerian tax regulations. Oversee accounts payable/receivable.',
    requirements: 'BSc/HND in Accounting. ICAN/ACCA certification required. 5+ years experience. Proficiency in accounting software.',
    salaryMin: 350000,
    salaryMax: 500000,
    employmentType: 'FULL_TIME',
    openings: 1,
  },
  {
    title: 'Software Developer',
    department: 'IT',
    description: 'Design, develop, and maintain web applications. Collaborate with cross-functional teams to deliver high-quality software solutions.',
    requirements: 'BSc in Computer Science or related field. 3+ years experience in JavaScript/TypeScript, React, Node.js. Git proficiency.',
    salaryMin: 500000,
    salaryMax: 900000,
    employmentType: 'FULL_TIME',
    openings: 2,
  },
  {
    title: 'Administrative Officer',
    department: 'Admin',
    description: 'Provide administrative support, manage office operations, coordinate meetings, and maintain filing systems.',
    requirements: 'OND/HND in Business Admin or related field. 2+ years office experience. MS Office proficiency.',
    salaryMin: 120000,
    salaryMax: 180000,
    employmentType: 'FULL_TIME',
    openings: 1,
  },
  {
    title: 'Delivery Driver',
    department: 'Operations',
    description: 'Transport goods to customers safely and on time. Maintain vehicle and delivery records.',
    requirements: 'SSCE/WAEC certificate. Valid driver\'s license (minimum 3 years). Clean driving record. Knowledge of Lagos roads.',
    salaryMin: 80000,
    salaryMax: 120000,
    employmentType: 'CONTRACT',
    openings: 5,
  },
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNigerianName(gender: 'male' | 'female'): { firstName: string; lastName: string; fullName: string } {
  const firstName = randomElement(NIGERIAN_NAMES.firstNames[gender]);
  const lastName = randomElement(NIGERIAN_NAMES.lastNames);
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

function generateNigerianPhone(): string {
  const prefixes = ['0803', '0805', '0806', '0807', '0808', '0809', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'];
  const prefix = randomElement(prefixes);
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+234 ${prefix.slice(1)} ${number.slice(0, 3)} ${number.slice(3)}`;
}

function generateEmail(name: { firstName: string; lastName: string }): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com'];
  return `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@${randomElement(domains)}`;
}

async function seedJobs() {
  console.log('Seeding jobs...');
  const jobs = [];

  for (let i = 0; i < JOB_TEMPLATES.length; i++) {
    const template = JOB_TEMPLATES[i];
    const job = await prisma.recruit_job.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        platformInstanceId: DEMO_INSTANCE_ID,
        jobCode: `JOB-2026-${String(i + 1).padStart(4, '0')}`,
        title: template.title,
        department: template.department,
        location: randomElement(LOCATIONS),
        workLocation: randomElement(['On-site', 'Remote', 'Hybrid']),
        description: template.description,
        requirements: template.requirements,
        employmentType: template.employmentType as any,
        salaryMin: template.salaryMin,
        salaryMax: template.salaryMax,
        salaryCurrency: 'NGN',
        salaryPeriod: 'MONTHLY',
        openings: template.openings,
        status: i === 4 ? 'FILLED' : (i === 3 ? 'DRAFT' : 'OPEN'),
        postedDate: i === 3 ? null : new Date(Date.now() - (i * 3 * 24 * 60 * 60 * 1000)),
        closingDate: i === 3 ? null : new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
      },
    });
    jobs.push(job);
    console.log(`  Created job: ${job.title} (${job.jobCode})`);
  }

  return jobs;
}

async function seedApplications(jobs: any[]) {
  console.log('Seeding applications...');
  const applications = [];
  const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED'];

  // Create 15-20 applications
  for (let i = 0; i < 18; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = generateNigerianName(gender);
    const job = randomElement(jobs.filter(j => j.status !== 'DRAFT'));
    const stage = randomElement(stages.slice(0, 5));
    
    const application = await prisma.recruit_application.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        platformInstanceId: DEMO_INSTANCE_ID,
        jobId: job.id,
        applicantName: name.fullName,
        applicantEmail: generateEmail(name),
        applicantPhone: generateNigerianPhone(),
        applicantLocation: randomElement(['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano']),
        source: randomElement(SOURCES),
        stage: stage as any,
        score: stage !== 'APPLIED' ? Math.floor(Math.random() * 30) + 60 : null,
        rating: stage !== 'APPLIED' ? Math.floor(Math.random() * 3) + 3 : 0,
        applicationDate: new Date(Date.now() - (Math.random() * 14 * 24 * 60 * 60 * 1000)),
        expectedSalary: job.salaryMin + Math.floor(Math.random() * (job.salaryMax - job.salaryMin)),
        isShortlisted: stage !== 'APPLIED' && stage !== 'REJECTED',
        isRejected: stage === 'REJECTED',
      },
    });
    applications.push(application);
    console.log(`  Created application: ${application.applicantName} for ${job.title}`);
  }

  return applications;
}

async function seedInterviews(applications: any[]) {
  console.log('Seeding interviews...');
  const interviews = [];
  const interviewers = ['Mrs. Amaka Obi', 'Mr. Chidi Eze', 'Mrs. Ngozi Okafor', 'Mr. Tunde Ajayi', 'CFO', 'HR Manager'];
  const types = ['PHONE', 'VIDEO', 'IN_PERSON', 'PANEL'];
  
  // Create interviews for applications in INTERVIEW stage or beyond
  const eligibleApps = applications.filter(a => 
    ['INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED'].includes(a.stage)
  );

  for (const app of eligibleApps) {
    const interviewDate = new Date(Date.now() + (Math.random() * 7 - 3) * 24 * 60 * 60 * 1000);
    const interview = await prisma.recruit_interview.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        platformInstanceId: DEMO_INSTANCE_ID,
        applicationId: app.id,
        interviewType: randomElement(types) as any,
        scheduledDate: interviewDate,
        scheduledTime: `${Math.floor(Math.random() * 8) + 9}:00`,
        duration: randomElement([30, 45, 60, 90]),
        interviewers: [randomElement(interviewers), randomElement(interviewers)],
        location: randomElement([null, 'Head Office, Victoria Island, Lagos']),
        meetingLink: Math.random() > 0.5 ? 'https://meet.google.com/abc-defg-hij' : null,
        result: ['OFFER', 'HIRED'].includes(app.stage) ? 'PASS' : 'PENDING',
        overallScore: ['OFFER', 'HIRED'].includes(app.stage) ? Math.floor(Math.random() * 20) + 80 : null,
      },
    });
    interviews.push(interview);
    console.log(`  Created interview for: ${app.applicantName}`);
  }

  return interviews;
}

async function seedOffers(applications: any[]) {
  console.log('Seeding offers...');
  const offers = [];
  
  // Create offers for applications in OFFER or HIRED stage
  const eligibleApps = applications.filter(a => ['OFFER', 'HIRED'].includes(a.stage));

  for (const app of eligibleApps) {
    const baseSalary = app.expectedSalary || 300000;
    const offer = await prisma.recruit_offer.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        platformInstanceId: DEMO_INSTANCE_ID,
        applicationId: app.id,
        basicSalary: baseSalary,
        housingAllowance: Math.floor(baseSalary * 0.15),
        transportAllowance: Math.floor(baseSalary * 0.1),
        otherAllowances: Math.floor(baseSalary * 0.08),
        salaryCurrency: 'NGN',
        salaryPeriod: 'MONTHLY',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: app.stage === 'HIRED' ? 'ACCEPTED' : randomElement(['SENT', 'DRAFT']) as any,
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    });
    offers.push(offer);
    console.log(`  Created offer for: ${app.applicantName}`);
  }

  return offers;
}

async function seedOnboardingTasks(applications: any[]) {
  console.log('Seeding onboarding tasks...');
  const tasks = [];
  
  // Create onboarding tasks for HIRED applications
  const hiredApps = applications.filter(a => a.stage === 'HIRED');
  
  const taskTemplates = [
    { name: 'Submit National ID / Passport Copy', category: 'DOCUMENTATION', requiresDocument: true },
    { name: 'Submit NYSC Certificate', category: 'DOCUMENTATION', requiresDocument: true },
    { name: 'Submit Educational Certificates', category: 'DOCUMENTATION', requiresDocument: true },
    { name: 'Submit Bank Account Details', category: 'DOCUMENTATION', requiresDocument: true },
    { name: 'Submit Guarantor Forms (2)', category: 'DOCUMENTATION', requiresDocument: true },
    { name: 'Submit Passport Photographs', category: 'DOCUMENTATION', requiresDocument: true },
    { name: 'IT Setup - Email & System Access', category: 'IT_SETUP', requiresDocument: false },
    { name: 'Orientation Session', category: 'ORIENTATION', requiresDocument: false },
    { name: 'Department Introduction', category: 'ORIENTATION', requiresDocument: false },
    { name: 'Health & Safety Training', category: 'TRAINING', requiresDocument: false },
  ];

  for (const app of hiredApps) {
    let dueOrder = 1;
    for (const template of taskTemplates) {
      const dueDate = new Date(Date.now() + (dueOrder * 2) * 24 * 60 * 60 * 1000);
      const status = dueOrder <= 2 ? 'COMPLETED' : (dueOrder <= 4 ? 'IN_PROGRESS' : (dueOrder === 5 ? 'OVERDUE' : 'PENDING'));
      
      const task = await prisma.recruit_onboarding_task.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          applicationId: app.id,
          taskName: template.name,
          category: template.category,
          status: status as any,
          dueDate,
          dueOrder,
          assignedTo: template.category === 'IT_SETUP' ? 'IT' : 'HR',
          requiresDocument: template.requiresDocument,
          documentUploaded: status === 'COMPLETED',
          completedAt: status === 'COMPLETED' ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
        },
      });
      tasks.push(task);
      dueOrder++;
    }
    console.log(`  Created onboarding tasks for: ${app.applicantName}`);
  }

  return tasks;
}

async function main() {
  console.log('🚀 Starting Recruitment & Onboarding Suite Demo Data Seeder');
  console.log('='.repeat(60));
  
  try {
    // Clear existing demo data
    console.log('\nClearing existing recruitment demo data...');
    await prisma.recruit_onboarding_task.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.recruit_offer.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.recruit_interview.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.recruit_application.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    await prisma.recruit_job.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log('  ✓ Cleared existing data');

    // Seed data
    const jobs = await seedJobs();
    const applications = await seedApplications(jobs);
    const interviews = await seedInterviews(applications);
    const offers = await seedOffers(applications);
    const onboardingTasks = await seedOnboardingTasks(applications);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Demo Data Seeding Complete!');
    console.log('='.repeat(60));
    console.log(`
Summary:
  • Jobs: ${jobs.length}
  • Applications: ${applications.length}
  • Interviews: ${interviews.length}
  • Offers: ${offers.length}
  • Onboarding Tasks: ${onboardingTasks.length}

Nigerian Context Applied:
  • Currency: NGN (Nigerian Naira)
  • Names: Nigerian first and last names
  • Phone Format: Nigerian mobile numbers
  • Locations: Lagos, Abuja, Port Harcourt, etc.
  • Documents: NYSC, WAEC, guarantor forms
  • Salary Bands: Nigerian market rates
`);
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
