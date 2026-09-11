'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, DollarSign, Users, Plus, Trash2, KeyRound,
  CheckCircle2, School as SchoolIcon, TrendingUp, ArrowRight, ArrowLeft, X,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import { DashboardShell } from '@/components/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useLang } from '@/components/providers';
import { db } from '@/lib/db';
import { PLANS, getPlanForStudents, formatUZS, calculateMonthlyCost } from '@/lib/pricing';
import type { School, Plan } from '@/lib/types';
// SchoolIcon is the lucide icon; School is the type

export default function SuperadminPage() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('overview');
  const [schools, setSchools] = useState<School[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSchools(db.schools.getAll());
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const navItems = [
    { label: lang === 'uz' ? 'Umumiy' : 'Обзор', icon: TrendingUp, value: 'overview' },
    { label: lang === 'uz' ? 'Maktablar' : 'Школы', icon: Building2, value: 'schools' },
    { label: lang === 'uz' ? 'Daromad' : 'Доход', icon: DollarSign, value: 'revenue' },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="superadmin"
    >
      {activeTab === 'overview' && <Overview schools={schools} lang={lang} />}
      {activeTab === 'schools' && (
        <SchoolsList schools={schools} lang={lang} onAdd={() => setWizardOpen(true)} onDelete={refresh} />
      )}
      {activeTab === 'revenue' && <Revenue schools={schools} lang={lang} />}

      <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} onComplete={refresh} lang={lang} />
    </DashboardShell>
  );
}

