/**
 * CIVIC SUITE: Demo Data API
 * 
 * POST - Seed demo data for the civic suite (Lagos Lands Bureau scenario)
 * GET - Get demo data status and statistics
 * 
 * Demo Scenario: Certificate of Occupancy (C of O) Application
 * - Lagos State Lands Bureau
 * - Citizen submits application
 * - Agency review → Inspection → Approval
 * 
 * @module api/civic/demo
 * @phase S4
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

// Nigerian demo data constants - Lagos Lands Bureau
const DEMO_AGENCY_NAME = 'Lagos State Lands Bureau'
const DEMO_AGENCY_CODE = 'LSLB'

// ============================================================================
// GET - Get demo data status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId

    // Check if demo data exists
    const existingAgency = await prisma.civic_agency.findFirst({
      where: { tenantId, code: DEMO_AGENCY_CODE }
    })

    if (!existingAgency) {
      return NextResponse.json({
        success: true,
        seeded: false,
        message: 'Demo data not yet seeded'
      })
    }

    // Get demo statistics
    const [
      citizenCount,
      organizationCount,
      agencyCount,
      staffCount,
      serviceCount,
      requestCount,
      caseCount,
      inspectionCount,
      approvalCount,
      billingFactCount
    ] = await Promise.all([
      prisma.civic_citizen.count({ where: { tenantId } }),
      prisma.civic_organization.count({ where: { tenantId } }),
      prisma.civic_agency.count({ where: { tenantId } }),
      prisma.civic_staff.count({ where: { tenantId } }),
      prisma.civic_service.count({ where: { tenantId } }),
      prisma.civic_request.count({ where: { tenantId } }),
      prisma.civic_case.count({ where: { tenantId } }),
      prisma.civic_inspection.count({ where: { tenantId } }),
      prisma.civic_approval.count({ where: { tenantId } }),
      prisma.civic_billing_fact.count({ where: { tenantId } })
    ])

    return NextResponse.json({
      success: true,
      seeded: true,
      agencyId: existingAgency.id,
      stats: {
        citizens: citizenCount,
        organizations: organizationCount,
        agencies: agencyCount,
        staff: staffCount,
        services: serviceCount,
        requests: requestCount,
        cases: caseCount,
        inspections: inspectionCount,
        approvals: approvalCount,
        billingFacts: billingFactCount
      }
    })
  } catch (error) {
    console.error('Civic Demo GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Seed demo data
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const { action } = body

    if (action !== 'seed') {
      return NextResponse.json({ error: 'Invalid action. Use action: "seed"' }, { status: 400 })
    }

    // Check if already seeded
    const existingAgency = await prisma.civic_agency.findFirst({
      where: { tenantId, code: DEMO_AGENCY_CODE }
    })

    if (existingAgency) {
      return NextResponse.json({
        success: true,
        message: 'Demo data already exists',
        action: 'exists',
        agencyId: existingAgency.id
      })
    }

    // Create civic config
    await prisma.civic_config.upsert({
      where: { tenantId },
      create: {
        tenantId,
        agencyName: DEMO_AGENCY_NAME,
        agencyCode: DEMO_AGENCY_CODE,
        jurisdiction: 'Lagos State',
        defaultSlaBusinessDays: 30,
        workingHoursStart: '08:00',
        workingHoursEnd: '16:00',
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        requirePaymentBeforeProcessing: true,
        autoAssignCases: false,
        allowAnonymousComplaints: false,
        enablePublicTracking: true
      },
      update: {}
    })

    // ========================================================================
    // STEP 1: Create Agency Structure
    // ========================================================================

    // Create Lagos Lands Bureau
    const agency = await prisma.civic_agency.create({
      data: {
        tenantId,
        code: DEMO_AGENCY_CODE,
        name: DEMO_AGENCY_NAME,
        description: 'Government agency responsible for land administration and management in Lagos State',
        jurisdiction: 'Lagos State',
        phone: '+234 1 234 5678',
        email: 'enquiries@lagoslands.lg.gov.ng',
        website: 'https://lagoslands.lg.gov.ng',
        address: {
          building: 'Lands Bureau Complex',
          street: 'Block A, Secretariat',
          area: 'Alausa, Ikeja',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        },
        headName: 'Engr. Abiodun Bamigboye',
        headTitle: 'Surveyor-General',
        isActive: true
      }
    })

    // Create Departments
    const deptCofO = await prisma.civic_department.create({
      data: {
        tenantId,
        agencyId: agency.id,
        code: 'COO',
        name: 'Certificate of Occupancy',
        description: 'Processing and issuance of Certificate of Occupancy',
        headName: 'Mrs. Folake Adeyemi',
        headTitle: 'Director',
        isActive: true
      }
    })

    const deptSurvey = await prisma.civic_department.create({
      data: {
        tenantId,
        agencyId: agency.id,
        code: 'SRV',
        name: 'Survey & Mapping',
        description: 'Land survey, charting, and boundary verification',
        headName: 'Surv. Emmanuel Ogunlade',
        headTitle: 'Deputy Director (Survey)',
        isActive: true
      }
    })

    const deptLitigation = await prisma.civic_department.create({
      data: {
        tenantId,
        agencyId: agency.id,
        code: 'LIT',
        name: 'Land Litigation',
        description: 'Resolution of land disputes and legal matters',
        headName: 'Barr. Chidinma Okwu',
        headTitle: 'Head of Legal',
        isActive: true
      }
    })

    // Create Units under C of O Department
    const unitProcessing = await prisma.civic_unit.create({
      data: {
        tenantId,
        departmentId: deptCofO.id,
        code: 'PRC',
        name: 'Application Processing',
        description: 'Initial processing and verification of C of O applications',
        isActive: true
      }
    })

    const unitInspection = await prisma.civic_unit.create({
      data: {
        tenantId,
        departmentId: deptCofO.id,
        code: 'INS',
        name: 'Field Inspection',
        description: 'Site visits and physical verification',
        isActive: true
      }
    })

    // ========================================================================
    // STEP 2: Create Staff
    // ========================================================================

    const staff = await Promise.all([
      // Admin
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptCofO.id,
          staffNumber: 'LSLB-2024-001',
          firstName: 'Adebayo',
          lastName: 'Okonkwo',
          phone: '+234 802 111 2222',
          email: 'adebayo.okonkwo@lagoslands.lg.gov.ng',
          role: 'ADMIN',
          designation: 'Senior Land Officer',
          hireDate: new Date('2019-03-15'),
          isActive: true
        }
      }),
      // Manager
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptCofO.id,
          unitId: unitProcessing.id,
          staffNumber: 'LSLB-2024-002',
          firstName: 'Ngozi',
          lastName: 'Eze',
          phone: '+234 803 222 3333',
          email: 'ngozi.eze@lagoslands.lg.gov.ng',
          role: 'MANAGER',
          designation: 'Processing Unit Head',
          hireDate: new Date('2018-06-01'),
          isActive: true
        }
      }),
      // Officers
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptCofO.id,
          unitId: unitProcessing.id,
          staffNumber: 'LSLB-2024-003',
          firstName: 'Chukwuemeka',
          lastName: 'Nwosu',
          phone: '+234 804 333 4444',
          email: 'chukwuemeka.nwosu@lagoslands.lg.gov.ng',
          role: 'OFFICER',
          designation: 'Land Officer',
          hireDate: new Date('2021-01-10'),
          isActive: true
        }
      }),
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptCofO.id,
          unitId: unitProcessing.id,
          staffNumber: 'LSLB-2024-004',
          firstName: 'Aisha',
          lastName: 'Bello',
          phone: '+234 805 444 5555',
          email: 'aisha.bello@lagoslands.lg.gov.ng',
          role: 'OFFICER',
          designation: 'Land Officer',
          hireDate: new Date('2022-04-01'),
          isActive: true
        }
      }),
      // Inspectors
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptCofO.id,
          unitId: unitInspection.id,
          staffNumber: 'LSLB-2024-005',
          firstName: 'Olumide',
          lastName: 'Adeyanju',
          phone: '+234 806 555 6666',
          email: 'olumide.adeyanju@lagoslands.lg.gov.ng',
          role: 'INSPECTOR',
          designation: 'Field Inspector',
          hireDate: new Date('2020-08-15'),
          isActive: true
        }
      }),
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptSurvey.id,
          staffNumber: 'LSLB-2024-006',
          firstName: 'Ibrahim',
          lastName: 'Mohammed',
          phone: '+234 807 666 7777',
          email: 'ibrahim.mohammed@lagoslands.lg.gov.ng',
          role: 'INSPECTOR',
          designation: 'Survey Inspector',
          hireDate: new Date('2019-11-01'),
          isActive: true
        }
      }),
      // Clerk
      prisma.civic_staff.create({
        data: {
          tenantId,
          agencyId: agency.id,
          departmentId: deptCofO.id,
          unitId: unitProcessing.id,
          staffNumber: 'LSLB-2024-007',
          firstName: 'Blessing',
          lastName: 'Ogunkoya',
          phone: '+234 808 777 8888',
          email: 'blessing.ogunkoya@lagoslands.lg.gov.ng',
          role: 'CLERK',
          designation: 'Records Clerk',
          hireDate: new Date('2023-02-01'),
          isActive: true
        }
      })
    ])

    // ========================================================================
    // STEP 3: Create Service Catalogue
    // ========================================================================

    const services = await Promise.all([
      // Certificate of Occupancy
      prisma.civic_service.create({
        data: {
          tenantId,
          agencyId: agency.id,
          code: 'COO-001',
          name: 'Certificate of Occupancy (C of O)',
          description: 'Application for issuance of Certificate of Occupancy for land within Lagos State',
          category: 'CERTIFICATES',
          eligibility: 'Nigerian citizens, corporations, or foreigners with valid residency. Land must be within Lagos State jurisdiction.',
          processFlow: JSON.stringify([
            { step: 1, name: 'Application Submission', description: 'Submit application with required documents' },
            { step: 2, name: 'Initial Review', description: 'Verification of documents and application details' },
            { step: 3, name: 'Payment', description: 'Payment of applicable fees' },
            { step: 4, name: 'Survey Verification', description: 'Confirmation of land boundaries and survey plan' },
            { step: 5, name: 'Site Inspection', description: 'Physical inspection of the property' },
            { step: 6, name: 'Governor\'s Approval', description: 'Final approval by the Governor' },
            { step: 7, name: 'Certificate Issuance', description: 'Collection of Certificate of Occupancy' }
          ]),
          requiredDocuments: JSON.stringify([
            'Completed application form',
            'Survey plan (certified by registered surveyor)',
            'Deed of assignment or purchase receipt',
            'Tax clearance certificate (3 years)',
            'Evidence of land ownership',
            'Passport photographs (4 copies)',
            'Valid means of identification',
            'Company registration documents (for corporate applicants)'
          ]),
          baseFee: 250000,
          processingFee: 50000,
          inspectionFee: 35000,
          vatApplicable: true,
          slaBusinessDays: 90,
          validityDays: null, // Permanent
          renewalRequired: false,
          isActive: true
        }
      }),
      // Deed of Assignment Registration
      prisma.civic_service.create({
        data: {
          tenantId,
          agencyId: agency.id,
          code: 'DOA-001',
          name: 'Deed of Assignment Registration',
          description: 'Registration of deed of assignment for transfer of property ownership',
          category: 'CERTIFICATES',
          eligibility: 'Parties involved in property transfer with valid sale agreement',
          processFlow: JSON.stringify([
            { step: 1, name: 'Application Submission', description: 'Submit deed for registration' },
            { step: 2, name: 'Document Verification', description: 'Verification of deed and supporting documents' },
            { step: 3, name: 'Payment', description: 'Payment of stamp duty and registration fees' },
            { step: 4, name: 'Registration', description: 'Recording in land registry' },
            { step: 5, name: 'Collection', description: 'Collection of registered deed' }
          ]),
          requiredDocuments: JSON.stringify([
            'Original deed of assignment',
            'Photocopy of deed (3 copies)',
            'Seller\'s C of O or family receipt',
            'Tax clearance (seller and buyer)',
            'Valid ID of parties',
            'Passport photographs'
          ]),
          baseFee: 75000,
          processingFee: 25000,
          inspectionFee: 0,
          vatApplicable: true,
          slaBusinessDays: 30,
          validityDays: null,
          renewalRequired: false,
          isActive: true
        }
      }),
      // Building Plan Approval
      prisma.civic_service.create({
        data: {
          tenantId,
          agencyId: agency.id,
          code: 'BPA-001',
          name: 'Building Plan Approval',
          description: 'Approval of building plans for construction within Lagos State',
          category: 'PERMITS',
          eligibility: 'Property owners or developers with valid land title',
          processFlow: JSON.stringify([
            { step: 1, name: 'Submission', description: 'Submit building plans with architectural drawings' },
            { step: 2, name: 'Technical Review', description: 'Review by town planning department' },
            { step: 3, name: 'Payment', description: 'Payment of approval fees' },
            { step: 4, name: 'Site Inspection', description: 'Pre-construction site inspection' },
            { step: 5, name: 'Approval', description: 'Issuance of building approval' }
          ]),
          requiredDocuments: JSON.stringify([
            'Architectural drawings (6 copies)',
            'Structural drawings',
            'Survey plan',
            'C of O or evidence of ownership',
            'Environmental impact assessment (for large projects)'
          ]),
          baseFee: 150000,
          processingFee: 30000,
          inspectionFee: 25000,
          vatApplicable: true,
          slaBusinessDays: 45,
          validityDays: 365,
          renewalRequired: true,
          renewalNoticeDays: 30,
          isActive: true
        }
      }),
      // Survey Plan Certification
      prisma.civic_service.create({
        data: {
          tenantId,
          agencyId: agency.id,
          code: 'SPC-001',
          name: 'Survey Plan Certification',
          description: 'Official certification of survey plans by the Surveyor-General',
          category: 'CERTIFICATES',
          eligibility: 'Any person with a survey plan prepared by a registered surveyor',
          processFlow: JSON.stringify([
            { step: 1, name: 'Submission', description: 'Submit survey plan for verification' },
            { step: 2, name: 'Technical Check', description: 'Verification against master plan' },
            { step: 3, name: 'Payment', description: 'Payment of certification fee' },
            { step: 4, name: 'Certification', description: 'Certification by Surveyor-General' }
          ]),
          requiredDocuments: JSON.stringify([
            'Original survey plan',
            'Beacon numbers',
            'Surveyor\'s license copy',
            'Evidence of ownership'
          ]),
          baseFee: 45000,
          processingFee: 10000,
          inspectionFee: 20000,
          vatApplicable: true,
          slaBusinessDays: 21,
          validityDays: null,
          renewalRequired: false,
          isActive: true
        }
      })
    ])

    // ========================================================================
    // STEP 4: Create Citizens
    // ========================================================================

    const citizens = await Promise.all([
      prisma.civic_citizen.create({
        data: {
          tenantId,
          citizenNumber: 'CIT-2024-00001',
          firstName: 'Adewale',
          lastName: 'Johnson',
          middleName: 'Oluwaseun',
          title: 'Chief',
          phone: '+234 812 345 6789',
          email: 'adewale.johnson@gmail.com',
          address: {
            street: '25 Allen Avenue',
            area: 'Ikeja',
            city: 'Lagos',
            state: 'Lagos',
            lga: 'Ikeja',
            country: 'Nigeria'
          },
          dateOfBirth: new Date('1975-03-15'),
          gender: 'Male',
          occupation: 'Business Executive',
          isActive: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staff[0].id
        }
      }),
      prisma.civic_citizen.create({
        data: {
          tenantId,
          citizenNumber: 'CIT-2024-00002',
          firstName: 'Folakemi',
          lastName: 'Adeleke',
          middleName: 'Olabisi',
          title: 'Mrs',
          phone: '+234 803 456 7890',
          email: 'folakemi.adeleke@yahoo.com',
          address: {
            street: '10 Bode Thomas Street',
            area: 'Surulere',
            city: 'Lagos',
            state: 'Lagos',
            lga: 'Surulere',
            country: 'Nigeria'
          },
          dateOfBirth: new Date('1982-08-22'),
          gender: 'Female',
          occupation: 'Architect',
          isActive: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staff[0].id
        }
      }),
      prisma.civic_citizen.create({
        data: {
          tenantId,
          citizenNumber: 'CIT-2024-00003',
          firstName: 'Emeka',
          lastName: 'Obi',
          middleName: 'Chukwudi',
          title: 'Mr',
          phone: '+234 814 567 8901',
          email: 'emeka.obi@hotmail.com',
          address: {
            street: '5 Admiralty Road',
            area: 'Lekki Phase 1',
            city: 'Lagos',
            state: 'Lagos',
            lga: 'Eti-Osa',
            country: 'Nigeria'
          },
          dateOfBirth: new Date('1988-12-05'),
          gender: 'Male',
          occupation: 'Software Engineer',
          isActive: true,
          isVerified: false
        }
      }),
      prisma.civic_citizen.create({
        data: {
          tenantId,
          citizenNumber: 'CIT-2024-00004',
          firstName: 'Hauwa',
          lastName: 'Ibrahim',
          middleName: 'Amina',
          title: 'Dr',
          phone: '+234 805 678 9012',
          email: 'hauwa.ibrahim@gmail.com',
          address: {
            street: '15 Sanusi Fafunwa Street',
            area: 'Victoria Island',
            city: 'Lagos',
            state: 'Lagos',
            lga: 'Eti-Osa',
            country: 'Nigeria'
          },
          dateOfBirth: new Date('1979-05-18'),
          gender: 'Female',
          occupation: 'Medical Doctor',
          isActive: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staff[0].id
        }
      }),
      prisma.civic_citizen.create({
        data: {
          tenantId,
          citizenNumber: 'CIT-2024-00005',
          firstName: 'Tunde',
          lastName: 'Bakare',
          middleName: 'Olumayowa',
          title: 'Engr',
          phone: '+234 816 789 0123',
          email: 'tunde.bakare@outlook.com',
          address: {
            street: '8 Opebi Road',
            area: 'Opebi',
            city: 'Lagos',
            state: 'Lagos',
            lga: 'Ikeja',
            country: 'Nigeria'
          },
          dateOfBirth: new Date('1970-11-30'),
          gender: 'Male',
          occupation: 'Civil Engineer',
          isActive: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staff[0].id
        }
      })
    ])

    // ========================================================================
    // STEP 5: Create Organizations
    // ========================================================================

    const organizations = await Promise.all([
      prisma.civic_organization.create({
        data: {
          tenantId,
          orgNumber: 'ORG-2024-00001',
          name: 'Zenith Properties Limited',
          tradeName: 'Zenith Properties',
          registrationType: 'Limited Liability Company',
          rcNumber: 'RC123456',
          taxId: 'TIN-1234567890',
          phone: '+234 1 234 5678',
          email: 'info@zenithproperties.ng',
          website: 'https://zenithproperties.ng',
          address: {
            street: '25 Adeola Odeku Street',
            area: 'Victoria Island',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
          },
          contactPerson: 'Mr. Femi Adeboye',
          contactPersonPhone: '+234 802 111 2222',
          contactPersonEmail: 'femi@zenithproperties.ng',
          isActive: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staff[0].id
        }
      }),
      prisma.civic_organization.create({
        data: {
          tenantId,
          orgNumber: 'ORG-2024-00002',
          name: 'BuildRight Construction Company',
          tradeName: 'BuildRight',
          registrationType: 'Limited Liability Company',
          rcNumber: 'RC789012',
          taxId: 'TIN-0987654321',
          phone: '+234 1 987 6543',
          email: 'contact@buildright.ng',
          address: {
            street: '10 Industrial Avenue',
            area: 'Apapa',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
          },
          contactPerson: 'Engr. Bola Akinlade',
          contactPersonPhone: '+234 803 222 3333',
          contactPersonEmail: 'bola@buildright.ng',
          isActive: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staff[0].id
        }
      })
    ])

    // ========================================================================
    // STEP 6: Create Service Requests with Various Statuses
    // ========================================================================

    // Request 1: Completed C of O application (approved)
    const request1 = await prisma.civic_request.create({
      data: {
        tenantId,
        requestNumber: 'REQ-2024-00001',
        trackingCode: 'LSLB-A1B2C3',
        citizenId: citizens[0].id,
        applicantName: 'Chief Adewale Oluwaseun Johnson',
        applicantPhone: citizens[0].phone,
        applicantEmail: citizens[0].email,
        serviceId: services[0].id,
        serviceName: services[0].name,
        subject: 'C of O Application - Plot at Lekki',
        description: 'Application for Certificate of Occupancy for a plot of land measuring 1000sqm at Lekki Phase 2',
        location: {
          address: 'Plot 15, Block A, Lekki Phase 2',
          lga: 'Eti-Osa',
          coordinates: { lat: 6.4698, lng: 3.5852 }
        },
        status: 'APPROVED',
        submittedAt: new Date('2024-06-15'),
        acknowledgedAt: new Date('2024-06-16'),
        isPaid: true,
        paidAt: new Date('2024-06-20'),
        paymentRef: 'PAY-2024-00001',
        totalAmount: 335000,
        outcomeDate: new Date('2024-10-15'),
        outcomeNote: 'Certificate of Occupancy approved and ready for collection',
        validUntil: null,
        certificateId: 'COO/LK/2024/00125'
      }
    })

    // Request 2: Pending inspection
    const request2 = await prisma.civic_request.create({
      data: {
        tenantId,
        requestNumber: 'REQ-2024-00002',
        trackingCode: 'LSLB-D4E5F6',
        citizenId: citizens[1].id,
        applicantName: 'Mrs Folakemi Olabisi Adeleke',
        applicantPhone: citizens[1].phone,
        applicantEmail: citizens[1].email,
        serviceId: services[2].id,
        serviceName: services[2].name,
        subject: 'Building Plan Approval - Residential',
        description: 'Application for building plan approval for a 4-bedroom duplex at Surulere',
        location: {
          address: '45 Adeniran Ogunsanya Street, Surulere',
          lga: 'Surulere'
        },
        status: 'PENDING_INSPECTION',
        submittedAt: new Date('2024-11-01'),
        acknowledgedAt: new Date('2024-11-02'),
        isPaid: true,
        paidAt: new Date('2024-11-05'),
        paymentRef: 'PAY-2024-00002',
        totalAmount: 205000
      }
    })

    // Request 3: Under review
    const request3 = await prisma.civic_request.create({
      data: {
        tenantId,
        requestNumber: 'REQ-2024-00003',
        trackingCode: 'LSLB-G7H8I9',
        citizenId: citizens[2].id,
        applicantName: 'Mr Emeka Chukwudi Obi',
        applicantPhone: citizens[2].phone,
        applicantEmail: citizens[2].email,
        serviceId: services[0].id,
        serviceName: services[0].name,
        subject: 'C of O Application - Land at Ajah',
        description: 'Application for Certificate of Occupancy for land at Ajah',
        location: {
          address: 'Plot 8, Badore Road, Ajah',
          lga: 'Eti-Osa'
        },
        status: 'UNDER_REVIEW',
        submittedAt: new Date('2024-12-01'),
        acknowledgedAt: new Date('2024-12-02'),
        isPaid: true,
        paidAt: new Date('2024-12-05'),
        paymentRef: 'PAY-2024-00003',
        totalAmount: 335000
      }
    })

    // Request 4: Pending payment
    const request4 = await prisma.civic_request.create({
      data: {
        tenantId,
        requestNumber: 'REQ-2024-00004',
        trackingCode: 'LSLB-J0K1L2',
        organizationId: organizations[0].id,
        applicantName: 'Zenith Properties Limited',
        applicantPhone: organizations[0].phone,
        applicantEmail: organizations[0].email,
        serviceId: services[0].id,
        serviceName: services[0].name,
        subject: 'C of O Application - Commercial Plot',
        description: 'Application for Certificate of Occupancy for commercial land at Victoria Island',
        location: {
          address: '100 Adeola Hopewell Street, Victoria Island',
          lga: 'Eti-Osa'
        },
        status: 'PENDING_PAYMENT',
        submittedAt: new Date('2024-12-10'),
        acknowledgedAt: new Date('2024-12-11'),
        isPaid: false
      }
    })

    // Request 5: Draft
    const request5 = await prisma.civic_request.create({
      data: {
        tenantId,
        requestNumber: 'REQ-2024-00005',
        trackingCode: 'LSLB-M3N4O5',
        citizenId: citizens[4].id,
        applicantName: 'Engr Tunde Olumayowa Bakare',
        applicantPhone: citizens[4].phone,
        applicantEmail: citizens[4].email,
        serviceId: services[3].id,
        serviceName: services[3].name,
        subject: 'Survey Plan Certification',
        description: 'Certification of survey plan for property at Ikeja',
        location: {
          address: '20 Joel Ogunnaike Street, Ikeja GRA',
          lga: 'Ikeja'
        },
        status: 'DRAFT',
        isPaid: false
      }
    })

    // ========================================================================
    // STEP 7: Create Cases for Active Requests
    // ========================================================================

    // Case 1: Completed (for request 1)
    const case1 = await prisma.civic_case.create({
      data: {
        tenantId,
        requestId: request1.id,
        caseNumber: 'CASE-2024-00001',
        priority: 'NORMAL',
        status: 'CLOSED',
        slaDeadline: new Date('2024-10-15'),
        slaBreached: false,
        isEscalated: false
      }
    })

    // Case 2: In progress (for request 2)
    const case2 = await prisma.civic_case.create({
      data: {
        tenantId,
        requestId: request2.id,
        caseNumber: 'CASE-2024-00002',
        priority: 'NORMAL',
        status: 'IN_PROGRESS',
        slaDeadline: new Date('2025-01-15'),
        slaBreached: false,
        isEscalated: false
      }
    })

    // Case 3: Assigned (for request 3)
    const case3 = await prisma.civic_case.create({
      data: {
        tenantId,
        requestId: request3.id,
        caseNumber: 'CASE-2024-00003',
        priority: 'HIGH',
        status: 'ASSIGNED',
        slaDeadline: new Date('2025-03-01'),
        slaBreached: false,
        isEscalated: false
      }
    })

    // ========================================================================
    // STEP 8: Create Case Assignments
    // ========================================================================

    await Promise.all([
      prisma.civic_case_assignment.create({
        data: {
          tenantId,
          caseId: case1.id,
          staffId: staff[2].id,
          assignedBy: staff[1].id,
          assignedAt: new Date('2024-06-17'),
          isActive: false,
          completedAt: new Date('2024-10-15')
        }
      }),
      prisma.civic_case_assignment.create({
        data: {
          tenantId,
          caseId: case2.id,
          staffId: staff[3].id,
          assignedBy: staff[1].id,
          assignedAt: new Date('2024-11-05'),
          isActive: true
        }
      }),
      prisma.civic_case_assignment.create({
        data: {
          tenantId,
          caseId: case3.id,
          staffId: staff[2].id,
          assignedBy: staff[1].id,
          assignedAt: new Date('2024-12-05'),
          isActive: true
        }
      })
    ])

    // ========================================================================
    // STEP 9: Create Case Notes (Append-Only)
    // ========================================================================

    await Promise.all([
      // Case 1 notes
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case1.id,
          content: 'Application received. All documents verified and complete.',
          noteType: 'PROGRESS',
          isInternal: true,
          authorId: staff[2].id,
          authorName: 'Chukwuemeka Nwosu'
        }
      }),
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case1.id,
          content: 'Survey plan verified against master records. Coordinates confirmed.',
          noteType: 'PROGRESS',
          isInternal: true,
          authorId: staff[5].id,
          authorName: 'Ibrahim Mohammed'
        }
      }),
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case1.id,
          content: 'Site inspection completed. No encumbrances found. Recommended for approval.',
          noteType: 'INSPECTION',
          isInternal: true,
          authorId: staff[4].id,
          authorName: 'Olumide Adeyanju'
        }
      }),
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case1.id,
          content: 'Governor\'s approval obtained. Certificate ready for issuance.',
          noteType: 'APPROVAL',
          isInternal: true,
          authorId: staff[0].id,
          authorName: 'Adebayo Okonkwo'
        }
      }),
      // Case 2 notes
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case2.id,
          content: 'Building plans received. Architectural drawings verified.',
          noteType: 'PROGRESS',
          isInternal: true,
          authorId: staff[3].id,
          authorName: 'Aisha Bello'
        }
      }),
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case2.id,
          content: 'Scheduled for site inspection on 15th January 2025.',
          noteType: 'PROGRESS',
          isInternal: false,
          authorId: staff[3].id,
          authorName: 'Aisha Bello'
        }
      }),
      // Case 3 notes
      prisma.civic_case_note.create({
        data: {
          tenantId,
          caseId: case3.id,
          content: 'Case assigned for processing. High priority due to land value.',
          noteType: 'PROGRESS',
          isInternal: true,
          authorId: staff[1].id,
          authorName: 'Ngozi Eze'
        }
      })
    ])

    // ========================================================================
    // STEP 10: Create Status Changes (Append-Only Audit Trail)
    // ========================================================================

    await Promise.all([
      // Case 1 status trail
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case1.id,
          fromStatus: 'OPEN',
          toStatus: 'ASSIGNED',
          reason: 'Case assigned to Land Officer for processing',
          changedById: staff[1].id,
          changedByName: 'Ngozi Eze'
        }
      }),
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case1.id,
          fromStatus: 'ASSIGNED',
          toStatus: 'IN_PROGRESS',
          reason: 'Document verification in progress',
          changedById: staff[2].id,
          changedByName: 'Chukwuemeka Nwosu'
        }
      }),
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case1.id,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'RESOLVED',
          reason: 'All processing complete. Certificate ready.',
          changedById: staff[0].id,
          changedByName: 'Adebayo Okonkwo'
        }
      }),
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case1.id,
          fromStatus: 'RESOLVED',
          toStatus: 'CLOSED',
          reason: 'Certificate collected by applicant',
          changedById: staff[6].id,
          changedByName: 'Blessing Ogunkoya'
        }
      }),
      // Case 2 status trail
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case2.id,
          fromStatus: 'OPEN',
          toStatus: 'ASSIGNED',
          reason: 'Assigned for building plan review',
          changedById: staff[1].id,
          changedByName: 'Ngozi Eze'
        }
      }),
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case2.id,
          fromStatus: 'ASSIGNED',
          toStatus: 'IN_PROGRESS',
          reason: 'Technical review in progress',
          changedById: staff[3].id,
          changedByName: 'Aisha Bello'
        }
      }),
      // Case 3 status trail
      prisma.civic_case_status_change.create({
        data: {
          tenantId,
          caseId: case3.id,
          fromStatus: 'OPEN',
          toStatus: 'ASSIGNED',
          reason: 'Assigned for C of O processing',
          changedById: staff[1].id,
          changedByName: 'Ngozi Eze'
        }
      })
    ])

    // ========================================================================
    // STEP 11: Create Inspections
    // ========================================================================

    // Completed inspection for case 1
    const inspection1 = await prisma.civic_inspection.create({
      data: {
        tenantId,
        caseId: case1.id,
        inspectionNumber: 'INSP-2024-00001',
        scheduledDate: new Date('2024-08-15'),
        scheduledTime: '10:00',
        completedAt: new Date('2024-08-15'),
        location: {
          address: 'Plot 15, Block A, Lekki Phase 2',
          lga: 'Eti-Osa',
          accessNotes: 'Enter through main gate, plot on the left'
        },
        inspectorId: staff[4].id,
        inspectorName: 'Olumide Adeyanju',
        status: 'COMPLETED',
        result: 'PASSED',
        resultNote: 'Land boundaries match survey plan. No encumbrances or disputes found. Property suitable for C of O issuance.'
      }
    })

    // Scheduled inspection for case 2
    const inspection2 = await prisma.civic_inspection.create({
      data: {
        tenantId,
        caseId: case2.id,
        inspectionNumber: 'INSP-2024-00002',
        scheduledDate: new Date('2025-01-15'),
        scheduledTime: '09:00',
        location: {
          address: '45 Adeniran Ogunsanya Street, Surulere',
          lga: 'Surulere'
        },
        inspectorId: staff[4].id,
        inspectorName: 'Olumide Adeyanju',
        status: 'SCHEDULED'
      }
    })

    // ========================================================================
    // STEP 12: Create Inspection Findings (Append-Only)
    // ========================================================================

    await Promise.all([
      prisma.civic_inspection_finding.create({
        data: {
          tenantId,
          inspectionId: inspection1.id,
          category: 'BOUNDARY_VERIFICATION',
          description: 'All four corners properly beaconed. Coordinates match survey plan.',
          severity: 'INFO',
          recordedById: staff[4].id,
          recordedByName: 'Olumide Adeyanju'
        }
      }),
      prisma.civic_inspection_finding.create({
        data: {
          tenantId,
          inspectionId: inspection1.id,
          category: 'LAND_USE',
          description: 'Land currently vacant. No structures or developments. Suitable for intended use.',
          severity: 'INFO',
          recordedById: staff[4].id,
          recordedByName: 'Olumide Adeyanju'
        }
      }),
      prisma.civic_inspection_finding.create({
        data: {
          tenantId,
          inspectionId: inspection1.id,
          category: 'ENCUMBRANCE_CHECK',
          description: 'No adverse claims or disputes registered. Clear title confirmed.',
          severity: 'INFO',
          recordedById: staff[4].id,
          recordedByName: 'Olumide Adeyanju'
        }
      })
    ])

    // ========================================================================
    // STEP 13: Create Approvals (Append-Only)
    // ========================================================================

    await prisma.civic_approval.create({
      data: {
        tenantId,
        caseId: case1.id,
        approvalNumber: 'APR-2024-00001',
        decision: 'APPROVED',
        approverId: staff[0].id,
        approverName: 'Adebayo Okonkwo',
        approverRole: 'Senior Land Officer',
        rationale: 'All requirements met. Survey verified. Inspection passed. Recommended for Governor\'s consent.',
        conditions: null,
        referenceNote: 'Governor\'s consent obtained via batch approval GC/LSLB/2024/Q4/125'
      }
    })

    // ========================================================================
    // STEP 14: Create Billing Facts (Commerce Boundary)
    // ========================================================================

    await Promise.all([
      // Request 1 fees (BILLED)
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request1.id,
          citizenId: citizens[0].id,
          factType: 'SERVICE_FEE',
          description: 'Certificate of Occupancy - Base Fee',
          quantity: 1,
          unitAmount: 250000,
          amount: 250000,
          serviceDate: new Date('2024-06-20'),
          status: 'BILLED',
          billedAt: new Date('2024-06-20'),
          billingInvoiceId: 'INV-2024-00001'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request1.id,
          citizenId: citizens[0].id,
          factType: 'PROCESSING_FEE',
          description: 'C of O Processing Fee',
          quantity: 1,
          unitAmount: 50000,
          amount: 50000,
          serviceDate: new Date('2024-06-20'),
          status: 'BILLED',
          billedAt: new Date('2024-06-20'),
          billingInvoiceId: 'INV-2024-00001'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request1.id,
          citizenId: citizens[0].id,
          factType: 'INSPECTION_FEE',
          description: 'Site Inspection Fee',
          quantity: 1,
          unitAmount: 35000,
          amount: 35000,
          serviceDate: new Date('2024-08-15'),
          status: 'BILLED',
          billedAt: new Date('2024-08-15'),
          billingInvoiceId: 'INV-2024-00002'
        }
      }),
      // Request 2 fees (BILLED)
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request2.id,
          citizenId: citizens[1].id,
          factType: 'SERVICE_FEE',
          description: 'Building Plan Approval - Base Fee',
          quantity: 1,
          unitAmount: 150000,
          amount: 150000,
          serviceDate: new Date('2024-11-05'),
          status: 'BILLED',
          billedAt: new Date('2024-11-05'),
          billingInvoiceId: 'INV-2024-00003'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request2.id,
          citizenId: citizens[1].id,
          factType: 'PROCESSING_FEE',
          description: 'Building Plan Processing Fee',
          quantity: 1,
          unitAmount: 30000,
          amount: 30000,
          serviceDate: new Date('2024-11-05'),
          status: 'BILLED',
          billedAt: new Date('2024-11-05'),
          billingInvoiceId: 'INV-2024-00003'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request2.id,
          citizenId: citizens[1].id,
          factType: 'INSPECTION_FEE',
          description: 'Pre-construction Inspection Fee',
          quantity: 1,
          unitAmount: 25000,
          amount: 25000,
          status: 'PENDING'
        }
      }),
      // Request 3 fees (BILLED)
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request3.id,
          citizenId: citizens[2].id,
          factType: 'SERVICE_FEE',
          description: 'Certificate of Occupancy - Base Fee',
          quantity: 1,
          unitAmount: 250000,
          amount: 250000,
          serviceDate: new Date('2024-12-05'),
          status: 'BILLED',
          billedAt: new Date('2024-12-05'),
          billingInvoiceId: 'INV-2024-00004'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request3.id,
          citizenId: citizens[2].id,
          factType: 'PROCESSING_FEE',
          description: 'C of O Processing Fee',
          quantity: 1,
          unitAmount: 50000,
          amount: 50000,
          serviceDate: new Date('2024-12-05'),
          status: 'BILLED',
          billedAt: new Date('2024-12-05'),
          billingInvoiceId: 'INV-2024-00004'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request3.id,
          citizenId: citizens[2].id,
          factType: 'INSPECTION_FEE',
          description: 'Site Inspection Fee',
          quantity: 1,
          unitAmount: 35000,
          amount: 35000,
          status: 'PENDING'
        }
      }),
      // Request 4 fees (PENDING)
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request4.id,
          factType: 'SERVICE_FEE',
          description: 'Certificate of Occupancy - Base Fee',
          quantity: 1,
          unitAmount: 250000,
          amount: 250000,
          status: 'PENDING'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request4.id,
          factType: 'PROCESSING_FEE',
          description: 'C of O Processing Fee',
          quantity: 1,
          unitAmount: 50000,
          amount: 50000,
          status: 'PENDING'
        }
      }),
      prisma.civic_billing_fact.create({
        data: {
          tenantId,
          requestId: request4.id,
          factType: 'INSPECTION_FEE',
          description: 'Site Inspection Fee',
          quantity: 1,
          unitAmount: 35000,
          amount: 35000,
          status: 'PENDING'
        }
      })
    ])

    // ========================================================================
    // STEP 15: Create Audit Logs (Append-Only)
    // ========================================================================

    await Promise.all([
      prisma.civic_audit_log.create({
        data: {
          tenantId,
          action: 'REQUEST_SUBMITTED',
          entityType: 'civic_request',
          entityId: request1.id,
          actorId: null,
          actorName: 'Chief Adewale Johnson',
          actorRole: 'Citizen',
          description: 'C of O application submitted via online portal'
        }
      }),
      prisma.civic_audit_log.create({
        data: {
          tenantId,
          action: 'REQUEST_ACKNOWLEDGED',
          entityType: 'civic_request',
          entityId: request1.id,
          actorId: staff[6].id,
          actorName: 'Blessing Ogunkoya',
          actorRole: 'Records Clerk',
          description: 'Application acknowledged and assigned tracking code'
        }
      }),
      prisma.civic_audit_log.create({
        data: {
          tenantId,
          action: 'CASE_CREATED',
          entityType: 'civic_case',
          entityId: case1.id,
          actorId: staff[1].id,
          actorName: 'Ngozi Eze',
          actorRole: 'Processing Unit Head',
          description: 'Case file created for processing'
        }
      }),
      prisma.civic_audit_log.create({
        data: {
          tenantId,
          action: 'INSPECTION_COMPLETED',
          entityType: 'civic_inspection',
          entityId: inspection1.id,
          actorId: staff[4].id,
          actorName: 'Olumide Adeyanju',
          actorRole: 'Field Inspector',
          description: 'Site inspection completed with PASS result'
        }
      }),
      prisma.civic_audit_log.create({
        data: {
          tenantId,
          action: 'APPROVAL_GRANTED',
          entityType: 'civic_approval',
          entityId: case1.id,
          actorId: staff[0].id,
          actorName: 'Adebayo Okonkwo',
          actorRole: 'Senior Land Officer',
          description: 'C of O approved for issuance'
        }
      })
    ])

    // ========================================================================
    // STEP 16: Create Public Status Records
    // ========================================================================

    await Promise.all([
      prisma.civic_public_status.create({
        data: {
          tenantId,
          trackingCode: request1.trackingCode!,
          requestId: request1.id,
          serviceName: services[0].name,
          submittedDate: new Date('2024-06-15'),
          currentStatus: 'APPROVED',
          progressStage: 7,
          progressNote: 'Certificate of Occupancy approved. Please visit our office to collect your document.',
          lastUpdateDate: new Date('2024-10-15'),
          estimatedCompletionDate: null
        }
      }),
      prisma.civic_public_status.create({
        data: {
          tenantId,
          trackingCode: request2.trackingCode!,
          requestId: request2.id,
          serviceName: services[2].name,
          submittedDate: new Date('2024-11-01'),
          currentStatus: 'PENDING_INSPECTION',
          progressStage: 4,
          progressNote: 'Site inspection scheduled for 15th January 2025 at 09:00 AM.',
          lastUpdateDate: new Date('2024-12-15'),
          estimatedCompletionDate: new Date('2025-01-30')
        }
      }),
      prisma.civic_public_status.create({
        data: {
          tenantId,
          trackingCode: request3.trackingCode!,
          requestId: request3.id,
          serviceName: services[0].name,
          submittedDate: new Date('2024-12-01'),
          currentStatus: 'UNDER_REVIEW',
          progressStage: 2,
          progressNote: 'Your application is currently under review. Document verification in progress.',
          lastUpdateDate: new Date('2024-12-10'),
          estimatedCompletionDate: new Date('2025-03-01')
        }
      }),
      prisma.civic_public_status.create({
        data: {
          tenantId,
          trackingCode: request4.trackingCode!,
          requestId: request4.id,
          serviceName: services[0].name,
          submittedDate: new Date('2024-12-10'),
          currentStatus: 'PENDING_PAYMENT',
          progressStage: 3,
          progressNote: 'Payment required to proceed. Total amount: ₦335,000.',
          lastUpdateDate: new Date('2024-12-11')
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Civic demo data seeded successfully',
      action: 'created',
      data: {
        agencyId: agency.id,
        agencyName: DEMO_AGENCY_NAME,
        counts: {
          agencies: 1,
          departments: 3,
          units: 2,
          staff: 7,
          services: 4,
          citizens: 5,
          organizations: 2,
          requests: 5,
          cases: 3,
          inspections: 2,
          approvals: 1,
          billingFacts: 12,
          auditLogs: 5,
          publicStatuses: 4
        }
      }
    })
  } catch (error) {
    console.error('Civic Demo POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
