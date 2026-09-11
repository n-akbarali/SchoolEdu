'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Check, ArrowLeft, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLang } from '@/components/providers';
import { t } from '@/lib/i18n';
import { PLANS, getPlanForStudents, formatUZS, calculateMonthlyCost, calculateYearlyCost } from '@/lib/pricing';
import Link from 'next/link';

export default function PricingPage() {
  const { lang } = useLang();
  const [studentCount, setStudentCount] = useState(300);

  const plan = getPlanForStudents(studentCount);
  const monthly = calculateMonthlyCost(studentCount);
  const yearly = calculateYearlyCost(studentCount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">A7 School</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button size="sm">{t(lang, 'login')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="secondary" className="mb-4">
              <Calculator className="w-3 h-3 mr-1" />
              {lang === 'uz' ? 'Narx kalkulyatori' : 'Калькулятор цен'}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              {lang === 'uz' ? 'Maktabingiz uchun narxni hisoblang' : 'Рассчитайте цену для вашей школы'}
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-balance">
              {lang === 'uz'
                ? 'O\'quvchilar sonini tanlang va oylik/yillik to\'lovni ko\'ring'
                : 'Выберите количество учеников и увидите ежемесячную/годовую оплату'}
            </p>
          </motion.div>
        </div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t(lang, 'calculate')}
              </CardTitle>
              <CardDescription>
                {lang === 'uz' ? 'Slayderni siljiting' : 'Двигайте ползунок'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {/* Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">{t(lang, 'studentsCount')}</span>
                  <span className="text-2xl font-bold tabular-nums">{studentCount}</span>
                </div>
                <Slider
                  value={[studentCount]}
                  onValueChange={(v) => setStudentCount(v[0])}
                  min={1}
                  max={1500}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1</span>
                  <span>300</span>
                  <span>800</span>
                  <span>1500+</span>
                </div>
              </div>

              {/* Plan indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: plan.color }}
                />
                <span className="font-medium">{plan.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({plan.minStudents}–{plan.maxStudents === 1500 ? '1500+' : plan.maxStudents} {lang === 'uz' ? 'o\'quvchi' : 'учеников'})
                </span>
              </div>

              {/* Cost display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-6 text-center bg-primary/5">
                  <p className="text-sm text-muted-foreground mb-2">{t(lang, 'monthlyCost')}</p>
                  <p className="text-3xl font-bold text-primary tabular-nums">{formatUZS(monthly)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t(lang, 'perMonth')}</p>
                </div>
                <div className="rounded-xl border p-6 text-center bg-success/5">
                  <p className="text-sm text-muted-foreground mb-2">{t(lang, 'yearlyCost')}</p>
                  <p className="text-3xl font-bold text-success tabular-nums">{formatUZS(yearly)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t(lang, 'perYear')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p, i) => {
            const isActive = plan.id === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Card
                  className={`relative h-full transition-all ${
                    isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>{lang === 'uz' ? 'Joriy tarif' : 'Текущий тариф'}</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${p.color}20` }}>
                      <GraduationCap className="w-5 h-5" style={{ color: p.color }} />
                    </div>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription>
                      {p.minStudents}–{p.maxStudents === 1500 ? '1500+' : p.maxStudents} {lang === 'uz' ? 'o\'quvchi' : 'учеников'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{formatUZS(p.monthlyPrice)}</span>
                      <span className="text-sm text-muted-foreground ml-1">{t(lang, 'perMonth')}</span>
                    </div>
                    <ul className="space-y-3">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8">
              {t(lang, 'login')} →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
