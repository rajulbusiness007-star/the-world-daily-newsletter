import { useState, useEffect, useCallback } from 'react';
import { DailyEdition } from '../types.js';

export type AutoUpdateCadence = 'daily' | '15m' | '30m' | '60m';

interface UseAutoUpdateOptions {
  currentEditionDate?: string;
  onNewEditionFound?: (edition: DailyEdition) => void;
  onRefreshCompleted?: () => void;
}

export function useAutoUpdate({
  currentEditionDate,
  onNewEditionFound,
  onRefreshCompleted
}: UseAutoUpdateOptions = {}) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('twd_auto_update_enabled');
      return stored !== 'false'; // Default to true (always auto-update)
    } catch {
      return true;
    }
  });

  const [cadence, setCadenceState] = useState<AutoUpdateCadence>(() => {
    try {
      const stored = localStorage.getItem('twd_auto_update_cadence');
      if (stored === '15m' || stored === '30m' || stored === '60m' || stored === 'daily') {
        return stored;
      }
    } catch {}
    return 'daily';
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<string>(() => new Date().toISOString());
  const [nextUpdateText, setNextUpdateText] = useState<string>('');

  // Save preferences
  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    try {
      localStorage.setItem('twd_auto_update_enabled', String(enabled));
    } catch {}
  };

  const setCadence = (newCadence: AutoUpdateCadence) => {
    setCadenceState(newCadence);
    try {
      localStorage.setItem('twd_auto_update_cadence', newCadence);
    } catch {}
  };

  // Compute next 06:30 AM IST time
  const calculateNext0630IST = useCallback(() => {
    const now = new Date();
    // Get current date parts in Asia/Kolkata
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    // Create tomorrow 06:30 AM IST target
    const parts = formatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    parts.forEach(p => { partMap[p.type] = p.value; });

    const currentHour = parseInt(partMap.hour, 10);
    const currentMinute = parseInt(partMap.minute, 10);

    const isBeforeToday630 = (currentHour < 6) || (currentHour === 6 && currentMinute < 30);
    if (isBeforeToday630) {
      return 'Today at 06:30 AM IST';
    } else {
      return 'Tomorrow at 06:30 AM IST';
    }
  }, []);

  useEffect(() => {
    setNextUpdateText(calculateNext0630IST());
    const interval = setInterval(() => {
      setNextUpdateText(calculateNext0630IST());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [calculateNext0630IST]);

  // Check for newly published edition
  const checkForUpdates = useCallback(async (isSilent = true) => {
    if (!isEnabled) return;
    setIsChecking(true);
    setLastChecked(new Date().toISOString());

    try {
      // Fetch latest edition from API or static public bundle with cache-busting timestamp
      const timestamp = Date.now();
      let newEdition: DailyEdition | null = null;

      try {
        const res = await fetch(`/api/newsletter/today?_t=${timestamp}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          newEdition = await res.json();
        }
      } catch (apiErr) {
        // Fallback to static news_db.json
        const staticRes = await fetch(`/data/news_db.json?_t=${timestamp}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (staticRes.ok) {
          const db = await staticRes.json();
          const editionKeys = Object.keys(db.editions || {}).sort().reverse();
          if (editionKeys.length > 0) {
            newEdition = db.editions[editionKeys[0]];
          }
        }
      }

      if (newEdition && newEdition.formattedDate) {
        if (!currentEditionDate || newEdition.formattedDate !== currentEditionDate) {
          console.log(`[AutoUpdate] Found newly updated edition (${newEdition.formattedDate}). Updating view automatically...`);
          if (onNewEditionFound) {
            onNewEditionFound(newEdition);
          }
        }
      }

      if (onRefreshCompleted) {
        onRefreshCompleted();
      }
    } catch (err) {
      console.warn('[AutoUpdate] Background check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, [isEnabled, currentEditionDate, onNewEditionFound, onRefreshCompleted]);

  // Periodic interval check
  useEffect(() => {
    if (!isEnabled) return;

    let intervalMs = 60 * 60 * 1000; // default 1 hour
    if (cadence === '15m') intervalMs = 15 * 60 * 1000;
    else if (cadence === '30m') intervalMs = 30 * 60 * 1000;
    else if (cadence === 'daily') intervalMs = 30 * 60 * 1000; // check twice an hour

    const timer = setInterval(() => {
      checkForUpdates(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isEnabled, cadence, checkForUpdates]);

  // Auto-check on tab visibility change (e.g. user returns to the tab after hours)
  useEffect(() => {
    if (!isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const diffMs = Date.now() - new Date(lastChecked).getTime();
        // If more than 10 minutes have passed since last check, silently re-check
        if (diffMs > 10 * 60 * 1000) {
          checkForUpdates(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isEnabled, lastChecked, checkForUpdates]);

  return {
    isEnabled,
    setEnabled,
    cadence,
    setCadence,
    isChecking,
    lastChecked,
    nextUpdateText,
    checkForUpdates
  };
}
