import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { OTPInputWidget } from '../components/OTPInputWidget';
import apiClient from '../api/apiClient';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (code = otpCode) => {
    setError(null);
    if (!email) {
      setError('Please provide registered email address.');
      return;
    }
    if (!code || code.length !== 6) {
      setError('Please enter complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/verify-otp', { email, otp: code });
      navigate('/reset-password', { state: { email, otp: code } });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Generic resend error handled quietly
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desk p-6">
      <div className="w-full max-w-[440px] bg-cell border-[1.5px] border-double border-ink p-9 rounded shadow-lg">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-container text-white inline-flex items-center justify-center rounded mx-auto mb-3">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-serif text-[22px] font-medium text-ink">Verify 6-Digit OTP Code</h1>
          <p className="text-xs text-secondary mt-1">
            Enter verification code sent to your registered email.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-stamp-red p-3 rounded mb-4 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-ink">Email Address</label>
          <input
            type="email"
            className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="officer@recordvault.internal"
            required
          />
        </div>

        <OTPInputWidget
          length={6}
          onComplete={(code) => { setOtpCode(code); handleVerify(code); }}
          onResend={handleResend}
        />

        <button
          onClick={() => handleVerify()}
          className="w-full font-sans text-xs font-semibold p-3 mt-4 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          disabled={loading || otpCode.length !== 6}
        >
          <span>{loading ? 'Verifying Code...' : 'Verify OTP & Continue'}</span>
          <ArrowRight size={16} />
        </button>

        <div className="border-t border-hairline mt-6 pt-4 text-center text-xs">
          <Link to="/login" className="text-primary-container font-semibold no-underline hover:underline">
            Cancel & Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
