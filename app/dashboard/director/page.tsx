'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, Calendar, BarChart3, KeyRound, AlertTriangle,
  TrendingDown, CheckCircle2, Clock, Plus, Copy, RefreshCw, GraduationCap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import { DashboardShell } from '@/components/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth, useLang } from '@/components/providers';
import { db, registerUser } from '@/lib/db';
import type { School, Teacher, Student, SchoolClass, Subject, AttendanceRecord, Grade, Parent, Role } from '@/lib/types';

export default function DirectorDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const schoolId = user?.schoolId;
  if (!schoolId) return null;

  const school = db.schools.getById(schoolId);
  const teachers = db.teachers.getBySchool(schoolId);
  const students = db.students.getBySchool(schoolId);
  const classes = db.classes.getBySchool(schoolId);
  const subjects = db.subjects.getBySchool(schoolId);
  const attendance = db.attendance.getBySchool(schoolId);
  const grades = db.grades.getBySchool(schoolId);
  const parents = db.parents.getBySchool(schoolId);

  const navItems = [
    { label: lang === 'uz' ? 'Boshqaruv' : 'Обзор', icon: BarChart3, value: 'overview' },
    { label: lang === 'uz' ? 'Xavf ostida' : 'В группе риска', icon: AlertTriangle, value: 'atrisk' },
    { label: lang === 'uz' ? 'O\'qituvchilar' : 'Учителя', icon: Users, value: 'teachers' },
    { label: lang === 'uz' ? 'O\'quvchilar' : 'Ученики', icon: GraduationCap, value: 'students' },
    { label: lang === 'uz' ? 'Sinflar va Fanlar' : 'Классы и Предметы', icon: BookOpen, value: 'classes' },
    { label: lang === 'uz' ? 'Hisobotlar' : 'Аккаунты', icon: KeyRound, value: 'credentials' },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="director"
      schoolName={school?.name}
    >
      {activeTab === 'overview' && (
        <Overview lang={lang} teachers={teachers} students={students} classes={classes} subjects={subjects} attendance={attendance} grades={grades} />
      )}
      {activeTab === 'atrisk' && (
        <AtRisk lang={lang} students={students} grades={grades} attendance={attendance} subjects={subjects} />
      )}
      {activeTab === 'teachers' && (
        <TeachersManager lang={lang} schoolId={schoolId} subjects={subjects} teachers={teachers} onRefresh={refresh} />
      )}
      {activeTab === 'students' && (
        <StudentsManager lang={lang} schoolId={schoolId} classes={classes} students={students} parents={parents} onRefresh={refresh} />
      )}
      {activeTab === 'classes' && (
        <ClassesManager lang={lang} schoolId={schoolId} classes={classes} subjects={subjects} onRefresh={refresh} />
      )}
      {activeTab === 'credentials' && (
        <CredentialGenerator lang={lang} schoolId={schoolId} teachers={teachers} students={students} parents={parents} onRefresh={refresh} />
      )}
    </DashboardShell>
  );
}

