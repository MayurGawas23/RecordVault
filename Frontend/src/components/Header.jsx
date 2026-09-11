import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Code2 } from 'lucide-react';

export const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-surface border-b border-hairline px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-container text-white flex items-center justify-center rounded font-serif font-bold">
          <Code2 size={20} color="#ffffff" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">RecordVault</h1>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-folio px-3 py-1.5 border border-hairline rounded">
            <UserIcon size={14} className="text-primary-container" />
            <span className="text-xs font-semibold text-ink">{user.name}</span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-1 py-0.5 rounded-sm font-sans text-[9px] font-bold uppercase tracking-wider text-[#755b00] bg-[#fffdf5] border border-[#c9a227]">
                 ADMIN
              </span>
            )}
          </div>

          <button onClick={handleLogout} className="font-sans text-xs font-semibold px-3 py-1.5 bg-cell text-ink border border-hairline hover:bg-folio hover:border-ink rounded cursor-pointer inline-flex items-center justify-center gap-2 transition-all">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
