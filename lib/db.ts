import type {
  School, Teacher, Student, Parent, SchoolClass, Subject,
  TimetableSlot, AttendanceRecord, Grade, Homework, Notification, User,
} from './types';

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

// Auth logic
export function authenticate(username: string, password: string): User | null {
  // Superadmin check
  if (username === 'nematov' && password === '5717') {
    return { id: 'superadmin', role: 'superadmin', username: 'nematov', name: 'Superadmin' };
  }

  // Director check
  const school = db.schools.getAll().find(
    (s) => s.directorUsername === username && s.directorPassword === password
  );
  if (school) {
    return {
      id: school.id,
      role: 'director',
      username,
      schoolId: school.id,
      name: school.name,
    };
  }

  // Teacher check
  const teacher = db.teachers.getAll().find(
    (t) => t.username === username && t.password === password
  );
  if (teacher) {
    return {
      id: teacher.id,
      role: 'teacher',
      username,
      schoolId: teacher.schoolId,
      name: teacher.fullName,
    };
  }

  // Parent check
  const parent = db.parents.getAll().find(
    (p) => p.username === username && p.password === password
  );
  if (parent) {
    return {
      id: parent.id,
      role: 'parent',
      username,
      schoolId: parent.schoolId,
      name: parent.fullName,
    };
  }

  // Student check
  const student = db.students.getAll().find(
    (s) => s.username === username && s.password === password
  );
  if (student) {
    return {
      id: student.id,
      role: 'parent',
      username,
      schoolId: student.schoolId,
      name: student.fullName,
    };
  }

  return null;
}
