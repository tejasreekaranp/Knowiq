import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Database, GraduationCap, School } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login' }) => {
  const { login, signUp, error, clearError, isCloudConnected } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty'>('student');

  const activeError = localError || error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setLocalError('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setLocalError('Please enter a valid email address.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setLocalError('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp(fullName, email, password, confirmPassword, selectedRole);
        if (!res.success && res.error) {
          setLocalError(res.error);
        }
      } else {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setLocalError('Please enter a valid email address.');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setLocalError('Please enter your password.');
          setIsSubmitting(false);
          return;
        }

        const res = await login(email, password);
        if (!res.success && res.error) {
          setLocalError(res.error);
        }
      }
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Sparkles className="w-6 h-6 text-indigo-100" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-display">KnowIQ</span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              Adaptive Learning System
            </span>
          </div>
        </div>

        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
          {mode === 'login' ? 'Welcome back to your studies' : 'Create your KnowIQ account'}
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {mode === 'login'
            ? 'Sign in to access your personalized syllabus paths and clarity diagnostics.'
            : 'Start mastering complex subjects through adaptive 4-step clarity loops.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
                clearError();
              }}
              className={`flex-1 text-center pb-2 text-xs sm:text-sm font-semibold border-b-2 -mb-[1px] transition-colors ${
                mode === 'login'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setLocalError(null);
                clearError();
              }}
              className={`flex-1 text-center pb-2 text-xs sm:text-sm font-semibold border-b-2 -mb-[1px] transition-colors ${
                mode === 'signup'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert Box */}
          {activeError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{activeError}</div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearError();
                }}
                className="text-rose-500 hover:text-rose-800 font-bold ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Authentication Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Role Selection (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'student'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedRole === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Student</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Learning & study</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('faculty')}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'faculty'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedRole === 'faculty' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <School className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Faculty</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Educator & teaching</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {mode === 'signup' && (
                  <span className="text-[11px] text-slate-400">Min. 6 characters</span>
                )}
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{mode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <span>{mode === 'login' ? 'Sign In' : 'Complete Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Security badge */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>KnowIQ Learning Vault • Encrypted Student Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
