import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Send, 
  BookOpen, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  Search, 
  Download, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { initialFacultyClasses } from '../data/mockData';
import { triggerConfetti } from '../utils/confetti';

export const FacultyView: React.FC = () => {
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const activeClass = initialFacultyClasses[selectedClassIndex] || initialFacultyClasses[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  const handleBroadcastRemediation = (weakTopic: string) => {
    setBroadcastMessage(`Remediation drill for "${weakTopic}" broadcast to all ${activeClass.studentCount} enrolled students!`);
    triggerConfetti();
    setTimeout(() => setBroadcastMessage(null), 4000);
  };

  const handleTriggerStudentDrill = (studentName: string, weakTopic: string) => {
    alert(`Personalized adaptive drill sent directly to ${studentName} targeting: ${weakTopic}!`);
  };

  const filteredStudents = activeClass.students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.weakTopic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-amber-600">
              <GraduationCap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Faculty Portal • Class Telemetry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display mt-1">
              Database Management Systems (CS-302)
            </h1>
            <p className="text-xs text-slate-500">
              {activeClass.name} • {activeClass.semester} • Live cognitive diagnostic sync
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Class Section:</span>
            <select 
              value={selectedClassIndex}
              onChange={(e) => setSelectedClassIndex(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {initialFacultyClasses.map((fc, idx) => (
                <option key={fc.id} value={idx}>{fc.name} ({fc.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Total Enrolled</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {activeClass.studentCount}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Class Avg Clarity</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
              {activeClass.averageClarity}%
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Syllabus Covered</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {activeClass.overallProgress}%
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>At-Risk Students</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
              {activeClass.students.filter(s => s.averageClarity < 70).length}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast alert if sent */}
      {broadcastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
          <span>✓ {broadcastMessage}</span>
          <button onClick={() => setBroadcastMessage(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Weak Topics in Syllabus Warning Box */}
      {activeClass.weakTopics && activeClass.weakTopics.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Weak Topics Detected by Clarity Engine</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                {activeClass.weakTopics[0].topic}
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl">
                {activeClass.weakTopics[0].issue} ({activeClass.weakTopics[0].affectedStudentsCount} students below mastery threshold).
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-center">
              <button
                onClick={() => handleBroadcastRemediation(activeClass.weakTopics[0].topic)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-rose-200 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Remediation Flashcard</span>
              </button>
            </div>
          </div>

          {/* Weak Topic Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {activeClass.weakTopics.map((wt, i) => (
              <div key={i} className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">{wt.topic}</span>
                  <span className="font-bold text-rose-600">{wt.clarity}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${wt.clarity}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between items-center">
                  <span>{wt.affectedStudentsCount} struggling</span>
                  <button
                    onClick={() => handleBroadcastRemediation(wt.topic)}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Drill →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">Student Roster & Diagnostic Telemetry</h3>
            <p className="text-xs text-slate-500">Track individual clarity scores, active streaks, and identified knowledge gaps.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or weak topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Syllabus Progress</th>
                <th className="px-4 py-3">Avg Clarity</th>
                <th className="px-4 py-3">Daily Streak</th>
                <th className="px-4 py-3">Identified Weak Area</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => {
                const isAtRisk = st.averageClarity < 70;

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center space-x-2.5">
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span>{st.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {st.email}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {st.progressPercent}%
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        isAtRisk
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {st.averageClarity}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      🔥 {st.streak} days
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        {st.weakTopic}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleTriggerStudentDrill(st.name, st.weakTopic)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        Push Drill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
