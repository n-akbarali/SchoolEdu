'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, Calendar, BarChart3, Plus, Check, X, Clock,
  FileDown, Bell, GraduationCap, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DashboardShell } from '@/components/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth, useLang } from '@/components/providers';
import { db } from '@/lib/db';
import { t } from '@/lib/i18n';
import type { Student, AttendanceRecord, Grade, Homework, TimetableSlot, DayOfWeek, Notification, Parent } from '@/lib/types';

const DAYS: { key: DayOfWeek; labelUz: string; labelRu: string }[] = [
  { key: 'monday', labelUz: 'Dush', labelRu: 'Пн' },
  { key: 'tuesday', labelUz: 'Sesh', labelRu: 'Вт' },
  { key: 'wednesday', labelUz: 'Chor', labelRu: 'Ср' },
  { key: 'thursday', labelUz: 'Pay', labelRu: 'Чт' },
  { key: 'friday', labelUz: 'Jum', labelRu: 'Пт' },
  { key: 'saturday', labelUz: 'Shan', labelRu: 'Сб' },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lessonEndOpen, setLessonEndOpen] = useState(false);
  const refresh = () => setRefreshKey((k) => k + 1);

  const schoolId = user?.schoolId;
  const teacherId = user?.id;
  if (!schoolId || !teacherId) return null;

  const today = new Date();
  const todayKey = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1].key;
  const timetable = db.timetable.getBySchool(schoolId).filter((s) => s.teacherId === teacherId);
  const todaySlots = timetable.filter((s) => s.day === todayKey);
  const allStudents = db.students.getBySchool(schoolId);
  const subjects = db.subjects.getBySchool(schoolId);
  const classes = db.classes.getBySchool(schoolId);
  const attendance = db.attendance.getBySchool(schoolId).filter((a) => a.teacherId === teacherId);
  const grades = db.grades.getBySchool(schoolId).filter((g) => g.teacherId === teacherId);
  const homeworks = db.homework.getBySchool(schoolId).filter((h) => h.teacherId === teacherId);

  // Lesson-end trigger check
  useEffect(() => {
    if (todaySlots.length === 0) return;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const endedSlot = todaySlots.find((slot) => slot.endTime <= currentTime);
    if (endedSlot) {
      const slotDate = today.toISOString().slice(0, 10);
      const hasRecord = attendance.some((a) => a.date === slotDate && a.subjectId === endedSlot.subjectId);
      if (!hasRecord && !sessionStorage.getItem(`lessonEnd_${endedSlot.id}_${slotDate}`)) {
        setLessonEndOpen(true);
      }
    }
  }, []);

  const navItems = [
    { label: lang === 'uz' ? 'Boshqaruv' : 'Обзор', icon: BarChart3, value: 'overview' },
    { label: lang === 'uz' ? 'Davomat' : 'Посещаемость', icon: Users, value: 'attendance' },
    { label: lang === 'uz' ? 'Baholar' : 'Оценки', icon: BookOpen, value: 'grades' },
    { label: lang === 'uz' ? 'Uy vazifasi' : 'Домашнее задание', icon: FileDown, value: 'homework' },
    { label: lang === 'uz' ? 'Dars jadvali' : 'Расписание', icon: Calendar, value: 'timetable' },
    { label: lang === 'uz' ? 'Hisobot' : 'Отчёт', icon: FileDown, value: 'reports' },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="teacher"
      schoolName={user?.name}
    >
      {activeTab === 'overview' && (
        <TeacherOverview lang={lang} teacherId={teacherId} schoolId={schoolId} todaySlots={todaySlots} allStudents={allStudents} attendance={attendance} grades={grades} subjects={subjects} classes={classes} />
      )}
      {activeTab === 'attendance' && (
        <AttendanceManager lang={lang} schoolId={schoolId} teacherId={teacherId} allStudents={allStudents} subjects={subjects} classes={classes} onRefresh={refresh} />
      )}
      {activeTab === 'grades' && (
        <GradebookManager lang={lang} schoolId={schoolId} teacherId={teacherId} allStudents={allStudents} subjects={subjects} classes={classes} parents={db.parents.getBySchool(schoolId)} onRefresh={refresh} />
      )}
      {activeTab === 'homework' && (
        <HomeworkManager lang={lang} schoolId={schoolId} teacherId={teacherId} subjects={subjects} classes={classes} onRefresh={refresh} homeworks={homeworks} />
      )}
      {activeTab === 'timetable' && (
        <TimetableManager lang={lang} schoolId={schoolId} teacherId={teacherId} timetable={timetable} subjects={subjects} classes={classes} allStudents={allStudents} onRefresh={refresh} />
      )}
      {activeTab === 'reports' && (
        <ReportsManager lang={lang} schoolId={schoolId} teacherId={teacherId} allStudents={allStudents} subjects={subjects} classes={classes} grades={grades} attendance={attendance} />
      )}

      <LessonEndModal
        open={lessonEndOpen}
        onOpenChange={setLessonEndOpen}
        lang={lang}
        schoolId={schoolId}
        teacherId={teacherId}
        todaySlots={todaySlots}
        allStudents={allStudents}
        subjects={subjects}
        classes={classes}
        parents={db.parents.getBySchool(schoolId)}
        onRefresh={refresh}
      />
    </DashboardShell>
  );
}

