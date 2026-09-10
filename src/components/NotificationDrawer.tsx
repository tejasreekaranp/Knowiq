import React from 'react';
import { X, Bell, Sparkles, Clock, Flame, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { SmartNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  onActionClick: (notification: SmartNotification) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onActionClick,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 font-display">Adaptive Notifications</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((n) => {
            const isMorning = n.timeOfDay === 'morning';
            const isAfternoon = n.timeOfDay === 'afternoon';
            const isEvening = n.timeOfDay === 'evening';

            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all space-y-2 ${
                  !n.isRead
                    ? 'bg-indigo-50/30 border-indigo-200 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {isMorning && <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />}
                    {isAfternoon && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                    {isEvening && <Flame className="w-4 h-4 text-rose-500 shrink-0" />}
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {n.message}
                </p>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onActionClick(n)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <span>{n.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400">
          Smart alerts trigger based on study patterns and memory retention decay.
        </div>
      </div>
    </div>
  );
};
