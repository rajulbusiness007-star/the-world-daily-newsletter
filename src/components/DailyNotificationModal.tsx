import React, { useState } from 'react';
import { 
  Bell, BellRing, BellOff, Clock, CheckCircle2, AlertCircle, 
  Send, X, Sparkles, Radio, Check, Globe, ShieldCheck
} from 'lucide-react';
import { NotificationTopic } from '../hooks/useDailyNotifications.js';

interface DailyNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermission | 'unsupported';
  isEnabled: boolean;
  scheduledTime: string;
  topics: NotificationTopic[];
  onRequestPermission: () => Promise<boolean>;
  onDisable: () => void;
  onSetScheduledTime: (time: string) => void;
  onToggleTopic: (topic: NotificationTopic) => void;
  onSendTest: () => Promise<boolean>;
}

export const DailyNotificationModal: React.FC<DailyNotificationModalProps> = ({
  isOpen,
  onClose,
  permission,
  isEnabled,
  scheduledTime,
  topics,
  onRequestPermission,
  onDisable,
  onSetScheduledTime,
  onToggleTopic,
  onSendTest
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestStatus('sending');
    const ok = await onSendTest();
    if (ok) {
      setTestStatus('sent');
      setTimeout(() => setTestStatus('idle'), 3500);
    } else {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3500);
    }
  };

  const TIME_OPTIONS = [
    { value: '06:30', label: '06:30 AM IST', note: 'Recommended · Fresh Morning Edition' },
    { value: '07:00', label: '07:00 AM IST', note: 'Early Morning Digest' },
    { value: '08:00', label: '08:00 AM IST', note: 'Breakfast Briefing' },
    { value: '09:00', label: '09:00 AM IST', note: 'Workday Kickoff' }
  ];

  const TOPIC_OPTIONS: { id: NotificationTopic; label: string; flag: string; desc: string }[] = [
    { id: 'top10', label: 'Section A: India Top 10 News', flag: '🇮🇳', desc: 'National priority dispatches from The Indian Express & The Hindu' },
    { id: 'ai', label: 'AI News & Technology Desk', flag: '🤖', desc: 'Frontier models, AI regulatory treaties & semiconductor updates' },
    { id: 'world', label: 'World & International Affairs', flag: '🌍', desc: 'Global dispatches from BBC News, CNN & Al Jazeera' },
    { id: 'economy', label: 'Economy & Business Trends', flag: '📊', desc: 'Central banks, tax receipts & market indicators from Reuters' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#fbf9f5] dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-sm w-full max-w-xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/70 dark:bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-stone-950 dark:text-stone-50 leading-tight">
                Daily Morning Briefing Notifications
              </h3>
              <p className="text-[11px] text-stone-500 font-sans">
                Stay updated every day at 06:30 AM IST with verified news
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans text-xs">
          {/* Permission Status Banner */}
          <div className={`p-4 rounded-sm border flex items-start gap-3 ${
            permission === 'denied'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
              : isEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="shrink-0 mt-0.5">
              {permission === 'denied' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : isEnabled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BellOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="font-bold flex items-center justify-between">
                <span>
                  {permission === 'denied'
                    ? 'Notifications are blocked in your browser'
                    : isEnabled
                    ? 'Daily Briefing Alerts are Active'
                    : 'Daily Notifications are Disabled'}
                </span>
                {isEnabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 uppercase font-mono font-bold">
                    Scheduled: {scheduledTime} IST
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {permission === 'denied'
                  ? 'Your browser has blocked notifications for this site. Click the padlock icon in the browser address bar, set Notifications to "Allow", and reload.'
                  : isEnabled
                  ? `Every day when the morning edition drops at ${scheduledTime} IST, you will receive a clean notification with today's verified headlines.`
                  : 'Turn on daily notifications to receive a curated morning summary directly on your device without opening the app.'}
              </p>
            </div>
          </div>

          {/* Master Enable / Disable Toggle Action */}
          <div className="p-4 rounded-sm bg-stone-100/70 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Daily Morning Alert
              </div>
              <p className="text-stone-500 text-[11px]">
                Receive the morning briefing headline digest once per day
              </p>
            </div>

            <div>
              {isEnabled ? (
                <button
                  onClick={onDisable}
                  className="px-3 py-1.5 rounded-md font-semibold bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  Turn Off
                </button>
              ) : (
                <button
                  onClick={onRequestPermission}
                  className="px-4 py-1.5 rounded-md font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Enable Notifications</span>
                </button>
              )}
            </div>
          </div>

          {/* Scheduled Delivery Time Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Delivery Time (IST Asia/Kolkata)
              </span>
              <span className="text-[11px] text-stone-400">Timezone: Asia/Kolkata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TIME_OPTIONS.map(opt => {
                const isSelected = scheduledTime === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSetScheduledTime(opt.value)}
                    className={`p-3 rounded-sm border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 ring-1 ring-blue-500 text-blue-950 dark:text-blue-100 font-bold'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5">
                      {opt.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Topics Covered */}
          <div className="space-y-3">
            <span className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block">
              Included Topics & Briefing Sections
            </span>

            <div className="space-y-2">
              {TOPIC_OPTIONS.map(top => {
                const isChecked = topics.includes(top.id);
                return (
                  <div
                    key={top.id}
                    onClick={() => onToggleTopic(top.id)}
                    className="p-2.5 rounded-sm border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/40 flex items-center justify-between gap-3 cursor-pointer hover:border-stone-400 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span>{top.flag}</span>
                        <span>{top.label}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {top.desc}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleTopic(top.id)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Newsrooms Notice */}
          <div className="p-3 rounded-sm bg-stone-100/60 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              All notifications are sourced directly from your connected newsrooms: <strong>The Indian Express</strong>, <strong>BBC News</strong>, <strong>CNN</strong>, <strong>Al Jazeera</strong>, <strong>The Hindu</strong> & <strong>Reuters</strong>.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-950 flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
          <div>
            <button
              onClick={handleTest}
              disabled={testStatus === 'sending'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-sm bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              title="Trigger a live sample notification in your browser right now"
            >
              <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                {testStatus === 'sending' 
                  ? 'Sending...' 
                  : testStatus === 'sent' 
                  ? '✓ Test Alert Sent!' 
                  : testStatus === 'error'
                  ? 'Permission Required'
                  : 'Send Test Notification'}
              </span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded-sm bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
