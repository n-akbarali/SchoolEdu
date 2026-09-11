'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Calendar, Bell, GraduationCap, Clock, Check, X,
  AlertCircle, TrendingUp, Award,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useAuth, useLang } from '@/components/providers';
import { db } from '@/lib/db';
import { t } from '@/lib/i18n';
import type { Grade, AttendanceRecord, Homework, Notification, TimetableSlot, DayOfWeek, Student, Subject } from '@/lib/types';

const DAYS: { key: DayOfWeek; labelUz: string; labelRu: string; fullUz: string; fullRu: string }[] = [
  { key: 'monday', labelUz: 'Dush', labelRu: 'Пн', fullUz: 'Dushanba', fullRu: 'Понедельник' },
  { key: 'tuesday', labelUz: 'Sesh', labelRu: 'Вт', fullUz: 'Seshanba', fullRu: 'Вторник' },
  { key: 'wednesday', labelUz: 'Chor', labelRu: 'Ср', fullUz: 'Chorshanba', fullRu: 'Среда' },
  { key: 'thursday', labelUz: 'Pay', labelRu: 'Чт', fullUz: 'Payshanba', fullRu: 'Четверг' },
  { key: 'friday', labelUz: 'Jum', labelRu: 'Пт', fullUz: 'Juma', fullRu: 'Пятница' },
  { key: 'saturday', labelUz: 'Shan', labelRu: 'Сб', fullUz: 'Shanba', fullRu: 'Суббота' },
];

export default function ParentDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const schoolId = user?.schoolId;
  const userId = user?.id;
  if (!schoolId || !userId) return null;

  // Determine if this user is a parent (with child) or a student
  const parent = db.parents.getById(userId);
  const student = db.students.getById(userId);

  // Get associated students
  let myStudents: Student[] = [];
  if (parent) {
    myStudents = db.students.getBySchool(schoolId).filter((s) => s.parentId === userId);
  } else if (student) {
    myStudents = [student];
  }

  const subjects = db.subjects.getBySchool(schoolId);
  const classes = db.classes.getBySchool(schoolId);
  const allGrades = db.grades.getBySchool(schoolId);
  const allAttendance = db.attendance.getBySchool(schoolId);
  const allHomework = db.homework.getBySchool(schoolId);
  const allNotifications = db.notifications.getBySchool(schoolId);
  const allTimetable = db.timetable.getBySchool(schoolId);

  const studentIds = myStudents.map((s) => s.id);
  const grades = allGrades.filter((g) => studentIds.includes(g.studentId));
  const attendance = allAttendance.filter((a) => studentIds.includes(a.studentId));
  const notifications = parent
    ? allNotifications.filter((n) => n.parentId === userId)
    : allNotifications.filter((n) => studentIds.includes(n.studentId));

  const navItems = [
    { label: lang === 'uz' ? 'Boshqaruv' : 'Обзор', icon: TrendingUp, value: 'overview' },
    { label: lang === 'uz' ? 'Baholar' : 'Оценки', icon: BookOpen, value: 'grades' },
    { label: lang === 'uz' ? 'Dars jadvali' : 'Расписание', icon: Calendar, value: 'timetable' },
    { label: lang === 'uz' ? 'Uy vazifasi' : 'Домашнее задание', icon: BookOpen, value: 'homework' },
    { label: lang === 'uz' ? 'Bildirishnomalar' : 'Уведомления', icon: Bell, value: 'notifications' },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="parent"
      schoolName={db.schools.getById(schoolId)?.name}
    >
      {activeTab === 'overview' && (
        <ParentOverview lang={lang} students={myStudents} grades={grades} attendance={attendance} subjects={subjects} classes={classes} />
      )}
      {activeTab === 'grades' && (
        <GradesView lang={lang} students={myStudents} grades={grades} subjects={subjects} />
      )}
      {activeTab === 'timetable' && (
        <TimetableView lang={lang} students={myStudents} timetable={allTimetable} subjects={subjects} classes={classes} />
      )}
      {activeTab === 'homework' && (
        <HomeworkView lang={lang} students={myStudents} homework={allHomework} subjects={subjects} classes={classes} />
      )}
      {activeTab === 'notifications' && (
        <NotificationsView lang={lang} notifications={notifications} onRefresh={refresh} userId={userId} isParent={!!parent} />
      )}
    </DashboardShell>
  );
}

