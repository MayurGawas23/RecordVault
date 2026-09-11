import React, { useState, useEffect } from 'react';
import { Lock, Clock } from 'lucide-react';

export const LockoutCountdown = ({ initialSeconds = 900, lockoutUntil, message, onExpire }) => {
  const calculateSecondsLeft = () => {
    if (lockoutUntil) {
      const diff = Math.ceil((new Date(lockoutUntil).getTime() - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return typeof initialSeconds === 'number' ? Math.max(0, initialSeconds) : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateSecondsLeft);

  useEffect(() => {
    setSecondsLeft(calculateSecondsLeft());
  }, [initialSeconds, lockoutUntil]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (secondsLeft <= 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-300 text-primary-container p-3 rounded mb-5 text-xs flex items-center gap-2">
        <Clock size={16} />
        <span>Security lockout timer expired. You can now try signing in again.</span>
      </div>
    );
  }

  const displayMessage = message ? message : 'Too many login attempts from this IP address. Please try again after 15 minutes.';

  return (
    <div className="bg-red-50 border border-red-200 text-stamp-red p-3.5 rounded mb-5">
      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stamp-red mb-1">
        <Lock size={14} />
        <span>ACCOUNT TEMPORARILY LOCKED OUT</span>
      </div>
      <p className="text-xs m-0 text-red-800 flex items-center justify-between gap-2">
        <span>{displayMessage}</span>
        <span className="font-tnum font-bold bg-cell border border-red-200 px-2 py-0.5 rounded text-stamp-red whitespace-nowrap">
          ⏱️ {formatTime(secondsLeft)}
        </span>
      </p>
    </div>
  );
};
