/**
 * EDUCATION SUITE: Report Card Service
 * 
 * Generates report cards and academic transcripts.
 * SIMPLIFIED IMPLEMENTATION: Demo data for UI demonstration.
 */

import {
  AcademicRecord,
  StudentMetadata,
  getGradeFromScore,
  calculateAttendancePercentage,
} from './config';
import { getActiveSession, getActiveTerm } from './academic-service';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportCardData {
  schoolName: string;
  schoolAddress?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classInfo: string;
  section?: string;
  sessionName: string;
  termName: string;
  subjects: {
    name: string;
    code: string;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    gradePoint: number;
    remarks: string;
  }[];
  totalScore: number;
  averageScore: number;
  gpa: number;
  position: number;
  totalStudents: number;
  grade: string;
  attendance?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    percentage: number;
  };
  classTeacherRemarks?: string;
  principalRemarks?: string;
  generatedAt: string;
}

export interface TranscriptData {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  entryYear: string;
  sessions: {
    sessionName: string;
    terms: { termName: string; className: string; gpa: number }[];
    sessionGPA: number;
  }[];
  cumulativeGPA: number;
  graduationStatus?: 'IN_PROGRESS' | 'GRADUATED' | 'WITHDRAWN';
  generatedAt: string;
}

// ============================================================================
// REPORT CARD GENERATION
// ============================================================================

export async function generateReportCard(
  tenantId: string,
  studentId: string,
  sessionId?: string,
  termId?: string
): Promise<{ success: boolean; data?: ReportCardData; error?: string }> {
  // Demo implementation
  return { success: false, error: 'No grades recorded for this term' };
}

export async function generateClassReportCards(
  tenantId: string,
  classId: string,
  sessionId?: string,
  termId?: string
): Promise<{ success: boolean; generated: number; errors: string[] }> {
  return { success: true, generated: 0, errors: [] };
}

// ============================================================================
// TRANSCRIPT GENERATION
// ============================================================================

export async function generateTranscript(
  tenantId: string,
  studentId: string
): Promise<{ success: boolean; data?: TranscriptData; error?: string }> {
  return { success: false, error: 'No academic records found' };
}

// ============================================================================
// REMARKS MANAGEMENT
// ============================================================================

export async function addTeacherRemarks(
  tenantId: string,
  studentId: string,
  sessionId: string,
  termId: string,
  remarks: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Education Demo] Adding teacher remarks for student ${studentId}`);
  return { success: true };
}

export async function addPrincipalRemarks(
  tenantId: string,
  studentId: string,
  sessionId: string,
  termId: string,
  remarks: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Education Demo] Adding principal remarks for student ${studentId}`);
  return { success: true };
}

// ============================================================================
// REPORT CARD TEMPLATES
// ============================================================================

export const REPORT_CARD_REMARKS = {
  excellent: ['Outstanding performance! Keep up the excellent work.'],
  good: ['Good performance. Continue working hard.'],
  average: ['Satisfactory performance. More effort needed.'],
  belowAverage: ['Needs significant improvement in studies.'],
  failing: ['Urgent improvement needed. Parents should monitor closely.'],
};

export function getRemarkSuggestion(averageScore: number): string[] {
  if (averageScore >= 75) return REPORT_CARD_REMARKS.excellent;
  if (averageScore >= 60) return REPORT_CARD_REMARKS.good;
  if (averageScore >= 50) return REPORT_CARD_REMARKS.average;
  if (averageScore >= 40) return REPORT_CARD_REMARKS.belowAverage;
  return REPORT_CARD_REMARKS.failing;
}
