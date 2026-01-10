/**
 * PROJECT MANAGEMENT SUITE — Demo Data Seeder
 * Phase 7C.2, S5 Demo Data
 * 
 * Seeds Nigerian-centric project management data for demo purposes.
 * Run with: npx ts-node scripts/seed-project-management-demo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo tenant ID - replace with actual tenant from your demo environment
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID || 'demo-pm-tenant';
const DEMO_INSTANCE_ID = process.env.DEMO_INSTANCE_ID || 'demo-pm-instance';

// Nigerian names for realistic demo data
const NIGERIAN_NAMES = {
  firstNames: {
    male: ['Chukwudi', 'Emeka', 'Ibrahim', 'Tunde', 'Chidi', 'Olumide', 'Abdullahi', 'Yusuf', 'Kelechi', 'Obinna'],
    female: ['Adaeze', 'Ngozi', 'Fatima', 'Amaka', 'Blessing', 'Chioma', 'Aisha', 'Funke', 'Nneka', 'Yetunde'],
  },
  lastNames: ['Okonkwo', 'Nwosu', 'Abdullahi', 'Eze', 'Okafor', 'Ajayi', 'Musa', 'Adeyemi', 'Obi', 'Bello', 'Amadi', 'Okoro', 'Danladi', 'Igwe', 'Babatunde'],
};

// Project categories for Nigerian SME context
const PROJECT_CATEGORIES = ['Construction', 'NGO Program', 'Client Project', 'Internal', 'Consulting', 'Event', 'IT Infrastructure'];

// Budget categories
const BUDGET_CATEGORIES = ['Materials', 'Labor', 'Equipment', 'Consulting', 'Travel', 'Communication', 'Training', 'Logistics', 'Permits & Licenses', 'Contingency'];

// Nigerian client names
const NIGERIAN_CLIENTS = [
  'Ford Foundation Nigeria',
  'Dangote Foods Ltd',
  'First Bank of Nigeria',
  'MTN Nigeria',
  'Zenith Bank Plc',
  'Chevron Nigeria',
  'PwC Nigeria',
  'KPMG Nigeria',
  'Lagos State Government',
  'Shell Petroleum Development Company',
];

// Project templates with Nigerian context
const PROJECT_TEMPLATES = [
  {
    name: 'Victoria Island Office Renovation',
    description: 'Complete renovation of the Lagos head office including new conference rooms and workspace redesign to accommodate hybrid work',
    category: 'Construction',
    budgetEstimated: 25000000,
    durationMonths: 3,
    clientName: null,
    milestones: [
      { name: 'Design Phase', description: 'Complete all architectural and interior design work', taskCount: 4 },
      { name: 'Procurement', description: 'Source and procure all materials and furniture', taskCount: 5 },
      { name: 'Construction', description: 'Physical renovation and construction work', taskCount: 6 },
      { name: 'Final Inspection', description: 'Quality assurance and regulatory compliance checks', taskCount: 3 },
    ],
  },
  {
    name: 'Youth Empowerment Program',
    description: 'Skills acquisition and entrepreneurship training for 500 youth in Lagos State funded by international donor',
    category: 'NGO Program',
    budgetEstimated: 15000000,
    durationMonths: 6,
    clientName: 'Ford Foundation Nigeria',
    milestones: [
      { name: 'Team Setup', description: 'Recruit and onboard program facilitators and coordinators', taskCount: 4 },
      { name: 'Logistics', description: 'Secure venues and arrange transportation for participants', taskCount: 3 },
      { name: 'Participant Registration', description: 'Register and verify 500 youth participants across Lagos LGAs', taskCount: 5 },
      { name: 'Training Cohort 1', description: 'First batch of 250 participants complete 8-week program', taskCount: 6 },
      { name: 'Training Cohort 2', description: 'Second batch of 250 participants complete 8-week program', taskCount: 6 },
      { name: 'Reporting', description: 'Final donor report and program evaluation submission', taskCount: 4 },
    ],
  },
  {
    name: 'E-commerce Platform Development',
    description: 'Custom e-commerce solution for retail division with Paystack integration and inventory management',
    category: 'Client Project',
    budgetEstimated: 8500000,
    durationMonths: 4,
    clientName: 'Dangote Foods Ltd',
    milestones: [
      { name: 'Discovery & Design', description: 'Requirements gathering and UI/UX design', taskCount: 5 },
      { name: 'Payment Module', description: 'Integrate Paystack payment gateway with all payment methods', taskCount: 4 },
      { name: 'Inventory System', description: 'Build product catalog and inventory tracking system', taskCount: 6 },
      { name: 'Testing', description: 'User acceptance testing and bug fixes', taskCount: 5 },
      { name: 'Deployment', description: 'Production deployment and go-live support', taskCount: 4 },
    ],
  },
  {
    name: 'Annual Financial Audit Preparation',
    description: 'Internal audit preparation and documentation for FY2025 in compliance with Nigerian standards',
    category: 'Internal',
    budgetEstimated: 2500000,
    durationMonths: 1,
    clientName: null,
    milestones: [
      { name: 'Document Collection', description: 'Gather all financial documents and records', taskCount: 4 },
      { name: 'Reconciliation', description: 'Complete bank and accounts reconciliation', taskCount: 3 },
      { name: 'Audit Support', description: 'Provide support during external audit review', taskCount: 3 },
    ],
  },
  {
    name: 'Staff Training Portal',
    description: 'Online learning management system for employee training and development tracking',
    category: 'IT Infrastructure',
    budgetEstimated: 3500000,
    durationMonths: 3,
    clientName: null,
    milestones: [
      { name: 'Platform Selection', description: 'Evaluate and select LMS platform', taskCount: 3 },
      { name: 'Content Development', description: 'Create initial training content and modules', taskCount: 6 },
      { name: 'Pilot Launch', description: 'Launch pilot with select departments', taskCount: 4 },
      { name: 'Company-wide Rollout', description: 'Full deployment and training', taskCount: 4 },
    ],
  },
];

// Task templates for common project tasks
const TASK_TEMPLATES = [
  { title: 'Submit architectural drawings for approval', priority: 'HIGH', estimatedHours: 8 },
  { title: 'Review vendor quotations', priority: 'MEDIUM', estimatedHours: 4 },
  { title: 'Obtain regulatory permits', priority: 'HIGH', estimatedHours: 16 },
  { title: 'Conduct site inspection', priority: 'MEDIUM', estimatedHours: 4 },
  { title: 'Prepare progress report', priority: 'HIGH', estimatedHours: 6 },
  { title: 'Coordinate with contractors', priority: 'MEDIUM', estimatedHours: 3 },
  { title: 'Review and approve budget items', priority: 'HIGH', estimatedHours: 4 },
  { title: 'Schedule stakeholder meeting', priority: 'LOW', estimatedHours: 2 },
  { title: 'Update project documentation', priority: 'LOW', estimatedHours: 3 },
  { title: 'Conduct quality inspection', priority: 'HIGH', estimatedHours: 6 },
  { title: 'Process vendor payments', priority: 'MEDIUM', estimatedHours: 4 },
  { title: 'Prepare donor report', priority: 'CRITICAL', estimatedHours: 12 },
  { title: 'Recruit facilitators', priority: 'HIGH', estimatedHours: 20 },
  { title: 'Complete payment gateway integration', priority: 'HIGH', estimatedHours: 16 },
  { title: 'User acceptance testing', priority: 'HIGH', estimatedHours: 24 },
];

function getRandomName(gender: 'male' | 'female'): string {
  const firstNames = NIGERIAN_NAMES.firstNames[gender];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = NIGERIAN_NAMES.lastNames[Math.floor(Math.random() * NIGERIAN_NAMES.lastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateProjectCode(year: number, index: number): string {
  return `PRJ-${year}-${String(index).padStart(4, '0')}`;
}

async function seedProjects() {
  console.log('🏗️  Seeding Project Management demo data...\n');

  const year = new Date().getFullYear();
  let projectIndex = 0;

  for (const template of PROJECT_TEMPLATES) {
    projectIndex++;
    const projectCode = generateProjectCode(year, projectIndex);
    const ownerName = getRandomName(Math.random() > 0.5 ? 'male' : 'female');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Started 0-30 days ago
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + template.durationMonths);

    // Determine project status and health
    const statusOptions: Array<'DRAFT' | 'ACTIVE' | 'COMPLETED'> = ['DRAFT', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'COMPLETED'];
    const status = projectIndex === 4 ? 'COMPLETED' : projectIndex === 5 ? 'DRAFT' : 'ACTIVE';
    const healthOptions: Array<'ON_TRACK' | 'AT_RISK' | 'DELAYED'> = ['ON_TRACK', 'ON_TRACK', 'AT_RISK', 'DELAYED'];
    const health = getRandomElement(healthOptions);

    const progressPercent = status === 'COMPLETED' ? 100 : status === 'DRAFT' ? 0 : Math.floor(Math.random() * 60) + 20;

    console.log(`📁 Creating project: ${template.name}`);

    // Create the project
    const project = await prisma.project_project.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        platformInstanceId: DEMO_INSTANCE_ID,
        projectCode,
        name: template.name,
        description: template.description,
        category: template.category,
        clientName: template.clientName,
        ownerName,
        status,
        priority: template.budgetEstimated > 10000000 ? 'HIGH' : 'MEDIUM',
        health,
        progressPercent,
        budgetEstimated: template.budgetEstimated,
        budgetCurrency: 'NGN',
        startDate,
        targetEndDate: endDate,
        actualEndDate: status === 'COMPLETED' ? new Date() : null,
      },
    });

    // Create milestones
    let milestoneIndex = 0;
    for (const msTemplate of template.milestones) {
      milestoneIndex++;
      const milestoneDate = new Date(startDate);
      milestoneDate.setDate(milestoneDate.getDate() + Math.floor((template.durationMonths * 30 * milestoneIndex) / template.milestones.length));

      const isCompleted = status === 'COMPLETED' || (status === 'ACTIVE' && milestoneIndex <= Math.ceil(template.milestones.length * progressPercent / 100));
      const msProgress = isCompleted ? 100 : status === 'DRAFT' ? 0 : Math.floor(Math.random() * 80);

      console.log(`  └─ 🎯 Milestone: ${msTemplate.name}`);

      const milestone = await prisma.project_milestone.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          projectId: project.id,
          name: msTemplate.name,
          description: msTemplate.description,
          orderIndex: milestoneIndex,
          targetDate: milestoneDate,
          completedDate: isCompleted ? milestoneDate : null,
          isCompleted,
          progressPercent: msProgress,
        },
      });

      // Create tasks for this milestone
      const taskCount = msTemplate.taskCount;
      for (let t = 1; t <= taskCount; t++) {
        const taskTemplate = getRandomElement(TASK_TEMPLATES);
        const taskStatus = isCompleted ? 'DONE' : status === 'DRAFT' ? 'TODO' : 
          getRandomElement(['TODO', 'IN_PROGRESS', 'IN_PROGRESS', 'REVIEW', 'DONE']);
        const assigneeName = Math.random() > 0.2 ? getRandomName(Math.random() > 0.5 ? 'male' : 'female') : null;
        
        const dueDate = new Date(milestoneDate);
        dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 7));
        const isOverdue = !isCompleted && taskStatus !== 'DONE' && dueDate < new Date();

        await prisma.project_task.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            platformInstanceId: DEMO_INSTANCE_ID,
            projectId: project.id,
            milestoneId: milestone.id,
            title: `${taskTemplate.title} - ${msTemplate.name}`,
            description: `Task for ${msTemplate.name} phase of ${template.name}`,
            status: taskStatus,
            priority: taskTemplate.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
            assigneeName,
            dueDate,
            estimatedHours: taskTemplate.estimatedHours,
            actualHours: taskStatus === 'DONE' ? taskTemplate.estimatedHours + Math.floor(Math.random() * 4) - 2 : null,
            completedDate: taskStatus === 'DONE' ? dueDate : null,
            isOverdue,
          },
        });
      }
    }

    // Create team members
    const teamSize = 3 + Math.floor(Math.random() * 4); // 3-6 team members
    const roles: Array<'OWNER' | 'MANAGER' | 'LEAD' | 'MEMBER' | 'OBSERVER'> = ['OWNER', 'MANAGER', 'LEAD', 'MEMBER', 'MEMBER', 'OBSERVER'];
    
    console.log(`  └─ 👥 Adding ${teamSize} team members`);

    for (let m = 0; m < teamSize; m++) {
      const memberName = getRandomName(Math.random() > 0.5 ? 'male' : 'female');
      const role = m === 0 ? 'OWNER' : m === 1 ? 'MANAGER' : getRandomElement(roles.slice(2));
      const memberType = m < teamSize - 1 ? 'STAFF' : (Math.random() > 0.7 ? 'EXTERNAL' : 'STAFF');

      await prisma.project_team_member.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          projectId: project.id,
          memberName,
          memberEmail: `${memberName.toLowerCase().replace(' ', '.')}@webwaka.com`,
          memberType,
          role,
          department: getRandomElement(['Operations', 'Programs', 'IT', 'Procurement', 'Engineering', 'HR', 'Finance']),
          joinedAt: startDate,
        },
      });
    }

    // Create budget items
    const budgetItemCount = 2 + Math.floor(Math.random() * 4); // 2-5 budget items
    console.log(`  └─ 💰 Adding ${budgetItemCount} budget items`);

    for (let b = 0; b < budgetItemCount; b++) {
      const category = getRandomElement(BUDGET_CATEGORIES);
      const estimatedAmount = Math.floor(template.budgetEstimated / budgetItemCount * (0.8 + Math.random() * 0.4));
      const hasActual = status !== 'DRAFT' && Math.random() > 0.3;
      const actualAmount = hasActual ? Math.floor(estimatedAmount * (0.85 + Math.random() * 0.3)) : null;
      const isApproved = status !== 'DRAFT';

      await prisma.project_budget_item.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          platformInstanceId: DEMO_INSTANCE_ID,
          projectId: project.id,
          category,
          description: `${category} expenses for ${template.name}`,
          estimatedAmount,
          actualAmount,
          currency: 'NGN',
          isApproved,
          approvedBy: isApproved ? ownerName : null,
          approvedAt: isApproved ? new Date() : null,
        },
      });
    }

    console.log(`  ✅ Project created successfully\n`);
  }

  console.log('🎉 Project Management demo data seeding complete!');
}

async function cleanupExistingData() {
  console.log('🧹 Cleaning up existing demo data...\n');
  
  // Delete in reverse dependency order
  await prisma.project_budget_item.deleteMany({
    where: { tenantId: DEMO_TENANT_ID },
  });
  
  await prisma.project_team_member.deleteMany({
    where: { tenantId: DEMO_TENANT_ID },
  });
  
  await prisma.project_task.deleteMany({
    where: { tenantId: DEMO_TENANT_ID },
  });
  
  await prisma.project_milestone.deleteMany({
    where: { tenantId: DEMO_TENANT_ID },
  });
  
  await prisma.project_project.deleteMany({
    where: { tenantId: DEMO_TENANT_ID },
  });
  
  console.log('✅ Cleanup complete\n');
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('  PROJECT MANAGEMENT SUITE — Demo Data Seeder');
    console.log('  Phase 7C.2, S5');
    console.log('═══════════════════════════════════════════════════\n');
    
    await cleanupExistingData();
    await seedProjects();
    
    // Summary statistics
    const projectCount = await prisma.project_project.count({ where: { tenantId: DEMO_TENANT_ID } });
    const milestoneCount = await prisma.project_milestone.count({ where: { tenantId: DEMO_TENANT_ID } });
    const taskCount = await prisma.project_task.count({ where: { tenantId: DEMO_TENANT_ID } });
    const teamCount = await prisma.project_team_member.count({ where: { tenantId: DEMO_TENANT_ID } });
    const budgetCount = await prisma.project_budget_item.count({ where: { tenantId: DEMO_TENANT_ID } });
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  📁 Projects:     ${projectCount}`);
    console.log(`  🎯 Milestones:   ${milestoneCount}`);
    console.log(`  ✅ Tasks:        ${taskCount}`);
    console.log(`  👥 Team Members: ${teamCount}`);
    console.log(`  💰 Budget Items: ${budgetCount}`);
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