function Overview({ lang, teachers, students, classes, subjects, attendance, grades }: any) {
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a: AttendanceRecord) => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  const stats = [
    { label: lang === 'uz' ? 'O\'qituvchilar' : 'Учителя', value: teachers.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: lang === 'uz' ? 'O\'quvchilar' : 'Ученики', value: students.length, icon: GraduationCap, color: 'text-success', bg: 'bg-success/10' },
    { label: lang === 'uz' ? 'Sinflar' : 'Классы', value: classes.length, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: lang === 'uz' ? 'Fanlar' : 'Предметы', value: subjects.length, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  // Weekly attendance data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  }).reverse();

  const weeklyData = last7Days.map((date) => {
    const dayRecords = attendance.filter((a: AttendanceRecord) => a.date === date);
    const present = dayRecords.filter((a: AttendanceRecord) => a.status === 'present').length;
    const total = dayRecords.length;
    return {
      day: new Date(date).toLocaleDateString(lang === 'uz' ? 'uz' : 'ru', { weekday: 'short' }),
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  });

  const gradeDistribution = [
    { name: '5', value: grades.filter((g: Grade) => g.value >= 90).length, fill: 'hsl(142, 71%, 45%)' },
    { name: '4', value: grades.filter((g: Grade) => g.value >= 70 && g.value < 90).length, fill: 'hsl(199, 89%, 48%)' },
    { name: '3', value: grades.filter((g: Grade) => g.value >= 50 && g.value < 70).length, fill: 'hsl(38, 92%, 50%)' },
    { name: '2', value: grades.filter((g: Grade) => g.value < 50).length, fill: 'hsl(0, 84%, 60%)' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Boshqaruv paneli' : 'Панель управления'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{lang === 'uz' ? 'Maktab holati' : 'Состояние школы'}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'uz' ? 'Haftalik davomat' : 'Еженедельная посещаемость'}</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.some((d) => d.rate > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={BarChart3} text={lang === 'uz' ? 'Davomat ma\'lumotlari yo\'q' : 'Нет данных о посещаемости'} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'uz' ? 'Baho taqsimoti' : 'Распределение оценок'}</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {gradeDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={BarChart3} text={lang === 'uz' ? 'Baho ma\'lumotlari yo\'q' : 'Нет данных об оценках'} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang === 'uz' ? 'Davomat darajasi' : 'Уровень посещаемости'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={[{ name: 'rate', value: attendanceRate, fill: 'hsl(var(--primary))' }]} innerRadius={60} outerRadius={70} startAngle={90} endAngle={90 - (attendanceRate * 3.6)}>
                  <RadialBar dataKey="value" background />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-4xl font-bold tabular-nums">{attendanceRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalAttendance} {lang === 'uz' ? 'yozuv' : 'записей'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AtRisk({ lang, students, grades, attendance, subjects }: any) {
  const atRisk = students.map((s: Student) => {
    const sGrades = grades.filter((g: Grade) => g.studentId === s.id);
    const sAttendance = attendance.filter((a: AttendanceRecord) => a.studentId === s.id);
    const absentCount = sAttendance.filter((a: AttendanceRecord) => a.status === 'absent').length;
    const avgGrade = sGrades.length > 0 ? sGrades.reduce((sum: number, g: Grade) => sum + g.value, 0) / sGrades.length : 100;
    const attendanceRate = sAttendance.length > 0 ? (sAttendance.filter((a: AttendanceRecord) => a.status === 'present').length / sAttendance.length) * 100 : 100;
    const riskScore = (100 - avgGrade) * 0.5 + (100 - attendanceRate) * 0.5;
    return { ...s, avgGrade: Math.round(avgGrade), attendanceRate: Math.round(attendanceRate), absentCount, riskScore: Math.round(riskScore) };
  })
    .filter((s: any) => s.riskScore > 15)
    .sort((a: any, b: any) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          {lang === 'uz' ? 'Xavf ostidagi o\'quvchilar' : 'Учащиеся в группе риска'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'uz' ? 'Past baho yoki yuqori davomatsizlik' : 'Низкие оценки или высокая пропускаемость'}
        </p>
      </div>

      {atRisk.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-success/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {lang === 'uz' ? 'Xavf ostidagi o\'quvchilar yo\'q' : 'Нет учащихся в группе риска'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atRisk.map((s: any, i: number) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={s.riskScore > 40 ? 'border-destructive/30' : 'border-amber-500/30'}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lang === 'uz' ? 'O\'rtacha baho' : 'Средняя оценка'}: {s.avgGrade}</p>
                      <p className="text-xs text-muted-foreground">{lang === 'uz' ? 'Davomat' : 'Посещаемость'}: {s.attendanceRate}%</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      s.riskScore > 40 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {s.riskScore}%
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">{lang === 'uz' ? 'Baholar' : 'Оценки'}</span><span className={s.avgGrade < 60 ? 'text-destructive' : ''}>{s.avgGrade}/100</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">{lang === 'uz' ? 'Davomat' : 'Посещаемость'}</span><span className={s.attendanceRate < 70 ? 'text-destructive' : ''}>{s.attendanceRate}%</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">{lang === 'uz' ? 'Kelmagan kunlar' : 'Пропуски'}</span><span>{s.absentCount}</span></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeachersManager({ lang, schoolId, subjects, teachers, onRefresh }: any) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !username.trim() || !password.trim()) return;
    const teacher = db.teachers.add({ schoolId, fullName: name, subject, username, password } as Omit<Teacher, 'id' | 'createdAt'>);
    registerUser({ username, password, role: 'teacher', schoolId, displayName: name, localId: teacher.id });
    setName(''); setUsername(''); setPassword(''); setSubject('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    db.teachers.remove(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'O\'qituvchilar' : 'Учителя'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{teachers.length} {lang === 'uz' ? 'o\'qituvchi' : 'учителей'}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang === 'uz' ? 'Yangi o\'qituvchi' : 'Новый учитель'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'To\'liq ism' : 'Полное имя'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Valiyev" />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Fan' : 'Предмет'}</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Fan tanlang' : 'Выберите предмет'} /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: Subject) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Login' : 'Логин'}</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ali_teacher" />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Parol' : 'Пароль'}</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || !username.trim() || !password.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}
          </Button>
        </CardContent>
      </Card>

      {teachers.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'uz' ? 'Ism' : 'Имя'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Fan' : 'Предмет'}</TableHead>
                <TableHead>Login</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t: Teacher) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.fullName}</TableCell>
                  <TableCell><Badge variant="secondary">{t.subject || '—'}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{t.username}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><KeyRound className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function StudentsManager({ lang, schoolId, classes, students, parents, onRefresh }: any) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [parentId, setParentId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !classId || !username.trim() || !password.trim()) return;
    const student = db.students.add({ schoolId, classId, parentId: parentId || 'none', fullName: name, username, password } as Omit<Student, 'id' | 'createdAt'>);
    registerUser({ username, password, role: 'student', schoolId, displayName: name, localId: student.id });
    setName(''); setClassId(''); setParentId(''); setUsername(''); setPassword('');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    db.students.remove(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'O\'quvchilar' : 'Ученики'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{students.length} {lang === 'uz' ? 'o\'quvchi' : 'учеников'}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Yangi o\'quvchi' : 'Новый ученик'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'To\'liq ism' : 'Полное имя'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hasan Aliyev" />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Sinf' : 'Класс'}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Sinf tanlang' : 'Выберите класс'} /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: SchoolClass) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Ota-ona' : 'Родитель'}</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder={lang === 'uz' ? 'Tanlang (ixtiyoriy)' : 'Выберите (опц.)'} /></SelectTrigger>
                <SelectContent>
                  {parents.map((p: Parent) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Login' : 'Логин'}</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="hasan_s" />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Parol' : 'Пароль'}</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || !classId || !username.trim() || !password.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}
          </Button>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'uz' ? 'Ism' : 'Имя'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Sinf' : 'Класс'}</TableHead>
                <TableHead>Login</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s: Student) => {
                const cls = classes.find((c: SchoolClass) => c.id === s.classId);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell>{cls?.name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{s.username}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><KeyRound className="w-4 h-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function ClassesManager({ lang, schoolId, classes, subjects, onRefresh }: any) {
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('1');
  const [subjectName, setSubjectName] = useState('');

  const handleAddClass = () => {
    if (!className.trim()) return;
    db.classes.add({ schoolId, name: className, grade: parseInt(grade) } as Omit<SchoolClass, 'id' | 'createdAt'>);
    setClassName('');
    onRefresh();
  };

  const handleAddSubject = () => {
    if (!subjectName.trim()) return;
    db.subjects.add({ schoolId, name: subjectName } as Omit<Subject, 'id' | 'createdAt'>);
    setSubjectName('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Sinflar va Fanlar' : 'Классы и Предметы'}</h1>
      </div>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">{lang === 'uz' ? 'Sinflar' : 'Классы'}</TabsTrigger>
          <TabsTrigger value="subjects">{lang === 'uz' ? 'Fanlar' : 'Предметы'}</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <Card>
            <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Yangi sinf' : 'Новый класс'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'Sinf nomi' : 'Название класса'}</Label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="1-A" />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'Sinfi' : 'Класс'}</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddClass} disabled={!className.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}
              </Button>

              {classes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {classes.map((c: SchoolClass) => (
                    <Badge key={c.id} variant="secondary" className="text-sm py-2 px-3">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Yangi fan' : 'Новый предмет'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{lang === 'uz' ? 'Fan nomi' : 'Название предмета'}</Label>
                <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Matematika" />
              </div>
              <Button onClick={handleAddSubject} disabled={!subjectName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {lang === 'uz' ? 'Qo\'shish' : 'Добавить'}
              </Button>

              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {subjects.map((s: Subject) => (
                    <Badge key={s.id} variant="secondary" className="text-sm py-2 px-3">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CredentialGenerator({ lang, schoolId, teachers, students, parents, onRefresh }: any) {
  const [generated, setGenerated] = useState<{ role: string; username: string; password: string; name: string }[]>([]);
  const [count, setCount] = useState(5);

  const generate = () => {
    const roles = ['teacher', 'student', 'parent'] as const;
    const results: { role: string; username: string; password: string; name: string }[] = [];
    const subjects = db.subjects.getBySchool(schoolId);
    const classes = db.classes.getBySchool(schoolId);

    for (let i = 0; i < count; i++) {
      const role = roles[i % 3];
      const random = Math.random().toString(36).slice(2, 6);
      const username = `${role}_${random}`;
      const password = Math.random().toString(36).slice(2, 8);

      if (role === 'teacher') {
        const subject = subjects.length > 0 ? subjects[i % subjects.length].name : 'General';
        const teacher = db.teachers.add({ schoolId, fullName: `Teacher ${random.toUpperCase()}`, subject, username, password } as Omit<Teacher, 'id' | 'createdAt'>);
        registerUser({ username, password, role: 'teacher', schoolId, displayName: `Teacher ${random.toUpperCase()}`, localId: teacher.id });
        results.push({ role, username, password, name: `Teacher ${random.toUpperCase()}` });
      } else if (role === 'student') {
        const classId = classes.length > 0 ? classes[0].id : '';
        const student = db.students.add({ schoolId, classId, parentId: 'none', fullName: `Student ${random.toUpperCase()}`, username, password } as Omit<Student, 'id' | 'createdAt'>);
        registerUser({ username, password, role: 'student', schoolId, displayName: `Student ${random.toUpperCase()}`, localId: student.id });
        results.push({ role, username, password, name: `Student ${random.toUpperCase()}` });
      } else {
        const parent = db.parents.add({ schoolId, fullName: `Parent ${random.toUpperCase()}`, username, password } as Omit<Parent, 'id' | 'createdAt'>);
        registerUser({ username, password, role: 'parent', schoolId, displayName: `Parent ${random.toUpperCase()}`, localId: parent.id });
        results.push({ role, username, password, name: `Parent ${random.toUpperCase()}` });
      }
    }
    setGenerated(results);
    onRefresh();
  };

  const copyAll = () => {
    const text = generated.map((g) => `${g.name} (${g.role}): ${g.username} / ${g.password}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Hisob generatori' : 'Генератор аккаунтов'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'uz' ? 'O\'qituvchi/o\'quvchi/ota-ona uchun avtomatik hisoblar' : 'Автоматические аккаунты для учителей/учеников/родителей'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang === 'uz' ? 'Hisob yarating' : 'Создать аккаунты'}</CardTitle>
          <CardDescription>{lang === 'uz' ? 'Bir nechta hisobni bir vaqtda yarating' : 'Создайте несколько аккаунтов сразу'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>{lang === 'uz' ? 'Soni' : 'Количество'}</Label>
              <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 15, 20].map((n) => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {lang === 'uz' ? 'Yaratish' : 'Создать'}
            </Button>
          </div>

          {generated.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{generated.length} {lang === 'uz' ? 'hisob yaratildi' : 'аккаунтов создано'}</span>
                <Button variant="outline" size="sm" onClick={copyAll}>
                  <Copy className="w-4 h-4 mr-2" />
                  {lang === 'uz' ? 'Barchasini nusxalash' : 'Копировать все'}
                </Button>
              </div>
              <div className="rounded-lg border divide-y">
                {generated.map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="capitalize">{g.role}</Badge>
                      <span className="text-sm font-medium">{g.name}</span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {g.username} / {g.password}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">{lang === 'uz' ? 'Barcha hisoblar' : 'Все аккаунты'}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'uz' ? 'Rol' : 'Роль'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Ism' : 'Имя'}</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Parol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t: Teacher) => (
                <TableRow key={t.id}>
                  <TableCell><Badge>Teacher</Badge></TableCell>
                  <TableCell>{t.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">{t.username}</TableCell>
                  <TableCell className="font-mono text-xs">{t.password}</TableCell>
                </TableRow>
              ))}
              {students.map((s: Student) => (
                <TableRow key={s.id}>
                  <TableCell><Badge variant="secondary">Student</Badge></TableCell>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">{s.username}</TableCell>
                  <TableCell className="font-mono text-xs">{s.password}</TableCell>
                </TableRow>
              ))}
              {parents.map((p: Parent) => (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline">Parent</Badge></TableCell>
                  <TableCell>{p.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">{p.username}</TableCell>
                  <TableCell className="font-mono text-xs">{p.password}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
      <Icon className="w-10 h-10 mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
