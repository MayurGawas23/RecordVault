import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';
import { AlertCircle, UserPlus } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Check server requirements.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-desk p-6">
      <div className="w-full max-w-[440px] bg-cell border-[1.5px] border-double border-ink p-9 rounded shadow-lg">
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-primary-container text-white inline-flex items-center justify-center rounded font-serif text-2xl font-bold mb-3">
            RV
          </div>
          <h1 className="font-serif text-[22px] font-medium text-ink">Register</h1>
          <p className="text-xs text-secondary uppercase tracking-wider mt-1">
            Create User
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-stamp-red p-3 rounded mb-5 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Full Name *</label>
            <input
              type="text"
              className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Email Address *</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 bg-cell border border-hairline rounded font-sans text-sm text-ink outline-none focus:border-[1.5px] focus:border-ink"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane.doe@recordvault.internal"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">Account Password *</label>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8+ chars, upper, lower, number, special char"
              required
            />
            <p className="text-[11px] text-secondary mt-1">
              Note: Must contain uppercase, lowercase, digit & special character (!@#$).
            </p>
          </div>

          <button
            type="submit"
            className="w-full font-sans text-xs font-semibold p-3 mt-3 bg-primary-container text-white border border-primary-container hover:bg-primary rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            disabled={loading}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
          </button>
        </form>

        <div className="border-t border-hairline mt-6 pt-4 text-center text-xs text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-container font-semibold no-underline hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
