import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { PasswordInput } from '../components/PasswordInput';

describe('PasswordInput Component', () => {
  it('renders password input in masked password mode initially', () => {
    render(<PasswordInput value="secret123" onChange={() => {}} />);
    
    const input = screen.getByPlaceholderText('••••••••••••');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('secret123');
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(<PasswordInput value="myPass!23" onChange={() => {}} />);
    
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    const input = screen.getByPlaceholderText('••••••••••••');

    expect(input).toHaveAttribute('type', 'password');

    // Click show password
    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    // Click hide password
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
