'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const supabase = createClient();

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      } else if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setInfoMsg('Account created! Please check your email or sign in below.');
        setIsLoading(false);
        setMode('signin');
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Budget Tracker 2026
          </h1>
          <p className="text-xs text-slate-400">
            Personal Finance & Allocation PWA
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'bg-emerald-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-emerald-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-100 bg-slate-950 placeholder:text-slate-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-100 bg-slate-950 placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-[0_0_16px_rgba(16,185,129,0.3)] cursor-pointer active:scale-[0.99]"
          >
            {isLoading
              ? mode === 'signin' ? 'Signing In...' : 'Creating Account...'
              : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </main>
  );
}
