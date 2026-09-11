import React, { useState, useEffect, useRef } from 'react';
import { Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export const OTPInputWidget = ({ length = 6, onComplete, onResend, ttlSeconds = 600 }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const [timeLeft, setTimeLeft] = useState(ttlSeconds);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for OTP TTL
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (index < length - 1 && newOtp[index]) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (newOtp.every(digit => digit !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleResendClick = () => {
    if (resendCooldown > 0) return;
    setOtp(Array(length).fill(''));
    setTimeLeft(ttlSeconds);
    setResendCooldown(60); // 60s cooldown between resends
    if (onResend) onResend();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isExpired = timeLeft <= 0;

  return (
    <div className="my-5">
      <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={isExpired}
            onChange={e => handleChange(e, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            className={`w-11 h-13 text-center text-6xl font-bold font-sans rounded outline-none ${
              isExpired ? 'bg-desk' : 'bg-cell'
            } ${
              digit ? 'border-2 border-primary-container' : 'border border-hairline'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-secondary">
        <div className="flex items-center gap-1">
          <Clock size={14} className={isExpired ? 'text-stamp-red' : 'text-primary-container'} />
          {isExpired ? (
            <span className="text-stamp-red font-semibold">Code Expired</span>
          ) : (
            <span className="font-tnum">Expires in: {formatTime(timeLeft)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleResendClick}
          disabled={resendCooldown > 0}
          className="font-sans text-[11px] font-semibold px-2 py-1 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-1 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} />
          {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
        </button>
      </div>

      {isExpired && (
        <div className="flex items-center gap-1.5 text-stamp-red text-xs mt-2">
          <AlertTriangle size={14} />
          <span>OTP code has expired. Please request a new verification code.</span>
        </div>
      )}
    </div>
  );
};
