/**
 * EDUCATION PORTAL SERVICE
 * 
 * Server-side service for Education Portal data access.
 * Provides read-only access to student/parent data.
 * 
 * Part of Phase E2.2 - Education & Health Portals
 * Created: January 14, 2026
 */

import { prisma } from '@/lib/prisma';

export interface StudentProfile {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  photoUrl: string | null;
  status: string;
  admissionDate: Date | null;
  currentClass?: {
    id: string;
    name: string;
    section: string | null;
  } | null;
  guardians: Array<{
    id: string;
    fullName: string;
    relation: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

export interface StudentClass {
  id: string;
  name: string;
  section: string | null;
  classTeacher: string | null;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    teacher: string | null;
  }>;
}

export interface AttendanceRecord {
  id: string;
  date: Date;
  status: string;
  notes: string | null;
  markedBy: string | null;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export interface ResultRecord {
  id: string;
  term: string;
  session: string;
  subject: string;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  remark: string | null;
}

export interface FeeSummary {
  totalFees: number;
  totalPaid: number;
  balance: number;
  currency: string;
  feeBreakdown: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: Date | null;
    paidAmount: number;
    status: string;
  }>;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string | null;
  publishedAt: Date;
  expiresAt: Date | null;
}

export class EducationPortalService {
  async getStudentProfile(tenantId: string, studentId: string): Promise<StudentProfile | null> {
    const student = await prisma.edu_student.findFirst({
      where: { tenantId, id: studentId },
    });

    if (!student) return null;

    const studentGuardians = await prisma.edu_student_guardian.findMany({
      where: { tenantId, studentId },
      include: {
        guardian: true,
      },
    });

    const currentEnrollment = await prisma.edu_enrollment.findFirst({
      where: { tenantId, studentId, status: 'ENROLLED' },
      orderBy: { createdAt: 'desc' },
    });

    let currentClass = null;
    if (currentEnrollment) {
      const classData = await prisma.edu_class.findUnique({
        where: { id: currentEnrollment.classId },
      });
      if (classData) {
        currentClass = {
          id: classData.id,
          name: classData.name,
          section: classData.arm,
        };
      }
    }

    return {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      photoUrl: student.photoUrl,
      status: student.status,
      admissionDate: student.admissionDate,
      currentClass,
      guardians: studentGuardians.map(sg => ({
        id: sg.guardian.id,
        fullName: sg.guardian.fullName || `${sg.guardian.firstName} ${sg.guardian.lastName}`,
        relation: sg.relation,
        phone: sg.guardian.phone,
        isPrimary: sg.isPrimary,
      })),
    };
  }

  async getStudentClasses(tenantId: string, studentId: string): Promise<StudentClass[]> {
    const enrollments = await prisma.edu_enrollment.findMany({
      where: { tenantId, studentId, status: 'ENROLLED' },
    });

    const classes: StudentClass[] = [];
    
    for (const enrollment of enrollments) {
      const classData = await prisma.edu_class.findUnique({
        where: { id: enrollment.classId },
      });
      
      if (!classData) continue;
      
      let classTeacherName: string | null = null;
      if (classData.classTeacherId) {
        const teacher = await prisma.edu_staff.findUnique({
          where: { id: classData.classTeacherId },
        });
        if (teacher) {
          classTeacherName = `${teacher.firstName} ${teacher.lastName}`;
        }
      }

      const classSubjects = await prisma.edu_class_subject.findMany({
        where: { classId: classData.id, isActive: true },
        include: {
          subject: true,
          teacher: true,
        },
      });

      classes.push({
        id: classData.id,
        name: classData.name,
        section: classData.arm,
        classTeacher: classTeacherName,
        subjects: classSubjects.map(cs => ({
          id: cs.subject.id,
          name: cs.subject.name,
          code: cs.subject.code,
          teacher: cs.teacher ? `${cs.teacher.firstName} ${cs.teacher.lastName}` : null,
        })),
      });
    }

    return classes;
  }

