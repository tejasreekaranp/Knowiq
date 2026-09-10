import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  Bell, 
  BookOpen, 
  Layers, 
  RotateCcw, 
  Award, 
  PlusCircle, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  FilePlus, 
  GraduationCap, 
  UserCheck, 
  ChevronDown,
  LogOut,
  User,
  Database
} from 'lucide-react';
import { Course } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentCourse: Course | null;
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  activeTab: 'home' | 'learn-space' | 'spaced-revision' | 'badges';
  setActiveTab: (tab: 'home' | 'learn-space' | 'spaced-revision' | 'badges') => void;
  userRole: 'student' | 'faculty';
  xp: number;
  streakDays: number;
  todayProgress: { completed: number; target: number };
  onOpenCreateCourse: () => void;
  onOpenEditCourse: () => void;
  onOpenAddSyllabus: () => void;
  onDeleteCourse: (courseId: string) => void;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCourse,
  courses,
  onSelectCourse,
  activeTab,
  setActiveTab,
  userRole,
  xp,
  streakDays,
  todayProgress,
  onOpenCreateCourse,
  onOpenEditCourse,
  onOpenAddSyllabus,
  onDeleteCourse,
  onToggleNotifications,
  unreadNotificationsCount,
}) => {
  const { user, profile, logout, isCloudConnected } = useAuth();
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [switchCourseOpen, setSwitchCourseOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const studentDisplayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Student');
  const userInitial = studentDisplayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => { setActiveTab('home'); }}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 font-display">KnowIQ</span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Adaptive Engine
                </span>
              </div>
            </div>

            {/* Course Selector Pill with 3-dot Menu (if current course exists) */}
            {userRole === 'student' && currentCourse && (
              <div className="relative ml-2 sm:ml-4 flex items-center bg-slate-100/90 hover:bg-slate-200/80 rounded-xl p-1 transition-colors">
                <button
                  onClick={() => setSwitchCourseOpen(!switchCourseOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-800"
                >
                  <span className="text-slate-500 font-normal hidden md:inline">Course:</span>
                  <span className="max-w-[120px] sm:max-w-[180px] truncate">{currentCourse.title}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Edit syllabus button */}
                <button
                  onClick={onOpenEditCourse}
                  className="hidden md:inline-flex items-center text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-indigo-50 transition-colors"
                >
                  [Edit Syllabus]
                </button>

                {/* 3-dot menu */}
                <div className="relative">
                  <button
                    onClick={() => setCourseMenuOpen(!courseMenuOpen)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                    title="Course Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {courseMenuOpen && (
                    <div 
                      className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                      onClick={() => setCourseMenuOpen(false)}
                    >
                      <button
                        onClick={onOpenEditCourse}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Course</span>
                      </button>
                      <button
                        onClick={onOpenAddSyllabus}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <FilePlus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add Syllabus Topic</span>
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${currentCourse.title}?`)) {
                            onDeleteCourse(currentCourse.id);
                          }
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Course</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Switch Course Dropdown */}
                {switchCourseOpen && (
                  <div 
                    className="absolute left-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100"
                    onClick={() => setSwitchCourseOpen(false)}
                  >
                    <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Course
                    </div>
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectCourse(c)}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between ${
                          c.id === currentCourse.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{c.title}</span>
                        {c.id === currentCourse.id && <span className="text-indigo-600">✓</span>}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={onOpenCreateCourse}
                        className="w-full text-left px-3.5 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold flex items-center space-x-2"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Create New Course</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {userRole === 'student' && !currentCourse && (
              <button
                onClick={onOpenCreateCourse}
                className="ml-3 hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Course</span>
              </button>
            )}
          </div>

          {/* Center Navigation Tabs (Student Mode) */}
          {userRole === 'student' ? (
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'home'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Today's Path</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('learn-space')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'learn-space'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Learning Space</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('spaced-revision')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'spaced-revision'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Spaced Revision</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('badges')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'badges'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Badges & Streaks</span>
                </div>
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
              <GraduationCap className="w-4 h-4 text-amber-600" />
              <span>Faculty Mode Active: Viewing Class Analytics & Telemetry</span>
            </div>
          )}

          {/* Right Metrics & Student Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {userRole === 'student' && (
              <>
                {/* 7-Day Streak Pill */}
                <div 
                  onClick={() => setActiveTab('badges')}
                  className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-700 cursor-pointer hover:bg-orange-100/70 transition-colors shadow-2xs"
                  title="Daily Streak"
                >
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="text-xs font-bold">{streakDays}d</span>
                </div>

                {/* XP Pill */}
                <div 
                  onClick={() => setActiveTab('badges')}
                  className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 cursor-pointer hover:bg-indigo-100/70 transition-colors shadow-2xs"
                  title="Total XP"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold">{xp.toLocaleString()} XP</span>
                </div>
              </>
            )}

            {/* Smart Notification Bell */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Smart Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Role Badge (Static, defined at sign up) */}
            <div
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border select-none ${
                userRole === 'faculty'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
              title={`Signed in as ${userRole === 'faculty' ? 'Faculty' : 'Student'}`}
            >
              {userRole === 'faculty' ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Faculty</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Student</span>
                </>
              )}
            </div>

            {/* User Profile Dropdown & Logout */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  {userInitial}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {profileMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {studentDisplayName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user?.email || 'Authenticated Student'}
                    </p>
                    <div className="mt-1 flex items-center space-x-1 text-[10px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{isCloudConnected ? 'Cloud Sync Active' : 'Secure Vault Active'}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => setActiveTab('badges')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Badges & Records</span>
                    </button>
                    <button
                      onClick={onOpenCreateCourse}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Create New Course</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={async () => {
                        await logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation for Student */}
      {userRole === 'student' && (
        <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50/50 space-x-2 text-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'home' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 bg-white border border-slate-200'
            }`}
          >
            Today's Path
          </button>
          <button
            onClick={() => setActiveTab('learn-space')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'learn-space' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 bg-white border border-slate-200'
            }`}
          >
            Learning Space
          </button>
          <button
            onClick={() => setActiveTab('spaced-revision')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'spaced-revision' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 bg-white border border-slate-200'
            }`}
          >
            Spaced Revision
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'badges' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 bg-white border border-slate-200'
            }`}
          >
            Badges & Streaks
          </button>
        </div>
      )}
    </header>
  );
};