function ParentOverview({ lang, students, grades, attendance, subjects, classes }: any) {
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((sum: number, g: Grade) => sum + g.value, 0) / grades.length) : 0;
  const presentCount = attendance.filter((a: AttendanceRecord) => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;
  const absentCount = attendance.filter((a: AttendanceRecord) => a.status === 'absent').length;

  const stats = [
    { label: lang === 'uz' ? 'O\'rtacha baho' : 'Средняя оценка', value: avgGrade > 0 ? avgGrade.toString() : '—', icon: Award, color: 'text-primary', bg: 'bg-primary/10' },
    { label: lang === 'uz' ? 'Davomat' : 'Посещаемость', value: `${attendanceRate}%`, icon: Check, color: 'text-success', bg: 'bg-success/10' },
    { label: lang === 'uz' ? 'Kelmagan kunlar' : 'Пропуски', value: absentCount.toString(), icon: X, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: lang === 'uz' ? 'Baholar soni' : 'Всего оценок', value: grades.length.toString(), icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  // Subject-wise grades for radar
  const subjectAverages = subjects.map((subj: Subject) => {
    const subjGrades = grades.filter((g: Grade) => g.subjectId === subj.id);
    const avg = subjGrades.length > 0 ? Math.round(subjGrades.reduce((s: number, g: Grade) => s + g.value, 0) / subjGrades.length) : 0;
    return { subject: subj.name, score: avg };
  }).filter((d: any) => d.score > 0);

  // Recent grades
  const recentGrades = [...grades].sort((a: Grade, b: Grade) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Boshqaruv paneli' : 'Панель управления'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {students.map((s: Student) => s.fullName).join(', ')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjectAverages.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Fan bo\'yicha baholar' : 'Оценки по предметам'}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectAverages}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'So\'nggi baholar' : 'Последние оценки'}</CardTitle></CardHeader>
          <CardContent>
            {recentGrades.length > 0 ? (
              <div className="space-y-2">
                {recentGrades.map((g: Grade) => {
                  const subject = subjects.find((s: Subject) => s.id === g.subjectId);
                  const studentName = students.find((s: Student) => s.id === g.studentId)?.fullName;
                  return (
                    <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        g.value >= 85 ? 'bg-success/10 text-success' : g.value >= 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {g.value}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{subject?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{studentName} • {g.date}</p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs">{g.type}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">{lang === 'uz' ? 'Baholar yo\'q' : 'Нет оценок'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GradesView({ lang, students, grades, subjects }: any) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '');

  const studentGrades = grades.filter((g: Grade) => g.studentId === selectedStudent);

  // Group by subject
  const bySubject = subjects.map((subj: Subject) => {
    const subjGrades = studentGrades.filter((g: Grade) => g.subjectId === subj.id);
    return {
      subject: subj,
      grades: subjGrades,
      average: subjGrades.length > 0 ? Math.round(subjGrades.reduce((s: number, g: Grade) => s + g.value, 0) / subjGrades.length) : 0,
    };
  }).filter((d: any) => d.grades.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Baholar' : 'Оценки'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Real vaqt baholar jurnali' : 'Журнал оценок в реальном времени'}</p>
        </div>
        {students.length > 1 && (
          <div className="flex gap-2">
            {students.map((s: Student) => (
              <Button
                key={s.id}
                variant={selectedStudent === s.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStudent(s.id)}
              >
                {s.fullName}
              </Button>
            ))}
          </div>
        )}
      </div>

      {bySubject.length > 0 ? (
        <div className="space-y-4">
          {bySubject.map((data: any) => (
            <Card key={data.subject.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{data.subject.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{lang === 'uz' ? 'O\'rtacha' : 'Средняя'}:</span>
                    <Badge className={data.average >= 85 ? 'bg-success' : data.average >= 60 ? 'bg-amber-500' : 'bg-destructive'}>
                      {data.average}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.grades.map((g: Grade) => (
                    <div
                      key={g.id}
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-sm font-bold ${
                        g.value >= 85 ? 'bg-success/10 text-success' : g.value >= 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'
                      }`}
                      title={g.comment || g.type}
                    >
                      <span>{g.value}</span>
                      <span className="text-[10px] font-normal opacity-60">{g.type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{lang === 'uz' ? 'Baholar yo\'q' : 'Нет оценок'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TimetableView({ lang, students, timetable, subjects, classes }: any) {
  const studentClassIds = students.map((s: Student) => s.classId);
  const myTimetable = timetable.filter((s: TimetableSlot) => studentClassIds.includes(s.classId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Dars jadvali' : 'Расписание'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Haftalik dars jadvali' : 'Недельное расписание'}</p>
      </div>

      {myTimetable.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((d) => {
            const daySlots = myTimetable.filter((s: TimetableSlot) => s.day === d.key).sort((a: TimetableSlot, b: TimetableSlot) => a.startTime.localeCompare(b.startTime));
            if (daySlots.length === 0) return null;
            return (
              <Card key={d.key}>
                <CardHeader>
                  <CardTitle className="text-base">{lang === 'uz' ? d.fullUz : d.fullRu}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {daySlots.map((slot: TimetableSlot) => {
                      const subject = subjects.find((s: Subject) => s.id === slot.subjectId);
                      const cls = classes.find((c: any) => c.id === slot.classId);
                      return (
                        <div key={slot.id} className="flex items-center gap-3 p-2 rounded-lg border">
                          <div className="text-xs text-muted-foreground tabular-nums w-20">
                            {slot.startTime}-{slot.endTime}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{subject?.name || '—'}</p>
                            {slot.room && <p className="text-xs text-muted-foreground">{lang === 'uz' ? 'Xona' : 'Ауд.'} {slot.room}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{lang === 'uz' ? 'Jadval yo\'q' : 'Нет расписания'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HomeworkView({ lang, students, homework, subjects, classes }: any) {
  const studentClassIds = students.map((s: Student) => s.classId);
  const myHomework = homework.filter((h: Homework) => studentClassIds.includes(h.classId))
    .sort((a: Homework, b: Homework) => b.createdAt - a.createdAt);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Uy vazifasi' : 'Домашнее задание'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Joriy vazifalar' : 'Текущие задания'}</p>
      </div>

      {myHomework.length > 0 ? (
        <div className="space-y-3">
          {myHomework.map((hw: Homework) => {
            const subject = subjects.find((s: Subject) => s.id === hw.subjectId);
            const cls = classes.find((c: any) => c.id === hw.classId);
            const isOverdue = hw.dueDate < today;
            return (
              <Card key={hw.id} className={isOverdue ? 'border-destructive/30' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{hw.title}</h3>
                        <Badge variant="secondary">{subject?.name || '—'}</Badge>
                        {isOverdue && <Badge variant="destructive">{lang === 'uz' ? 'Muddati o\'tdi' : 'Просрочено'}</Badge>}
                      </div>
                      {hw.description && <p className="text-sm text-muted-foreground mb-2">{hw.description}</p>}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {lang === 'uz' ? 'Muddat' : 'Срок'}: {hw.dueDate}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{lang === 'uz' ? 'Uy vazifasi yo\'q' : 'Нет заданий'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NotificationsView({ lang, notifications, onRefresh, userId, isParent }: any) {
  const sorted = [...notifications].sort((a: Notification, b: Notification) => b.createdAt - a.createdAt);
  const unread = sorted.filter((n: Notification) => !n.read);

  const handleMarkRead = (id: string) => {
    db.notifications.update(id, { read: true });
    onRefresh();
  };

  const handleMarkAllRead = () => {
    unread.forEach((n: Notification) => db.notifications.update(n.id, { read: true }));
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            {lang === 'uz' ? 'Bildirishnomalar' : 'Уведомления'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unread.length} {lang === 'uz' ? 'o\'qilmagan' : 'непрочитанных'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-2" />
            {lang === 'uz' ? 'Barchasini o\'qildi' : 'Прочитать все'}
          </Button>
        )}
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {sorted.map((n: Notification) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className={!n.read ? 'border-primary/30 bg-primary/5' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        n.type === 'absence' ? 'bg-destructive/10 text-destructive' :
                        n.type === 'grade' ? 'bg-success/10 text-success' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {n.type === 'absence' ? <X className="w-5 h-5" /> : n.type === 'grade' ? <Award className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString(lang === 'uz' ? 'uz' : 'ru')}
                        </p>
                      </div>
                      {!n.read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{lang === 'uz' ? 'Bildirishnomalar yo\'q' : 'Нет уведомлений'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