  async getAttendance(
    tenantId: string, 
    studentId: string, 
    termId?: string
  ): Promise<{ records: AttendanceRecord[]; summary: AttendanceSummary }> {
    const whereClause: any = { tenantId, studentId };
    if (termId) whereClause.termId = termId;

    const attendanceRecords = await prisma.edu_attendance.findMany({
      where: whereClause,
      include: {
        markedBy: true,
      },
      orderBy: { attendanceDate: 'desc' },
      take: 100,
    });

    const records = attendanceRecords.map(ar => ({
      id: ar.id,
      date: ar.attendanceDate,
      status: ar.status,
      notes: ar.notes,
      markedBy: ar.markedBy 
        ? `${ar.markedBy.firstName} ${ar.markedBy.lastName}` 
        : null,
    }));

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const attendancePercentage = totalDays > 0 
      ? Math.round((presentDays / totalDays) * 100) 
      : 0;

    return {
      records,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage,
      },
    };
  }

  async getResults(
    tenantId: string, 
    studentId: string, 
    sessionId?: string
  ): Promise<ResultRecord[]> {
    const whereClause: any = { tenantId, studentId };
    if (sessionId) whereClause.sessionId = sessionId;

    const results = await prisma.edu_result.findMany({
      where: whereClause,
      include: {
        term: true,
        session: true,
        subject: true,
      },
      orderBy: [
        { session: { startDate: 'desc' } },
        { term: { startDate: 'desc' } },
      ],
    });

    return results.map(r => ({
      id: r.id,
      term: r.term.name,
      session: r.session.name,
      subject: r.subject.name,
      caScore: r.caScore ? Number(r.caScore) : null,
      examScore: r.examScore ? Number(r.examScore) : null,
      totalScore: r.totalScore ? Number(r.totalScore) : null,
      grade: r.grade,
      remark: r.remark,
    }));
  }

  async getFeeSummary(tenantId: string, studentId: string): Promise<FeeSummary> {
    const feeAssignments = await prisma.edu_fee_assignment.findMany({
      where: { tenantId, studentId },
      include: {
        feeStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalFees = 0;
    let totalPaid = 0;

    const feeBreakdown = feeAssignments.map(fa => {
      const amount = Number(fa.finalAmount);
      const paidAmount = Number(fa.amountPaid);
      totalFees += amount;
      totalPaid += paidAmount;

      return {
        id: fa.id,
        description: fa.feeStructure.name,
        amount,
        dueDate: fa.dueDate,
        paidAmount,
        status: fa.status,
      };
    });

    return {
      totalFees,
      totalPaid,
      balance: totalFees - totalPaid,
      currency: 'NGN',
      feeBreakdown,
    };
  }

  async getNotices(tenantId: string): Promise<Notice[]> {
    // TODO: Implement proper notice retrieval from database when edu_notice model exists
    // For now, return welcome message as placeholder
    return [
      {
        id: 'welcome-notice',
        title: 'Welcome to the Student Portal',
        content: 'Access your academic information, attendance records, and fee statements here.',
        category: 'General',
        publishedAt: new Date(),
        expiresAt: null,
      },
    ];
  }

  async getStudentsByGuardian(tenantId: string, guardianId: string): Promise<StudentProfile[]> {
    const studentGuardians = await prisma.edu_student_guardian.findMany({
      where: { tenantId, guardianId },
      include: {
        student: true,
      },
    });

    const profiles: StudentProfile[] = [];

    for (const sg of studentGuardians) {
      const student = sg.student;
      
      const currentEnrollment = await prisma.edu_enrollment.findFirst({
        where: { tenantId, studentId: student.id, status: 'ENROLLED' },
        orderBy: { createdAt: 'desc' },
      });

      let currentClass = null;
      if (currentEnrollment) {
        const classData = await prisma.edu_class.findUnique({
          where: { id: currentEnrollment.classId },
        });
        if (classData) {
          currentClass = {
            id: classData.id,
            name: classData.name,
            section: classData.arm,
          };
        }
      }

      profiles.push({
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: student.fullName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        photoUrl: student.photoUrl,
        status: student.status,
        admissionDate: student.admissionDate,
        currentClass,
        guardians: [],
      });
    }

    return profiles;
  }
}

export const educationPortalService = new EducationPortalService();
