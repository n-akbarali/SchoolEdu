'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, LogOut, Globe, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useLang } from '@/components/providers';
import type { Role } from '@/lib/types';

interface NavItem {
  label: string;
  icon: any;
  value: string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: Role;
  schoolName?: string;
  children: ReactNode;
}

export function DashboardShell({
  navItems,
  activeTab,
  onTabChange,
  role,
  schoolName,
  children,
}: DashboardShellProps) {
  const { user, logout, loading } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== role)) {
      router.push('/login');
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const roleColors: Record<Role, string> = {
    superadmin: 'bg-amber-500',
    director: 'bg-primary',
    teacher: 'bg-success',
    parent: 'bg-violet-500',
  };

  const roleLabels: Record<Role, { uz: string; ru: string }> = {
    superadmin: { uz: 'Superadmin', ru: 'Суперадмин' },
    director: { uz: 'Direktor', ru: 'Директор' },
    teacher: { uz: 'O\'qituvchi', ru: 'Учитель' },
    parent: { uz: 'Ota-ona', ru: 'Родитель' },
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r border-border bg-card z-30">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold">A7 School</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Globe className="w-4 h-4" />
            <button onClick={() => setLang('uz')} className={lang === 'uz' ? 'text-primary font-medium' : ''}>UZ</button>
            <span>/</span>
            <button onClick={() => setLang('ru')} className={lang === 'ru' ? 'text-primary font-medium' : ''}>RU</button>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            {lang === 'uz' ? 'Chiqish' : 'Выйти'}
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-card border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">A7 School</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border">
                <span className="font-bold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => { onTabChange(item.value); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <button onClick={() => setLang('uz')} className={lang === 'uz' ? 'text-primary font-medium' : 'text-muted-foreground'}>UZ</button>
                  <span className="text-muted-foreground">/</span>
                  <button onClick={() => setLang('ru')} className={lang === 'ru' ? 'text-primary font-medium' : 'text-muted-foreground'}>RU</button>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {lang === 'uz' ? 'Chiqish' : 'Выйти'}
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b border-border bg-card sticky top-0 z-20">
          <div>
            {schoolName && <h2 className="font-semibold text-lg">{schoolName}</h2>}
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${roleColors[role]}`}>
              {roleLabels[role][lang]}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile top bar spacer */}
        <div className="h-14 lg:hidden" />

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
