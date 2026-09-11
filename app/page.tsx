'use client';

import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Users, BookOpen, Calendar, BarChart3, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/components/providers';
import { t } from '@/lib/i18n';
import Link from 'next/link';

export default function LandingPage() {
  const { lang } = useLang();

  const features = [
    { icon: Users, title: lang === 'uz' ? 'O\'qituvchilar va O\'quvchilar' : 'Учителя и Ученики', desc: lang === 'uz' ? 'Barcha foydalanuvchilarni bitta joyda boshqaring' : 'Управляйте всеми пользователями в одном месте' },
    { icon: Calendar, title: lang === 'uz' ? 'Dars Jadvali' : 'Расписание', desc: lang === 'uz' ? 'Avtomatik dars jadvali va davomat tizimi' : 'Автоматическое расписание и система посещаемости' },
    { icon: BarChart3, title: lang === 'uz' ? 'Tahlil va Hisobotlar' : 'Аналитика и Отчёты', desc: lang === 'uz' ? 'Xavf ostidagi o\'quvchilarni aniqlang' : 'Выявляйте учащихся из группы риска' },
    { icon: Bell, title: lang === 'uz' ? 'Push Bildirishnomalar' : 'Push-уведомления', desc: lang === 'uz' ? 'Ota-onalar uchun haqiqiy vaqt bildirishnomalari' : 'Мгновенные уведомления для родителей' },
    { icon: BookOpen, title: lang === 'uz' ? 'Elektron Baholar' : 'Электронный журнал', desc: lang === 'uz' ? 'Baholar va uy vazifalarini onlayn boshqaring' : 'Управляйте оценками и заданиями онлайн' },
    { icon: Globe, title: lang === 'uz' ? 'Ko\'p tilli' : 'Многоязычность', desc: lang === 'uz' ? 'O\'zbek va Rus tillarida ishlaydi' : 'Работает на узбекском и русском' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">A7 School</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">{t(lang, 'pricing')}</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">{t(lang, 'login')}<ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.15] dark:opacity-[0.05]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {lang === 'uz' ? 'Yangi: Dars yakuni bildirishnomasi' : 'Новое: Уведомление об окончании урока'}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-4xl mx-auto leading-[1.1]">
              {lang === 'uz' ? 'Maktabingizni raqamli boshqaring' : 'Управляйте школой цифровым образом'}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              {lang === 'uz'
                ? 'A7 School — direktorlar, o\'qituvchilar, o\'quvchilar va ota-onalar uchun yagona platforma. Davomat, baholar, jadval va bildirishnomalar bir joyda.'
                : 'A7 School — единая платформа для директоров, учителей, учеников и родителей. Посещаемость, оценки, расписание и уведомления в одном месте.'}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base">
                  {t(lang, 'login')} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  {t(lang, 'pricing')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="relative rounded-3xl bg-gradient-to-r from-primary to-sky-600 p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-dot opacity-10" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {lang === 'uz' ? 'Bugun boshlang' : 'Начните сегодня'}
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              {lang === 'uz'
                ? 'Maktabingizni ro\'yxatdan o\'tkazing va raqamli boshqaruvni joriy qiling'
                : 'Зарегистрируйте свою школу и внедрите цифровое управление'}
            </p>
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base bg-white text-primary hover:bg-white/90"
                onClick={(event) => {
                  event.preventDefault();
                  const message = "Assalomu alaykum! Men School Edu maktabimga o'quvchilarimni qo'shmoqchi edim. A7 School platformasi haqida ma'lumot bera olasizmi?";
                  window.location.href = `https://t.me/nematovv_a7?text=${encodeURIComponent(message)}`;
                }}
              >
                {t(lang, 'login')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">A7 School</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 A7 School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
