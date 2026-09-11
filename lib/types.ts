export type Role = 'superadmin' | 'director' | 'teacher' | 'parent';

export type Language = 'uz' | 'ru';

export type Plan = 'starter' | 'pro' | 'enterprise';

export interface School {
  id: string;
  name: string;
  city: string;
  studentCount: number;
  plan: Plan;
  directorUsername: string;
  directorPassword: string;
  createdAt: number;
}

export interface Teacher {
  id: string;
  schoolId: string;
  fullName: string;
  subject: string;
  username: string;
  password: string;
  phone?: string;
  createdAt: number;
}

export interface Student {
  id: string;
  schoolId: string;
  classId: string;
  fullName: string;
  username: string;
  password: string;
  parentId: string;
  createdAt: number;
}

export interface Parent {
  id: string;
  schoolId: string;
  fullName: string;
  username: string;
  password: string;
  phone?: string;
  createdAt: number;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;
  grade: number;
  createdAt: number;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  createdAt: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimetableSlot {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  createdAt: number;
}

export interface Grade {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  value: number;
  type: 'quiz' | 'homework' | 'exam' | 'participation';
  date: string;
  comment?: string;
  createdAt: number;
}

export interface Homework {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  type: 'absence' | 'grade' | 'homework';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface User {
  id: string;
  role: Role;
  username: string;
  schoolId?: string;
  name: string;
}
