import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Ignore error to keep generic response
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desk p-6">
      <div className="w-full max-w-[440px] bg-cell border-[1.5px] border-double border-ink p-9 rounded shadow-lg">
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-primary-container text-white inline-flex items-center justify-center rounded mx-auto mb-3">
            <KeyRound size={24} />
          </div>
          <h1 className="font-serif text-[22px] font-medium text-ink">Password Recovery Request</h1>
          <p className="text-xs text-secondary mt-1">
            Request a 6-digit numeric verification OTP code.
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="inline-flex bg-emerald-50 border border-emerald-300 text-primary-container p-4 rounded mb-5 items-center gap-2">
              <CheckCircle2 size={20} />
              <span className="text-xs text-left">
                If an account with that email exists, password reset instructions and a 6-digit OTP have been dispatched.
              </span>
            </div>

            <button
              onClick={() => navigate('/verify-otp', { state: { email } })}
              className="w-full font-sans text-xs font-semibold p-3 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all"
            >
              <span>Proceed to Verify 6-Digit OTP</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">Registered Email Address</label>
              <input
                type="email"
                className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@recordvault.internal"
                required
              />
            </div>

            <button type="submit" className="w-full font-sans text-xs font-semibold p-3 mt-3 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50" disabled={loading}>
              <span>{loading ? 'Processing Request...' : 'Send Recovery OTP Code'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="border-t border-hairline mt-6 pt-4 text-center text-xs">
          <Link to="/login" className="text-primary-container font-semibold no-underline hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
