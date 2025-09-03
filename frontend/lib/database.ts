import Dexie, { Table } from 'dexie';

export interface AdmissionApplication {
  id?: string;
  clientId?: string; // For offline tracking
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  contactInfo: {
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
    alternativePhone?: string;
    alternativeEmail?: string;
  };
  academicInfo: {
    previousSchool: string;
    gradeLevel: string;
    gpa?: number;
    achievements: string[];
    subjects: string[];
    transcripts?: string[]; // Document IDs
  };
  intakeId: string;
  programId: string;
  documents: string[]; // Array of document IDs
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';
  decisions: AdmissionDecision[];
  timeline: TimelineEvent[];
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
  syncId?: string;
}

export interface AdmissionDecision {
  id: string;
  decision: 'accepted' | 'rejected' | 'waitlisted';
  reason: string;
  decisionBy: string;
  decisionDate: Date;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  userId: string;
  metadata?: any;
}

export interface Intake {
  id?: string;
  name: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  applicationDeadline: Date;
  maxCapacity: number;
  currentEnrollment: number;
  status: 'open' | 'closed' | 'full';
  programs: string[]; // Program IDs
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface Program {
  id?: string;
  name: string;
  code: string;
  description: string;
  duration: string; // e.g., "4 years", "2 semesters"
  level: 'certificate' | 'diploma' | 'bachelor' | 'master' | 'phd';
  requirements: string[];
  feeStructure: {
    tuition: number;
    registration: number;
    otherFees: number[];
  };
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface StudentProfile {
  id?: string;
  admissionId: string;
  studentNumber: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  academicInfo: {
    programId: string;
    intakeId: string;
    enrollmentDate: Date;
    currentYear: number;
    currentSemester: number;
    gpa: number;
    creditsEarned: number;
    totalCredits: number;
  };
  feeInfo: {
    totalFees: number;
    paidAmount: number;
    outstandingAmount: number;
    paymentHistory: PaymentRecord[];
  };
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
}

export interface AdmissionDocument {
  id?: string;
  applicationId: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png';
  size: number;
  data: Blob;
  uploadedAt: Date;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: string;
  type: 'application' | 'document' | 'intake' | 'program' | 'student';
  action: 'create' | 'update' | 'delete';
  data: AdmissionApplication | AdmissionDocument | Intake | Program | StudentProfile;
  retryCount: number;
  lastAttempt: Date;
  createdAt: Date;
}

export interface InterviewSchedule {
  id?: string;
  title: string;
  type: 'written' | 'oral';
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  maxCandidates: number;
  panelMembers: string[];
  rubricId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface InterviewCandidate {
  id?: string;
  scheduleId: string;
  applicationId: string;
  token?: string; // For written interviews
  attendance: 'scheduled' | 'present' | 'absent' | 'late';
  checkInTime?: Date;
  scores: InterviewScore[];
  totalScore?: number;
  weightedScore?: number;
  notes?: string;
  status: 'pending' | 'completed' | 'passed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface InterviewRubric {
  id?: string;
  name: string;
  description: string;
  criteria: RubricCriteria[];
  totalWeight: number;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  category: string;
}

export interface InterviewScore {
  id: string;
  criteriaId: string;
  score: number;
  maxScore: number;
  weight: number;
  notes?: string;
  evaluatorId: string;
  timestamp: Date;
}

export interface InterviewPanelMember {
  id?: string;
  name: string;
  email: string;
  role: string;
  specialization: string;
  availability: Date[];
  createdAt: Date;
  synced: boolean;
}

export class AdmissionsDatabase extends Dexie {
  applications!: Table<AdmissionApplication>;
  documents!: Table<AdmissionDocument>;
  syncQueue!: Table<SyncQueueItem>;
  intakes!: Table<Intake>;
  programs!: Table<Program>;
  studentProfiles!: Table<StudentProfile>;
  
  // Interview Management Tables
  interviewSchedules!: Table<InterviewSchedule>;
  interviewCandidates!: Table<InterviewCandidate>;
  interviewRubrics!: Table<InterviewRubric>;
  interviewPanelMembers!: Table<InterviewPanelMember>;

  constructor() {
    super('AdmissionsDatabase');
    this.version(3).stores({
      applications: '++id, clientId, status, intakeId, programId, syncStatus, synced, createdAt',
      documents: '++id, applicationId, synced, uploadedAt',
      syncQueue: '++id, type, action, createdAt',
      intakes: '++id, academicYear, status, synced',
      programs: '++id, code, level, synced',
      studentProfiles: '++id, admissionId, studentNumber, status, synced',
      
      // Interview Management
      interviewSchedules: '++id, type, date, status, synced',
      interviewCandidates: '++id, scheduleId, applicationId, token, status, synced',
      interviewRubrics: '++id, name, synced',
      interviewPanelMembers: '++id, email, synced'
    });
  }
}

export const db = new AdmissionsDatabase();

// Helper functions
export const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const generateClientId = () => `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateStudentNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${random}`;
};

export const isOnline = () => navigator.onLine;

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => {
  await db.syncQueue.add({
    ...item,
    createdAt: new Date()
  });
};
