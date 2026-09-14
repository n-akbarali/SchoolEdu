import type {
  School, Teacher, Student, Parent, SchoolClass, Subject,
  TimetableSlot, AttendanceRecord, Grade, Homework, Notification, User,
} from './types';
import { supabase } from './supabase';

const PREFIX = 'a7school_';

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Generic CRUD factory
function makeStore<T extends { id: string; createdAt: number }>(key: string) {
  return {
    getAll: (): T[] => read<T>(key),
    getById: (id: string): T | undefined => read<T>(key).find((x) => x.id === id),
    getBySchool: (schoolId: string): T[] => read<T>(key).filter((x) => (x as any).schoolId === schoolId),
    add: (item: Omit<T, 'id' | 'createdAt'>): T => {
      const full = { ...item, id: uid(), createdAt: Date.now() } as T;
      const all = read<T>(key);
      all.push(full);
      write(key, all);
      return full;
    },
    update: (id: string, patch: Partial<T>): T | undefined => {
      const all = read<T>(key);
      const idx = all.findIndex((x) => x.id === id);
      if (idx === -1) return undefined;
      all[idx] = { ...all[idx], ...patch };
      write(key, all);
      return all[idx];
    },
    remove: (id: string): void => {
      const all = read<T>(key).filter((x) => x.id !== id);
      write(key, all);
    },
  };
}

// Central user registry — syncs credentials to Supabase so accounts work cross-device
export async function registerUser(entry: {
  username: string;
  password: string;
  role: 'director' | 'teacher' | 'student' | 'parent';
  schoolId?: string;
  displayName: string;
  localId?: string;
}): Promise<void> {
  const usernameLower = entry.username.trim().toLowerCase();
  try {
    await supabase.from('app_users').delete().ilike('username', usernameLower);
    const { error } = await supabase.from('app_users').insert({
      username: usernameLower,
      password: entry.password.trim(),
      role: entry.role,
      school_id: entry.schoolId || null,
      display_name: entry.displayName,
      local_id: entry.localId || null,
    });
    if (error) console.error('registerUser error:', error.message);
  } catch (err) {
    console.error('registerUser exception:', err);
  }
}

export async function unregisterUser(localId: string): Promise<void> {
  try {
    await supabase.from('app_users').delete().eq('local_id', localId);
  } catch (err) {
    console.error('unregisterUser exception:', err);
  }
}

export const db = {
  schools: makeStore<School>('schools'),
  teachers: makeStore<Teacher>('teachers'),
  students: makeStore<Student>('students'),
  parents: makeStore<Parent>('parents'),
  classes: makeStore<SchoolClass>('classes'),
  subjects: makeStore<Subject>('subjects'),
  timetable: makeStore<TimetableSlot>('timetable'),
  attendance: makeStore<AttendanceRecord>('attendance'),
  grades: makeStore<Grade>('grades'),
  homework: makeStore<Homework>('homework'),
  notifications: makeStore<Notification>('notifications'),
};

// Session management
const SESSION_KEY = PREFIX + 'session';

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user: User): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('a7-session-change'));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('a7-session-change'));
}

export function onSessionChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('a7-session-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('a7-session-change', callback);
    window.removeEventListener('storage', callback);
  };
}

// Auth logic — checks Supabase registry first (cross-device), then localStorage fallback
export async function authenticate(username: string, password: string): Promise<User | null> {
  const u = username.trim().toLowerCase();
  const p = password.trim();

  // Superadmin check (hardcoded, always works)
  if (u === 'nematov' && p === '5717') {
    return { id: 'superadmin', role: 'superadmin', username: 'nematov', name: 'Superadmin' };
  }

  // 1. Check central Supabase registry (works across all browsers/devices)
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, username, password, role, school_id, display_name, local_id')
      .ilike('username', u)
      .maybeSingle();

    if (!error && data && data.password === p) {
      return {
        id: data.local_id || data.id,
        role: data.role as User['role'],
        username: data.username,
        schoolId: data.school_id || undefined,
        name: data.display_name,
      };
    }
  } catch (err) {
    console.error('Supabase auth lookup failed, falling back to localStorage:', err);
  }

  // 2. Fallback: check localStorage (same-browser only)
  // Director check
  const school = db.schools.getAll().find(
    (s) => s.directorUsername.trim().toLowerCase() === u && s.directorPassword.trim() === p
  );
  if (school) {
    return {
      id: school.id,
      role: 'director',
      username: school.directorUsername,
      schoolId: school.id,
      name: school.name,
    };
  }

  // Teacher check
  const teacher = db.teachers.getAll().find(
    (t) => t.username.trim().toLowerCase() === u && t.password.trim() === p
  );
  if (teacher) {
    return {
      id: teacher.id,
      role: 'teacher',
      username: teacher.username,
      schoolId: teacher.schoolId,
      name: teacher.fullName,
    };
  }

  // Parent check
  const parent = db.parents.getAll().find(
    (item) => item.username.trim().toLowerCase() === u && item.password.trim() === p
  );
  if (parent) {
    return {
      id: parent.id,
      role: 'parent',
      username: parent.username,
      schoolId: parent.schoolId,
      name: parent.fullName,
    };
  }

  // Student check
  const student = db.students.getAll().find(
    (item) => item.username.trim().toLowerCase() === u && item.password.trim() === p
  );
  if (student) {
    return {
      id: student.id,
      role: 'parent',
      username: student.username,
      schoolId: student.schoolId,
      name: student.fullName,
    };
  }

  return null;
}
