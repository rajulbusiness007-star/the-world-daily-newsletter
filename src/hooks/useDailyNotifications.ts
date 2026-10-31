import { useState, useEffect, useCallback, useRef } from 'react';

export type NotificationTopic = 'top10' | 'ai' | 'world' | 'economy';

export interface NotificationSettings {
  isEnabled: boolean;
  scheduledTime: string; // e.g. "06:30" IST
  topics: NotificationTopic[];
  lastNotificationDate: string | null;
}

const STORAGE_KEY_ENABLED = 'twd_daily_notifications_enabled';
const STORAGE_KEY_TIME = 'twd_daily_notification_time';
const STORAGE_KEY_TOPICS = 'twd_daily_notification_topics';
const STORAGE_KEY_LAST_DATE = 'twd_last_daily_notification_date';

export function getTodayISTDateString(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  return new Intl.DateTimeFormat('en-CA', options).format(new Date());
}

export function getCurrentISTTime(): { hours: number; minutes: number } {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(new Date());
  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return { hours, minutes };
}

export function useDailyNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!isSupported) return 'unsupported';
    return Notification.permission;
  });

  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (!isSupported) return false;
    const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
    return stored === 'true' && Notification.permission === 'granted';
  });

  const [scheduledTime, setScheduledTimeState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TIME) || '06:30';
  });

  const [topics, setTopicsState] = useState<NotificationTopic[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TOPICS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['top10', 'ai', 'world', 'economy'];
  });

  const [lastNotificationDate, setLastNotificationDateState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_DATE);
  });

  const schedulerTimerRef = useRef<number | null>(null);

  // Sync state with Notification.permission changes
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      if (Notification.permission !== 'granted') {
        setIsEnabled(false);
      }
    }
  }, [isSupported]);

  // Dispatch a browser notification safely via ServiceWorker or fallback
  const dispatchBrowserNotification = useCallback(async (title: string, options: NotificationOptions & { renotify?: boolean; [key: string]: any }) => {
    if (!isSupported || Notification.permission !== 'granted') {
      console.warn('[Notification] Cannot dispatch: permission not granted.');
      return false;
    }

    try {
      // 1. Try Service Worker showNotification if active
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            ...options,
            icon: options.icon || '/assets/icon-192.png',
            badge: options.badge || '/assets/icon-192.png'
          });
          return true;
        }
      }

      // 2. Direct Window Notification fallback
      new Notification(title, {
        ...options,
        icon: options.icon || '/assets/icon-192.png'
      });
      return true;
    } catch (err) {
      console.error('[Notification] Failed to display notification:', err);
      return false;
    }
  }, [isSupported]);

  // Request permission & enable daily alerts
  const requestPermissionAndEnable = useCallback(async () => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported in this browser.');
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(STORAGE_KEY_ENABLED, 'true');

        // Welcome / confirmation alert
        await dispatchBrowserNotification('🔔 Daily Briefing Notifications Active', {
          body: `You will receive your verified morning briefing daily at ${scheduledTime} IST with dispatches from Indian Express, BBC News, CNN & Reuters.`,
          data: { url: '/#newsletter' },
          tag: 'twd-welcome'
        });
        return true;
      } else {
        setIsEnabled(false);
        localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
        return false;
      }
    } catch (err) {
      console.error('[Notification] Error requesting permission:', err);
      return false;
    }
  }, [isSupported, scheduledTime, dispatchBrowserNotification]);

  // Disable notifications
  const disableNotifications = useCallback(() => {
    setIsEnabled(false);
    localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
  }, []);

  // Set scheduled delivery time
  const setScheduledTime = useCallback((time: string) => {
    setScheduledTimeState(time);
    localStorage.setItem(STORAGE_KEY_TIME, time);
  }, []);

  // Toggle topic
  const toggleTopic = useCallback((topic: NotificationTopic) => {
    setTopicsState(prev => {
      const next = prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic];
      localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(next));
      return next;
    });
  }, []);

  // Send an instant test notification
  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') {
      const granted = await requestPermissionAndEnable();
      if (!granted) return false;
    }

    const ok = await dispatchBrowserNotification('🗞️ THE WORLD DAILY · Test Briefing', {
      body: `Daily alerts are working! Your morning briefing arrives daily at ${scheduledTime} IST with verified reports from The Indian Express, BBC News, CNN, Al Jazeera, The Hindu & Reuters.`,
      tag: 'twd-test-notification',
      data: { url: '/#newsletter' }
    });

    return ok;
  }, [permission, requestPermissionAndEnable, dispatchBrowserNotification, scheduledTime]);

  // Daily Scheduler: checks whether target time is reached
  useEffect(() => {
    if (!isEnabled || permission !== 'granted') {
      if (schedulerTimerRef.current) {
        window.clearInterval(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
      return;
    }

    const checkAndTriggerDailyAlert = () => {
      const todayIST = getTodayISTDateString();
      const lastSent = localStorage.getItem(STORAGE_KEY_LAST_DATE);

      // Already delivered for today
      if (lastSent === todayIST) return;

      const [schedH, schedM] = scheduledTime.split(':').map(n => parseInt(n, 10));
      const { hours: curH, minutes: curM } = getCurrentISTTime();

      // Check if current IST time is at or past the scheduled time
      const curTotalMinutes = curH * 60 + curM;
      const schedTotalMinutes = schedH * 60 + schedM;

      // Allow trigger if within 45 minutes past the target scheduled time today
      if (curTotalMinutes >= schedTotalMinutes && curTotalMinutes <= schedTotalMinutes + 45) {
        dispatchBrowserNotification("🗞️ Today's Daily Briefing is Ready! (06:30 AM IST)", {
          body: 'Your verified morning edition has been published. Read top stories from The Indian Express, BBC News, CNN, Al Jazeera & The Hindu.',
          data: { url: '/#newsletter', date: todayIST },
          tag: 'twd-daily-edition',
          renotify: true
        });

        localStorage.setItem(STORAGE_KEY_LAST_DATE, todayIST);
        setLastNotificationDateState(todayIST);
      }
    };

    // Check immediately on mount or setting update
    checkAndTriggerDailyAlert();

    // Check every 30 seconds
    const interval = window.setInterval(checkAndTriggerDailyAlert, 30000);
    schedulerTimerRef.current = interval;

    return () => {
      window.clearInterval(interval);
      schedulerTimerRef.current = null;
    };
  }, [isEnabled, permission, scheduledTime, dispatchBrowserNotification]);

  return {
    isSupported,
    permission,
    isEnabled,
    scheduledTime,
    topics,
    lastNotificationDate,
    requestPermissionAndEnable,
    disableNotifications,
    setScheduledTime,
    toggleTopic,
    sendTestNotification
  };
}
