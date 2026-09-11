import React from 'react';

// Generates a deterministic, harmonious background/border/text color for any custom role string
function getCustomRoleStyle(roleStr) {
  let hash = 0;
  for (let i = 0; i < roleStr.length; i++) {
    hash = roleStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    color: `hsl(${hue}, 70%, 30%)`,
    backgroundColor: `hsl(${hue}, 85%, 96%)`,
    border: `1.5px solid hsl(${hue}, 60%, 45%)`
  };
}

export const StampBadge = ({ status, role, text }) => {
  const normValue = (role || text || status || '').trim();
  const lowerVal = normValue.toLowerCase();

  const baseBadge = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] font-sans text-[11px] font-bold uppercase tracking-wider";

  // Role Badge Presets
  if (role) {
    if (lowerVal === 'admin') {
      return (
        <span className={`${baseBadge} text-[#755b00] bg-[#fffdf5] border-[1.5px] border-seal-brass`}>
          {text || 'ADMIN'}
        </span>
      );
    }
    return (
      <span className={`${baseBadge} text-primary-container bg-folio border-[1.5px] border-primary-container`}>
        {text || 'USER'}
      </span>
    );
  }

  // Status Badge Presets
  let badgeClasses = `${baseBadge} text-primary-container bg-folio border-[1.5px] border-primary-container`;
  let label = text || status || 'FILED';

  if (lowerVal === 'active' || lowerVal === 'filed') {
    badgeClasses = `${baseBadge} text-primary-container bg-folio border-[1.5px] border-primary-container`;
    label = text || 'FILED / ACTIVE';
  } else if (lowerVal === 'sealed' || lowerVal === 'verified') {
    badgeClasses = `${baseBadge} text-[#755b00] bg-[#fffdf5] border-[1.5px] border-seal-brass`;
    label = text || 'SEALED & VERIFIED';
  } else if (lowerVal === 'archived') {
    badgeClasses = `${baseBadge} text-secondary bg-container border-[1.5px] border-secondary`;
    label = text || 'DORMANT / ARCHIVED';
  } else if (lowerVal === 'void' || lowerVal === 'deleted' || lowerVal === 'purged') {
    badgeClasses = `${baseBadge} text-stamp-red bg-cell border-[1.5px] border-stamp-red`;
    label = text || 'VOID / DELETED';
  }

  return <span className={badgeClasses}>{label}</span>;
};