function TeacherOverview({ lang, teacherId, schoolId, todaySlots, allStudents, attendance, grades, subjects, classes }: any) {
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a: AttendanceRecord) => a.date === todayDate);
  const todayGrades = grades.filter((g: Grade) => g.date === todayDate);
  const studentIds = new Set([...attendance.map((a: AttendanceRecord) => a.studentId), ...grades.map((g: Grade) => g.studentId)]);

  const stats = [
    { label: lang === 'uz' ? 'Bugungi darslar' : 'Сегодня уроков', value: todaySlots.length, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: lang === 'uz' ? 'Bugungi davomat' : 'Сегодня посещаемость', value: todayAttendance.length, icon: Users, color: 'text-success', bg: 'bg-success/10' },
    { label: lang === 'uz' ? 'Bugungi baholar' : 'Сегодня оценки', value: todayGrades.length, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: lang === 'uz' ? 'Jami o\'quvchilar' : 'Всего учеников', value: studentIds.size, icon: GraduationCap, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Boshqaruv paneli' : 'Панель управления'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString(lang === 'uz' ? 'uz' : 'ru', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang === 'uz' ? 'Bugungi darslar' : 'Сегодня уроки'}</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySlots.length > 0 ? (
            <div className="space-y-2">
              {todaySlots.map((slot: TimetableSlot) => {
                const subject = subjects.find((s: any) => s.id === slot.subjectId);
                const cls = classes.find((c: any) => c.id === slot.classId);
                return (
                  <div key={slot.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground w-28">
                      <Clock className="w-4 h-4" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{subject?.name || '—'}</span>
                      <span className="text-sm text-muted-foreground ml-2">{cls?.name || ''}</span>
                    </div>
                    {slot.room && <Badge variant="secondary">{slot.room}</Badge>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">{lang === 'uz' ? 'Bugun darslar yo\'q' : 'Сегодня нет уроков'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceManager({ lang, schoolId, teacherId, allStudents, subjects, classes, onRefresh }: any) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  const classStudents = allStudents.filter((s: Student) => s.classId === classId);

  const handleSave = () => {
    Object.entries(statuses).forEach(([studentId, status]) => {
      db.attendance.add({
        schoolId, classId, studentId, subjectId, teacherId, date, status,
      } as Omit<AttendanceRecord, 'id' | 'createdAt'>);
      // Create notification for absent students
      if (status === 'absent') {
        const student = allStudents.find((s: Student) => s.id === studentId);
        if (student && student.parentId && student.parentId !== 'none') {
          const subject = subjects.find((s: any) => s.id === subjectId);
          db.notifications.add({
            schoolId,
            parentId: student.parentId,
            studentId,
            type: 'absence',
            title: lang === 'uz' ? 'O\'quvchi darsga kelmadi' : 'Ученик отсутствовал',
            message: `${student.fullName} - ${subject?.name || ''} (${date})`,
            read: false,
          } as Omit<Notification, 'id' | 'createdAt'>);
        }
      }
    });
    setStatuses({});
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Davomat' : 'Посещаемость'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? '1 bosish bilan davomat' : 'Посещаемость в 1 клик'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Davomat belgilash' : 'Отметить посещаемость'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sinf' : 'Класс'}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Sinf' : 'Класс'} /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Fan' : 'Предмет'}</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Fan' : 'Предмет'} /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sana' : 'Дата'}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {classId && classStudents.length > 0 ? (
            <>
              <div className="space-y-2">
                {classStudents.map((s: Student) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium text-sm">{s.fullName}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={statuses[s.id] === 'present' ? 'default' : 'outline'}
                        onClick={() => setStatuses({ ...statuses, [s.id]: 'present' })}
                        className="h-8"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {t(lang, 'present')}
                      </Button>
                      <Button
                        size="sm"
                        variant={statuses[s.id] === 'late' ? 'default' : 'outline'}
                        onClick={() => setStatuses({ ...statuses, [s.id]: 'late' })}
                        className="h-8"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {t(lang, 'late')}
                      </Button>
                      <Button
                        size="sm"
                        variant={statuses[s.id] === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => setStatuses({ ...statuses, [s.id]: 'absent' })}
                        className="h-8"
                      >
                        <X className="w-3 h-3 mr-1" />
                        {t(lang, 'absent')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(statuses).length > 0 && (
                <Button onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  {t(lang, 'submit')}
                </Button>
              )}
            </>
          ) : classId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{lang === 'uz' ? 'Bu sinfda o\'quvchilar yo\'q' : 'В этом классе нет учеников'}</p>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{lang === 'uz' ? 'Sinf tanlang' : 'Выберите класс'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GradebookManager({ lang, schoolId, teacherId, allStudents, subjects, classes, parents, onRefresh }: any) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [gradeValues, setGradeValues] = useState<Record<string, { value: string; type: string; comment: string }>>({});

  const classStudents = allStudents.filter((s: Student) => s.classId === classId);

  const handleSave = () => {
    Object.entries(gradeValues).forEach(([studentId, data]) => {
      if (!data.value) return;
      const valueNum = parseInt(data.value);
      if (isNaN(valueNum) || valueNum < 0 || valueNum > 100) return;

      db.grades.add({
        schoolId, classId, studentId, subjectId, teacherId,
        value: valueNum,
        type: data.type as Grade['type'],
        date: new Date().toISOString().slice(0, 10),
        comment: data.comment || undefined,
      } as Omit<Grade, 'id' | 'createdAt'>);

      // Notification to parent
      const student = allStudents.find((s: Student) => s.id === studentId);
      if (student && student.parentId && student.parentId !== 'none') {
        const subject = subjects.find((s: any) => s.id === subjectId);
        db.notifications.add({
          schoolId,
          parentId: student.parentId,
          studentId,
          type: 'grade',
          title: lang === 'uz' ? 'Yangi baho' : 'Новая оценка',
          message: `${student.fullName} - ${subject?.name || ''}: ${valueNum}`,
          read: false,
        } as Omit<Notification, 'id' | 'createdAt'>);
      }
    });
    setGradeValues({});
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Elektron baholar' : 'Электронный журнал'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Baholarni boshqaring' : 'Управление оценками'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Baho qo\'yish' : 'Поставить оценку'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sinf' : 'Класс'}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Sinf' : 'Класс'} /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Fan' : 'Предмет'}</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Fan' : 'Предмет'} /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {classId && classStudents.length > 0 ? (
            <>
              <div className="space-y-2">
                {classStudents.map((s: Student) => (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center p-3 rounded-lg border">
                    <span className="font-medium text-sm">{s.fullName}</span>
                    <Select
                      value={gradeValues[s.id]?.type || 'quiz'}
                      onValueChange={(v) => setGradeValues({ ...gradeValues, [s.id]: { ...gradeValues[s.id], value: gradeValues[s.id]?.value || '', type: v, comment: gradeValues[s.id]?.comment || '' } })}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="participation">Participation</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0-100"
                      className="h-8"
                      value={gradeValues[s.id]?.value || ''}
                      onChange={(e) => setGradeValues({ ...gradeValues, [s.id]: { value: e.target.value, type: gradeValues[s.id]?.type || 'quiz', comment: gradeValues[s.id]?.comment || '' } })}
                    />
                    <Input
                      placeholder={lang === 'uz' ? 'Izoh' : 'Комментарий'}
                      className="h-8"
                      value={gradeValues[s.id]?.comment || ''}
                      onChange={(e) => setGradeValues({ ...gradeValues, [s.id]: { value: gradeValues[s.id]?.value || '', type: gradeValues[s.id]?.type || 'quiz', comment: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
              {Object.values(gradeValues).some((v) => v.value) && (
                <Button onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  {t(lang, 'submit')}
                </Button>
              )}
            </>
          ) : classId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{lang === 'uz' ? 'Bu sinfda o\'quvchilar yo\'q' : 'В этом классе нет учеников'}</p>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{lang === 'uz' ? 'Sinf tanlang' : 'Выберите класс'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HomeworkManager({ lang, schoolId, teacherId, subjects, classes, onRefresh, homeworks }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleAdd = () => {
    if (!title.trim() || !classId || !subjectId || !dueDate) return;
    db.homework.add({
      schoolId, classId, subjectId, teacherId,
      title, description, dueDate,
    } as Omit<Homework, 'id' | 'createdAt'>);

    // Notify parents
    const students = db.students.getBySchool(schoolId).filter((s) => s.classId === classId);
    students.forEach((s) => {
      if (s.parentId && s.parentId !== 'none') {
        db.notifications.add({
          schoolId, parentId: s.parentId, studentId: s.id,
          type: 'homework',
          title: lang === 'uz' ? 'Yangi uy vazifasi' : 'Новое домашнее задание',
          message: `${title} - due ${dueDate}`,
          read: false,
        } as Omit<Notification, 'id' | 'createdAt'>);
      }
    });

    setTitle(''); setDescription(''); setClassId(''); setSubjectId(''); setDueDate('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    db.homework.remove(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Uy vazifasi' : 'Домашнее задание'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Vazifalarni boshqaring' : 'Управление заданиями'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Yangi uy vazifasi' : 'Новое задание'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sarlavha' : 'Заголовок'}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Math exercises" />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Muddat' : 'Срок'}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sinf' : 'Класс'}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Fan' : 'Предмет'}</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{lang === 'uz' ? 'Tavsif' : 'Описание'}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={lang === 'uz' ? 'Vazifa tavsifi...' : 'Описание задания...'} />
          </div>
          <Button onClick={handleAdd} disabled={!title.trim() || !classId || !subjectId || !dueDate}>
            <Plus className="w-4 h-4 mr-2" />
            {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}
          </Button>
        </CardContent>
      </Card>

      {homeworks.length > 0 && (
        <div className="space-y-3">
          {homeworks.map((hw: Homework) => {
            const subject = subjects.find((s: any) => s.id === hw.subjectId);
            const cls = classes.find((c: any) => c.id === hw.classId);
            return (
              <Card key={hw.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{hw.title}</h3>
                        <Badge variant="secondary">{subject?.name || '—'}</Badge>
                        <Badge variant="outline">{cls?.name || ''}</Badge>
                      </div>
                      {hw.description && <p className="text-sm text-muted-foreground mb-2">{hw.description}</p>}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {lang === 'uz' ? 'Muddat' : 'Срок'}: {hw.dueDate}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(hw.id)}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimetableManager({ lang, schoolId, teacherId, timetable, subjects, classes, allStudents, onRefresh }: any) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:45');
  const [room, setRoom] = useState('');

  const handleAdd = () => {
    if (!classId || !subjectId) return;
    db.timetable.add({
      schoolId, classId, subjectId, teacherId, day, startTime, endTime, room,
    } as Omit<TimetableSlot, 'id'>);
    setRoom('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    db.timetable.remove(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Dars jadvali' : 'Расписание'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Jadvalni boshqaring' : 'Управление расписанием'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Yangi dars' : 'Новый урок'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sinf' : 'Класс'}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Fan' : 'Предмет'}</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Kun' : 'День'}</Label>
              <Select value={day} onValueChange={(v) => setDay(v as DayOfWeek)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d.key} value={d.key}>{lang === 'uz' ? d.labelUz : d.labelRu}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Boshlanish' : 'Начало'}</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Tugash' : 'Конец'}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Xona' : 'Аудитория'}</Label>
              <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="101" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!classId || !subjectId}>
            <Plus className="w-4 h-4 mr-2" />
            {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Mening jadvalim' : 'Моё расписание'}</CardTitle></CardHeader>
        <CardContent>
          {timetable.length > 0 ? (
            <div className="space-y-4">
              {DAYS.map((d) => {
                const daySlots = timetable.filter((s: TimetableSlot) => s.day === d.key).sort((a: TimetableSlot, b: TimetableSlot) => a.startTime.localeCompare(b.startTime));
                if (daySlots.length === 0) return null;
                return (
                  <div key={d.key}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{lang === 'uz' ? d.labelUz : d.labelRu}</h4>
                    <div className="space-y-1">
                      {daySlots.map((slot: TimetableSlot) => {
                        const subject = subjects.find((s: any) => s.id === slot.subjectId);
                        const cls = classes.find((c: any) => c.id === slot.classId);
                        return (
                          <div key={slot.id} className="flex items-center gap-3 p-2 rounded-lg border">
                            <span className="text-sm text-muted-foreground w-28 tabular-nums">{slot.startTime} - {slot.endTime}</span>
                            <span className="font-medium text-sm flex-1">{subject?.name || '—'} <span className="text-muted-foreground">({cls?.name})</span></span>
                            {slot.room && <Badge variant="secondary">{slot.room}</Badge>}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(slot.id)}>
                              <X className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{lang === 'uz' ? 'Jadval bo\'sh' : 'Расписание пусто'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsManager({ lang, schoolId, teacherId, allStudents, subjects, classes, grades, attendance }: any) {
  const [classId, setClassId] = useState('');
  const [quarter, setQuarter] = useState('1');

  const classStudents = allStudents.filter((s: Student) => s.classId === classId);

  const reportData = classStudents.map((s: Student) => {
    const sGrades = grades.filter((g: Grade) => g.studentId === s.id);
    const sAttendance = attendance.filter((a: AttendanceRecord) => a.studentId === s.id);
    const avgGrade = sGrades.length > 0 ? Math.round(sGrades.reduce((sum: number, g: Grade) => sum + g.value, 0) / sGrades.length) : 0;
    const present = sAttendance.filter((a: AttendanceRecord) => a.status === 'present').length;
    const absent = sAttendance.filter((a: AttendanceRecord) => a.status === 'absent').length;
    const late = sAttendance.filter((a: AttendanceRecord) => a.status === 'late').length;
    return { name: s.fullName, avgGrade, totalGrades: sGrades.length, present, absent, late };
  });

  const handleExport = () => {
    const headers = ['Student', 'Avg Grade', 'Total Grades', 'Present', 'Absent', 'Late'];
    const rows = reportData.map((r: any) => [r.name, r.avgGrade.toString(), r.totalGrades.toString(), r.present.toString(), r.absent.toString(), r.late.toString()]);
    const csv = [headers, ...rows].map((r: string[]) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quarterly_report_Q${quarter}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Hisobot' : 'Отчёт'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Choraklik hisobot eksport' : 'Экспорт квартального отчёта'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Hisobot yaratish' : 'Создать отчёт'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sinf' : 'Класс'}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Sinf' : 'Класс'} /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Chorak' : 'Четверть'}</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {classId && reportData.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang === 'uz' ? 'O\'quvchi' : 'Ученик'}</TableHead>
                    <TableHead>{lang === 'uz' ? 'O\'rtacha' : 'Средняя'}</TableHead>
                    <TableHead>{lang === 'uz' ? 'Baholar' : 'Оценки'}</TableHead>
                    <TableHead>{lang === 'uz' ? 'Keldi' : 'Присут.'}</TableHead>
                    <TableHead>{lang === 'uz' ? 'Kelmadi' : 'Отсутств.'}</TableHead>
                    <TableHead>{lang === 'uz' ? 'Kechikdi' : 'Опоздал'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className={r.avgGrade < 60 ? 'text-destructive font-bold' : ''}>{r.avgGrade || '—'}</TableCell>
                      <TableCell>{r.totalGrades}</TableCell>
                      <TableCell className="text-success">{r.present}</TableCell>
                      <TableCell className="text-destructive">{r.absent}</TableCell>
                      <TableCell className="text-amber-500">{r.late}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={handleExport}>
                <FileDown className="w-4 h-4 mr-2" />
                {lang === 'uz' ? 'CSV eksport' : 'Экспорт CSV'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LessonEndModal({ open, onOpenChange, lang, schoolId, teacherId, todaySlots, allStudents, subjects, classes, parents, onRefresh }: any) {
  const [activeSlot, setActiveSlot] = useState<TimetableSlot | null>(null);
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [gradeValues, setGradeValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'attendance' | 'grades'>('attendance');

  useEffect(() => {
    if (open && todaySlots.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const ended = todaySlots.find((slot: TimetableSlot) => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return slot.endTime <= currentTime;
      });
      if (ended) {
        setActiveSlot(ended);
        const slotStudents = allStudents.filter((s: Student) => s.classId === ended.classId);
        const initStatuses: Record<string, 'present' | 'absent' | 'late'> = {};
        slotStudents.forEach((s: Student) => { initStatuses[s.id] = 'present'; });
        setStatuses(initStatuses);
      }
    }
  }, [open]);

  const slotStudents = activeSlot ? allStudents.filter((s: Student) => s.classId === activeSlot.classId) : [];

  const handleSubmit = () => {
    if (!activeSlot) return;
    const today = new Date().toISOString().slice(0, 10);

    // Save attendance
    Object.entries(statuses).forEach(([studentId, status]) => {
      db.attendance.add({
        schoolId, classId: activeSlot.classId, studentId, subjectId: activeSlot.subjectId, teacherId, date: today, status,
      } as Omit<AttendanceRecord, 'id' | 'createdAt'>);

      if (status === 'absent') {
        const student = allStudents.find((s: Student) => s.id === studentId);
        if (student && student.parentId && student.parentId !== 'none') {
          const subject = subjects.find((s: any) => s.id === activeSlot.subjectId);
          db.notifications.add({
            schoolId, parentId: student.parentId, studentId,
            type: 'absence',
            title: lang === 'uz' ? 'O\'quvchi darsga kelmadi' : 'Ученик отсутствовал',
            message: `${student.fullName} - ${subject?.name || ''} (${today})`,
            read: false,
          } as Omit<Notification, 'id' | 'createdAt'>);
        }
      }
    });

    // Save grades
    Object.entries(gradeValues).forEach(([studentId, value]) => {
      if (!value) return;
      const valueNum = parseInt(value);
      if (isNaN(valueNum)) return;
      db.grades.add({
        schoolId, classId: activeSlot.classId, studentId, subjectId: activeSlot.subjectId, teacherId,
        value: valueNum, type: 'participation', date: today,
      } as Omit<Grade, 'id' | 'createdAt'>);

      const student = allStudents.find((s: Student) => s.id === studentId);
      if (student && student.parentId && student.parentId !== 'none') {
        const subject = subjects.find((s: any) => s.id === activeSlot.subjectId);
        db.notifications.add({
          schoolId, parentId: student.parentId, studentId,
          type: 'grade',
          title: lang === 'uz' ? 'Yangi baho' : 'Новая оценка',
          message: `${student.fullName} - ${subject?.name || ''}: ${valueNum}`,
          read: false,
        } as Omit<Notification, 'id' | 'createdAt'>);
      }
    });

    sessionStorage.setItem(`lessonEnd_${activeSlot.id}_${today}`, 'done');
    onOpenChange(false);
    setStep('attendance');
    setGradeValues({});
    onRefresh();
  };

  const subject = activeSlot ? subjects.find((s: any) => s.id === activeSlot.subjectId) : null;
  const cls = activeSlot ? classes.find((c: any) => c.id === activeSlot.classId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Bell className="w-5 h-5" />
            {lang === 'uz' ? 'Dars yakunlandi!' : 'Урок завершён!'}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground">
            {t(lang, 'lessonEnd')}
          </DialogDescription>
        </DialogHeader>

        {activeSlot && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-medium">{subject?.name}</span>
              <span className="text-muted-foreground">{cls?.name}</span>
              <span className="text-muted-foreground ml-auto">{activeSlot.startTime} - {activeSlot.endTime}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setStep('attendance')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              step === 'attendance' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t(lang, 'markAttendance')}
          </button>
          <button
            onClick={() => setStep('grades')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              step === 'grades' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t(lang, 'markGrades')}
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {step === 'attendance' && slotStudents.map((s: Student) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border">
              <span className="text-sm font-medium">{s.fullName}</span>
              <div className="flex gap-1">
                <Button size="sm" variant={statuses[s.id] === 'present' ? 'default' : 'outline'} className="h-7 px-2" onClick={() => setStatuses({ ...statuses, [s.id]: 'present' })}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button size="sm" variant={statuses[s.id] === 'late' ? 'default' : 'outline'} className="h-7 px-2" onClick={() => setStatuses({ ...statuses, [s.id]: 'late' })}>
                  <Clock className="w-3 h-3" />
                </Button>
                <Button size="sm" variant={statuses[s.id] === 'absent' ? 'destructive' : 'outline'} className="h-7 px-2" onClick={() => setStatuses({ ...statuses, [s.id]: 'absent' })}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          {step === 'grades' && slotStudents.map((s: Student) => (
            <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border">
              <span className="text-sm font-medium flex-1">{s.fullName}</span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                className="h-8 w-20"
                value={gradeValues[s.id] || ''}
                onChange={(e) => setGradeValues({ ...gradeValues, [s.id]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t(lang, 'cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            <Check className="w-4 h-4 mr-2" />
            {t(lang, 'submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
