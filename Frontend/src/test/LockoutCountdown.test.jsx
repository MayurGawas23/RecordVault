import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { LockoutCountdown } from '../components/LockoutCountdown';

describe('LockoutCountdown Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial timer countdown formatted as MM:SS', () => {
    render(<LockoutCountdown initialSeconds={900} />);
    
    expect(screen.getByText(/ACCOUNT TEMPORARILY LOCKED OUT/i)).toBeInTheDocument();
    expect(screen.getByText(/⏱️ 15:00/i)).toBeInTheDocument();
  });

  it('decrements seconds left every second', () => {
    render(<LockoutCountdown initialSeconds={10} />);
    
    expect(screen.getByText(/⏱️ 00:10/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/⏱️ 00:07/i)).toBeInTheDocument();
  });

  it('displays lockout expired message and calls onExpire when timer hits zero', () => {
    const onExpireMock = vi.fn();
    render(<LockoutCountdown initialSeconds={2} onExpire={onExpireMock} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/Security lockout timer expired/i)).toBeInTheDocument();
    expect(onExpireMock).toHaveBeenCalled();
  });
});
