import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'acme' }
  });
  
  if (!tenant) {
    console.log('Tenant not found');
    return;
  }
  
  console.log('Tenant ID:', tenant.id);
  
  // Check existing staff
  let existingStaff = await prisma.staffMember.findMany({
    where: { tenantId: tenant.id },
    take: 5
  });
  
  console.log('Existing staff:', existingStaff.length);
  
  let staffId: string;
  
  if (existingStaff.length === 0) {
    // Create a test staff member
    const staff = await prisma.staffMember.create({
      data: {
        tenantId: tenant.id,
        email: 'test_hr_staff@acme.com',
        firstName: 'Test',
        lastName: 'HRStaff',
        phone: '+2348012345678',
        department: 'Engineering',
        jobTitle: 'Software Developer',
        status: 'ACTIVE'
      }
    });
    console.log('Created staff:', staff.id);
    staffId = staff.id;
  } else {
    console.log('Staff IDs:', existingStaff.map(s => s.id));
    staffId = existingStaff[0].id;
  }
  
  // Check HR employee profiles
  let hrProfiles = await prisma.hrEmployeeProfile.findMany({
    where: { tenantId: tenant.id },
    take: 5
  });
  console.log('HR Profiles:', hrProfiles.length);
  
  // Create HR employee profile if none exists
  if (hrProfiles.length === 0 && staffId) {
    // Check if profile already exists for this staff
    const existingProfile = await prisma.hrEmployeeProfile.findUnique({
      where: { staffId }
    });
    
    if (!existingProfile) {
      const profile = await prisma.hrEmployeeProfile.create({
        data: {
          tenantId: tenant.id,
          staffId,
          employmentType: 'FULL_TIME',
          jobTitle: 'Software Developer',
          department: 'Engineering',
          grade: 'L3',
          baseSalary: 500000,
          payFrequency: 'MONTHLY',
          paymentMethod: 'CASH',
          currency: 'NGN',
          hireDate: new Date(),
          annualLeaveEntitlement: 15,
          sickLeaveEntitlement: 10,
          casualLeaveEntitlement: 5
        }
      });
      console.log('Created HR profile:', profile.id);
      
      // Initialize leave balances
      const currentYear = new Date().getFullYear();
      const leaveTypes = [
        { type: 'ANNUAL' as const, entitlement: 15 },
        { type: 'SICK' as const, entitlement: 10 },
        { type: 'CASUAL' as const, entitlement: 5 },
      ];
      
      for (const { type, entitlement } of leaveTypes) {
        await prisma.hrLeaveBalance.upsert({
          where: {
            employeeProfileId_year_leaveType: {
              employeeProfileId: profile.id,
              year: currentYear,
              leaveType: type,
            },
          },
          create: {
            tenantId: tenant.id,
            employeeProfileId: profile.id,
            year: currentYear,
            leaveType: type,
            entitlement,
            available: entitlement,
          },
          update: {
            entitlement,
            available: entitlement,
          },
        });
      }
      console.log('Initialized leave balances');
    } else {
      console.log('Profile already exists for staff:', existingProfile.id);
    }
  }
  
  // Final check
  hrProfiles = await prisma.hrEmployeeProfile.findMany({
    where: { tenantId: tenant.id },
    take: 5
  });
  console.log('Final HR Profiles count:', hrProfiles.length);
  for (const p of hrProfiles) {
    console.log(`  - ${p.id}: ${p.department}, payFreq=${p.payFrequency}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