function Overview({ schools, lang }: { schools: School[]; lang: 'uz' | 'ru' }) {
  const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0);
  const totalRevenue = schools.reduce((sum, s) => sum + calculateMonthlyCost(s.studentCount), 0);

  const stats = [
    {
      label: lang === 'uz' ? 'Maktablar' : 'Школы',
      value: schools.length.toString(),
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: lang === 'uz' ? 'Jami o\'quvchilar' : 'Всего учеников',
      value: totalStudents.toString(),
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: lang === 'uz' ? 'Oylik daromad' : 'Ежемесячный доход',
      value: formatUZS(totalRevenue),
      icon: DollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  const planDistribution = PLANS.map((p) => ({
    name: p.name,
    value: schools.filter((s) => s.plan === p.id).length,
    color: p.color,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Boshqaruv paneli' : 'Панель управления'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'uz' ? 'Tizimdagi barcha maktablar va daromad' : 'Все школы и доход в системе'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {planDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'uz' ? 'Tarif taqsimoti' : 'Распределение тарифов'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                    {planDistribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {planDistribution.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-sm">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {schools.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <SchoolIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {lang === 'uz' ? 'Hozircha maktablar yo\'q. Birinchi maktabni qo\'shing.' : 'Пока нет школ. Добавьте первую школу.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SchoolsList({ schools, lang, onAdd, onDelete }: {
  schools: School[]; lang: 'uz' | 'ru'; onAdd: () => void; onDelete: () => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;
    db.schools.remove(deleteId);
    db.teachers.getBySchool(deleteId).forEach((t) => db.teachers.remove(t.id));
    db.students.getBySchool(deleteId).forEach((s) => db.students.remove(s.id));
    db.parents.getBySchool(deleteId).forEach((p) => db.parents.remove(p.id));
    db.classes.getBySchool(deleteId).forEach((c) => db.classes.remove(c.id));
    db.subjects.getBySchool(deleteId).forEach((s) => db.subjects.remove(s.id));
    db.timetable.getBySchool(deleteId).forEach((t) => db.timetable.remove(t.id));
    db.attendance.getBySchool(deleteId).forEach((a) => db.attendance.remove(a.id));
    db.grades.getBySchool(deleteId).forEach((g) => db.grades.remove(g.id));
    db.homework.getBySchool(deleteId).forEach((h) => db.homework.remove(h.id));
    db.notifications.getBySchool(deleteId).forEach((n) => db.notifications.remove(n.id));
    setDeleteId(null);
    onDelete();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Maktablar' : 'Школы'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {schools.length} {lang === 'uz' ? 'maktab ro\'yxatga olingan' : 'школ зарегистрировано'}
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {lang === 'uz' ? 'Maktab qo\'shish' : 'Добавить школу'}
        </Button>
      </div>

      {schools.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <SchoolIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {lang === 'uz' ? 'Hozircha maktablar yo\'q' : 'Пока нет школ'}
            </p>
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {lang === 'uz' ? 'Birinchi maktabni qo\'shing' : 'Добавьте первую школу'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === 'uz' ? 'Maktab' : 'Школа'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Shahar' : 'Город'}</TableHead>
                <TableHead>{lang === 'uz' ? 'O\'quvchilar' : 'Ученики'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Tarif' : 'Тариф'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Direktor login' : 'Логин директора'}</TableHead>
                <TableHead>{lang === 'uz' ? 'Oylik' : 'Ежемесячно'}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.city}</TableCell>
                  <TableCell>{s.studentCount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.plan}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.directorUsername}</TableCell>
                  <TableCell className="tabular-nums">{formatUZS(calculateMonthlyCost(s.studentCount))}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'uz' ? 'Maktabni o\'chirish' : 'Удалить школу'}</DialogTitle>
            <DialogDescription>
              {lang === 'uz' ? 'Bu amal bekor qilinmaydi. Barcha ma\'lumotlar o\'chiriladi.' : 'Это действие необратимо. Все данные будут удалены.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{lang === 'uz' ? 'Bekor qilish' : 'Отмена'}</Button>
            <Button variant="destructive" onClick={handleDelete}>{lang === 'uz' ? 'O\'chirish' : 'Удалить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Revenue({ schools, lang }: { schools: School[]; lang: 'uz' | 'ru' }) {
  const totalMonthly = schools.reduce((sum, s) => sum + calculateMonthlyCost(s.studentCount), 0);
  const totalYearly = totalMonthly * 12;

  const chartData = schools.map((s) => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name,
    revenue: calculateMonthlyCost(s.studentCount),
    students: s.studentCount,
  }));

  const planData = PLANS.map((p) => ({
    name: p.name,
    revenue: schools.filter((s) => s.plan === p.id).length * p.monthlyPrice,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{lang === 'uz' ? 'Daromad tahlili' : 'Анализ доходов'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'uz' ? 'Barcha maktablardan tushum' : 'Доход от всех школ'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{lang === 'uz' ? 'Oylik daromad' : 'Ежемесячный доход'}</p>
            <p className="text-3xl font-bold mt-2 text-primary tabular-nums">{formatUZS(totalMonthly)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{lang === 'uz' ? 'Yillik daromad' : 'Годовой доход'}</p>
            <p className="text-3xl font-bold mt-2 text-success tabular-nums">{formatUZS(totalYearly)}</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'uz' ? 'Maktab bo\'yicha daromad' : 'Доход по школам'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatUZS(v)} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {planData.some((d) => d.revenue > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{lang === 'uz' ? 'Tarif bo\'yicha daromad' : 'Доход по тарифам'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={planData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatUZS(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OnboardingWizard({ open, onOpenChange, onComplete, lang }: {
  open: boolean; onOpenChange: (v: boolean) => void; onComplete: () => void; lang: 'uz' | 'ru';
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [studentCount, setStudentCount] = useState(100);
  const [directorUsername, setDirectorUsername] = useState('');
  const [directorPassword, setDirectorPassword] = useState('');
  const [error, setError] = useState('');

  const plan = getPlanForStudents(studentCount);
  const steps = lang === 'uz'
    ? ['Maktab ma\'lumotlari', 'Direktor hisobi', 'Tasdiqlash']
    : ['Данные школы', 'Аккаунт директора', 'Подтверждение'];

  const reset = () => {
    setStep(0);
    setName('');
    setCity('');
    setStudentCount(100);
    setDirectorUsername('');
    setDirectorPassword('');
    setError('');
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  };

  const next = () => {
    if (step === 0 && (!name.trim() || !city.trim())) {
      setError(lang === 'uz' ? 'Barcha maydonlarni to\'ldiring' : 'Заполните все поля');
      return;
    }
    if (step === 1 && (!directorUsername.trim() || directorPassword.length < 4)) {
      setError(lang === 'uz' ? 'Login va parol (4+ belgi) kiriting' : 'Введите логин и пароль (4+ символа)');
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, 2));
  };

  const submit = () => {
    db.schools.add({
      name,
      city,
      studentCount,
      plan: plan.id,
      directorUsername,
      directorPassword,
    } as Omit<School, 'id' | 'createdAt'>);
    handleClose(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang === 'uz' ? 'Yangi maktab qo\'shish' : 'Добавить новую школу'}</DialogTitle>
          <DialogDescription>
            {lang === 'uz' ? '3 bosqichli jarayon' : '3-этапный процесс'}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i <= step ? 'text-foreground' : 'text-muted-foreground'} hidden sm:block`}>{s}</span>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'Maktab nomi' : 'Название школы'}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SMS #1" />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'Shahar' : 'Город'}</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tashkent" />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'O\'quvchilar soni' : 'Количество учеников'}</Label>
                  <Input type="number" value={studentCount} onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))} />
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{plan.name}</Badge>
                    <span className="text-sm text-muted-foreground">{formatUZS(plan.monthlyPrice)}/mo</span>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'Direktor logini' : 'Логин директора'}</Label>
                  <Input value={directorUsername} onChange={(e) => setDirectorUsername(e.target.value)} placeholder="director1" />
                </div>
                <div className="space-y-2">
                  <Label>{lang === 'uz' ? 'Direktor paroli' : 'Пароль директора'}</Label>
                  <Input type="password" value={directorPassword} onChange={(e) => setDirectorPassword(e.target.value)} placeholder="••••••" />
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
                  <KeyRound className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {lang === 'uz'
                      ? 'Direktor bu ma\'lumotlar bilan tizimga kirib, o\'qituvchilar va ota-onalarni qo\'sha oladi'
                      : 'Директор сможет войти с этими данными и добавлять учителей и родителей'}
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground text-sm">{lang === 'uz' ? 'Maktab' : 'Школа'}</span><span className="font-medium">{name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-sm">{lang === 'uz' ? 'Shahar' : 'Город'}</span><span className="font-medium">{city}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-sm">{lang === 'uz' ? 'O\'quvchilar' : 'Ученики'}</span><span className="font-medium">{studentCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-sm">{lang === 'uz' ? 'Tarif' : 'Тариф'}</span><Badge variant="secondary">{plan.name}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-sm">{lang === 'uz' ? 'Oylik' : 'Ежемесячно'}</span><span className="font-medium">{formatUZS(plan.monthlyPrice)}</span></div>
                  <div className="border-t pt-2 mt-2"><span className="text-muted-foreground text-sm">{lang === 'uz' ? 'Direktor' : 'Директор'}</span><div className="font-mono text-sm mt-1">{directorUsername} / {directorPassword}</div></div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={() => { setStep((s) => s - 1); setError(''); }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {lang === 'uz' ? 'Orqaga' : 'Назад'}
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={next}>
              {lang === 'uz' ? 'Keyingi' : 'Далее'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={submit}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {lang === 'uz' ? 'Yaratish' : 'Создать'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
