import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';
import { LockoutCountdown } from '../components/LockoutCountdown';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      setLockoutInfo(null);
      navigate('/');
    } catch (err) {
      const respData = err.response?.data;
      const status = err.response?.status;
      const errorMsg = respData?.error || respData?.message || '';

      if (status === 429 || status === 423 || respData?.remainingSeconds || respData?.lockoutUntil || errorMsg.includes('Too many login attempts')) {
        setLockoutInfo({
          remainingSeconds: respData?.remainingSeconds || 15 * 60,
          lockoutUntil: respData?.lockoutUntil || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          message: errorMsg || 'Too many login attempts from this IP address. Please try again after 15 minutes.'
        });
        setError(null);
      } else {
        const networkErr = err.message ? `Connection error (${err.message}). Verify backend URL & server status.` : null;
        setError(errorMsg || networkErr || 'Authentication failed. Please check credentials.');
      }
    }
  };

  const handleLockoutExpire = () => {
    setLockoutInfo(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desk p-6">
      <div className="w-full max-w-[440px] bg-cell border-[1.5px] border-double border-ink p-9 rounded shadow-lg">
        
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-primary-container text-white inline-flex items-center justify-center rounded font-serif text-2xl font-bold mb-3">
            RV
          </div>
          <h1 className="font-serif text-[22px] font-medium text-ink">RecordVault</h1>
          <p className="text-xs text-secondary uppercase tracking-wider mt-1">
           Sign In
          </p>
        </div>

        {lockoutInfo ? (
          <LockoutCountdown
            initialSeconds={lockoutInfo.remainingSeconds}
            lockoutUntil={lockoutInfo.lockoutUntil}
            message={lockoutInfo.message}
            onExpire={handleLockoutExpire}
          />
        ) : error ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-stamp-red p-3 rounded mb-5 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Email Address</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="officer@recordvault.internal"
              required
              disabled={!!lockoutInfo}
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">Account Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-container font-semibold no-underline hover:underline">
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full font-sans text-xs font-semibold p-3 mt-3 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            disabled={loading || !!lockoutInfo}
          >
            <span>{loading ? 'Authenticating...' : lockoutInfo ? 'Account Locked' : 'Sign In '}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="border-t border-hairline mt-6 pt-4 text-center text-xs text-secondary">
          Don't have a account?{' '}
          <Link to="/register" className="text-primary-container font-semibold no-underline hover:underline">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
};
