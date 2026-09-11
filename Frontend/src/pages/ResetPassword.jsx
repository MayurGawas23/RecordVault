import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { PasswordInput } from '../components/PasswordInput';
import { Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email] = useState(location.state?.email || '');
  const [otp] = useState(location.state?.otp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desk p-6">
      <div className="w-full max-w-[440px] bg-cell border-[1.5px] border-double border-ink p-9 rounded shadow-lg">
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-container text-white inline-flex items-center justify-center rounded mx-auto mb-3">
            <Lock size={24} />
          </div>
          <h1 className="font-serif text-[22px] font-medium text-ink">Set New Password</h1>
          <p className="text-xs text-secondary mt-1">
            Updating credentials for account: <strong className="text-ink">{email}</strong>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-stamp-red p-3 rounded mb-4 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="inline-flex bg-emerald-50 border border-emerald-300 text-primary-container p-4 rounded mb-5 items-center gap-2">
              <CheckCircle size={20} />
              <span className="text-xs text-left">
                Your password has been reset successfully. All existing active sessions have been invalidated.
              </span>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full font-sans text-xs font-semibold p-3 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all"
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">New Password *</label>
              <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="8+ chars, upper, lower, number, special char"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink">Confirm New Password *</label>
              <PasswordInput
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
              />
            </div>

            <button type="submit" className="w-full font-sans text-xs font-semibold p-3 mt-3 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50" disabled={loading}>
              <span>{loading ? 'Updating Password...' : 'Update Password & Invalidate Sessions'}</span>
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
