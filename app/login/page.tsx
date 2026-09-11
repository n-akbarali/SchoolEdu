'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, User as UserIcon, ArrowLeft, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useLang } from '@/components/providers';
import { t } from '@/lib/i18n';
import { db } from '@/lib/db';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [schoolCount, setSchoolCount] = useState(0);

  useEffect(() => {
    setSchoolCount(db.schools.getAll().length);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'superadmin') router.push('/superadmin');
      else if (user.role === 'director') router.push('/dashboard/director');
      else if (user.role === 'teacher') router.push('/dashboard/teacher');
      else if (user.role === 'parent') router.push('/dashboard/parent');
    }
  }, [user, loading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const ok = login(username.trim(), password);
    if (!ok) {
      setError(t(lang, 'invalidCredentials'));
      setSubmitting(false);
    }
    // If ok, the useEffect will redirect
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-primary to-sky-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-sky-300/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">A7 School</span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              {lang === 'uz' ? 'Maktab boshqaruvi tizimiga xush kelibsiz' : 'Добро пожаловать в систему управления школой'}
            </h1>
            <p className="text-white/70 text-lg">
              {lang === 'uz'
                ? 'Direktorlar, o\'qituvchilar, o\'quvchilar va ota-onalar uchun yagona platforma.'
                : 'Единая платформа для директоров, учителей, учеников и родителей.'}
            </p>
            <div className="mt-12 space-y-4">
              {[
                lang === 'uz' ? 'Davomat va baholar avtomatlashtirilgan' : 'Посещаемость и оценки автоматизированы',
                lang === 'uz' ? 'Real vaqt bildirishnomalari' : 'Уведомления в реальном времени',
                lang === 'uz' ? 'Xavf ostidagi o\'quvchilar tahlili' : 'Анализ учащихся из группы риска',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-white/90">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/60">
            <span>© 2026 A7 School</span>
            <span>•</span>
            <span>{schoolCount} {lang === 'uz' ? 'maktab ulangan' : 'школ подключено'}</span>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background relative">
        {/* Lang switcher */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setLang('uz')}
            className={`text-sm font-medium px-2 py-1 rounded ${lang === 'uz' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            UZ
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => setLang('ru')}
            className={`text-sm font-medium px-2 py-1 rounded ${lang === 'ru' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            RU
          </button>
        </div>

        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" /> A7 School
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="lg:hidden w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-6">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight">{t(lang, 'welcomeBack')}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {lang === 'uz' ? 'Davom etish uchun tizimga kiring' : 'Войдите, чтобы продолжить'}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">{t(lang, 'username')}</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t(lang, 'username')}
                    className="pl-10"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t(lang, 'password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t(lang, 'password')}
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={submitting || !username || !password}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {lang === 'uz' ? 'Kirilmoqda...' : 'Вход...'}
                  </span>
                ) : (
                  t(lang, 'login')
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">
                {t(lang, 'pricing')} →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
