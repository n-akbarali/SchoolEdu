import type { Plan } from './types';

export interface PlanInfo {
  id: Plan;
  name: string;
  minStudents: number;
  maxStudents: number;
  monthlyPrice: number;
  features: string[];
  color: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    minStudents: 1,
    maxStudents: 300,
    monthlyPrice: 600000,
    features: [
      'Up to 300 students',
      'Teacher accounts',
      'Attendance tracking',
      'Digital gradebook',
      'Timetable management',
      'Parent portal',
    ],
    color: 'hsl(199, 89%, 48%)',
  },
  {
    id: 'pro',
    name: 'Pro',
    minStudents: 301,
    maxStudents: 800,
    monthlyPrice: 1200000,
    features: [
      'Up to 800 students',
      'Everything in Starter',
      'At-Risk analytics',
      'Lesson-End trigger',
      'Push notifications',
      'Quarterly report export',
    ],
    color: 'hsl(142, 71%, 45%)',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    minStudents: 801,
    maxStudents: 1500,
    monthlyPrice: 2000000,
    features: [
      'Up to 1500+ students',
      'Everything in Pro',
      'Revenue analytics',
      'Teacher activity tracking',
      'Credential generator',
      'Priority support',
    ],
    color: 'hsl(38, 92%, 50%)',
  },
];

export function getPlanForStudents(count: number): PlanInfo {
  return PLANS.find((p) => count >= p.minStudents && count <= p.maxStudents) || PLANS[PLANS.length - 1];
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}

export function calculateMonthlyCost(studentCount: number): number {
  if (studentCount <= 300) return 600000;
  if (studentCount <= 800) return 1200000;
  return 2000000;
}

export function calculateYearlyCost(studentCount: number): number {
  return calculateMonthlyCost(studentCount) * 12;
}
