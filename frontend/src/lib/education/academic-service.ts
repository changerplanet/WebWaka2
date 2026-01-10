/**
 * EDUCATION SUITE: Academic Service
 * 
 * Manages academic sessions, terms, classes, and subjects.
 * SIMPLIFIED IMPLEMENTATION: Returns mock/demo data for UI demonstration.
 * Production implementation would require schema updates.
 */

import {
  ClassConfig,
  SubjectConfig,
  SessionConfig,
  TermConfig,
} from './config';

// ============================================================================
// IN-MEMORY STORAGE (Demo purposes - Replace with DB in production)
// ============================================================================

const tenantConfigs: Map<string, {
  sessions: SessionConfig[];
  classes: ClassConfig[];
  subjects: SubjectConfig[];
}> = new Map();

function getOrCreateConfig(tenantId: string) {
  if (!tenantConfigs.has(tenantId)) {
    tenantConfigs.set(tenantId, {
      sessions: [],
      classes: [],
      subjects: [],
    });
  }
  return tenantConfigs.get(tenantId)!;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function getAcademicSessions(tenantId: string): Promise<SessionConfig[]> {
  const config = getOrCreateConfig(tenantId);
  return config.sessions;
}

export async function getActiveSession(tenantId: string): Promise<SessionConfig | null> {
  const sessions = await getAcademicSessions(tenantId);
  return sessions.find((s: any) => s.isActive) || null;
}

export async function createAcademicSession(
  tenantId: string,
  session: Omit<SessionConfig, 'id'>
): Promise<SessionConfig> {
  const config = getOrCreateConfig(tenantId);
  
  const newSession: SessionConfig = {
    ...session,
    id: `session_${Date.now().toString(36)}`,
  };
  
  if (newSession.isActive) {
    config.sessions.forEach((s: any) => s.isActive = false);
  }
  
  config.sessions.push(newSession);
  return newSession;
}

export async function updateAcademicSession(
  tenantId: string,
  sessionId: string,
  updates: Partial<SessionConfig>
): Promise<SessionConfig | null> {
  const config = getOrCreateConfig(tenantId);
  const index = config.sessions.findIndex(s => s.id === sessionId);
  if (index === -1) return null;
  
  if (updates.isActive) {
    config.sessions.forEach((s: any) => s.isActive = false);
  }
  
  config.sessions[index] = { ...config.sessions[index], ...updates };
  return config.sessions[index];
}

export async function getActiveTerm(tenantId: string): Promise<TermConfig | null> {
  const session = await getActiveSession(tenantId);
  if (!session) return null;
  return session.terms.find((t: any) => t.isActive) || null;
}

// ============================================================================
// CLASS MANAGEMENT
// ============================================================================

export async function getClasses(tenantId: string): Promise<ClassConfig[]> {
  const config = getOrCreateConfig(tenantId);
  return config.classes;
}

export async function getClass(tenantId: string, classId: string): Promise<ClassConfig | null> {
  const classes = await getClasses(tenantId);
  return classes.find((c: any) => c.id === classId) || null;
}

export async function createClass(
  tenantId: string,
  classData: Omit<ClassConfig, 'id'>
): Promise<ClassConfig> {
  const config = getOrCreateConfig(tenantId);
  
  const newClass: ClassConfig = {
    ...classData,
    id: `class_${Date.now().toString(36)}`,
  };
  
  config.classes.push(newClass);
  return newClass;
}

export async function updateClass(
  tenantId: string,
  classId: string,
  updates: Partial<ClassConfig>
): Promise<ClassConfig | null> {
  const config = getOrCreateConfig(tenantId);
  const index = config.classes.findIndex(c => c.id === classId);
  if (index === -1) return null;
  
  config.classes[index] = { ...config.classes[index], ...updates };
  return config.classes[index];
}

export async function deleteClass(tenantId: string, classId: string): Promise<boolean> {
  const config = getOrCreateConfig(tenantId);
  const initialLength = config.classes.length;
  config.classes = config.classes.filter((c: any) => c.id !== classId);
  return config.classes.length < initialLength;
}

// ============================================================================
// SUBJECT MANAGEMENT
// ============================================================================

export async function getSubjects(tenantId: string): Promise<SubjectConfig[]> {
  const config = getOrCreateConfig(tenantId);
  return config.subjects;
}

export async function createSubject(
  tenantId: string,
  subject: SubjectConfig
): Promise<SubjectConfig> {
  const config = getOrCreateConfig(tenantId);
  config.subjects.push(subject);
  return subject;
}

export async function getClassSubjects(
  tenantId: string,
  classId: string
): Promise<SubjectConfig[]> {
  const classConfig = await getClass(tenantId, classId);
  return classConfig?.subjects || [];
}

// ============================================================================
// STUDENT CLASS ASSIGNMENT (Demo - returns empty)
// ============================================================================

export async function getClassStudents(
  tenantId: string,
  classId: string
): Promise<any[]> {
  // Demo implementation - returns empty array
  // Production would query Customer table with education metadata
  return [];
}

export async function assignStudentToClass(
  tenantId: string,
  studentId: string,
  classId: string,
  section?: string,
  rollNumber?: string
): Promise<boolean> {
  // Demo implementation
  console.log(`[Education Demo] Assigning student ${studentId} to class ${classId}`);
  return true;
}

// ============================================================================
// SEED DEFAULT DATA
// ============================================================================

export async function seedDefaultSchoolStructure(tenantId: string): Promise<void> {
  const defaultSubjects: SubjectConfig[] = [
    { code: 'ENG', name: 'English Language', shortName: 'English', isCompulsory: true, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
    { code: 'MATH', name: 'Mathematics', shortName: 'Maths', isCompulsory: true, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
    { code: 'SCI', name: 'Basic Science', shortName: 'Science', isCompulsory: true, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
    { code: 'SST', name: 'Social Studies', shortName: 'Soc. Studies', isCompulsory: true, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
    { code: 'PHY', name: 'Physics', shortName: 'Physics', isCompulsory: false, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
    { code: 'CHEM', name: 'Chemistry', shortName: 'Chemistry', isCompulsory: false, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
    { code: 'BIO', name: 'Biology', shortName: 'Biology', isCompulsory: false, assessmentWeights: { EXAM: 60, CONTINUOUS: 40 } },
  ];
  
  const defaultClasses: Omit<ClassConfig, 'id'>[] = [
    { name: 'JSS 1', shortName: 'JSS1', gradeLevel: 7, sections: ['A', 'B'], subjects: defaultSubjects.slice(0, 4), capacity: 40 },
    { name: 'JSS 2', shortName: 'JSS2', gradeLevel: 8, sections: ['A', 'B'], subjects: defaultSubjects.slice(0, 4), capacity: 40 },
    { name: 'JSS 3', shortName: 'JSS3', gradeLevel: 9, sections: ['A', 'B'], subjects: defaultSubjects.slice(0, 4), capacity: 40 },
    { name: 'SS 1', shortName: 'SS1', gradeLevel: 10, sections: ['Science', 'Arts'], subjects: defaultSubjects, capacity: 35 },
    { name: 'SS 2', shortName: 'SS2', gradeLevel: 11, sections: ['Science', 'Arts'], subjects: defaultSubjects, capacity: 35 },
    { name: 'SS 3', shortName: 'SS3', gradeLevel: 12, sections: ['Science', 'Arts'], subjects: defaultSubjects, capacity: 35 },
  ];
  
  const currentYear = new Date().getFullYear();
  const defaultSession: Omit<SessionConfig, 'id'> = {
    name: `${currentYear}/${currentYear + 1}`,
    startDate: `${currentYear}-09-01`,
    endDate: `${currentYear + 1}-07-31`,
    isActive: true,
    terms: [
      { id: `term_${currentYear}_1`, type: 'FIRST', name: 'First Term', startDate: `${currentYear}-09-01`, endDate: `${currentYear}-12-15`, isActive: true },
      { id: `term_${currentYear}_2`, type: 'SECOND', name: 'Second Term', startDate: `${currentYear + 1}-01-08`, endDate: `${currentYear + 1}-04-15`, isActive: false },
      { id: `term_${currentYear}_3`, type: 'THIRD', name: 'Third Term', startDate: `${currentYear + 1}-04-29`, endDate: `${currentYear + 1}-07-31`, isActive: false },
    ],
  };
  
  for (const subject of defaultSubjects) {
    await createSubject(tenantId, subject);
  }
  
  for (const classData of defaultClasses) {
    await createClass(tenantId, classData);
  }
  
  await createAcademicSession(tenantId, defaultSession);
  
  console.log('[Education] Seeded default school structure for tenant:', tenantId);
}
