import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { OTPInputWidget } from '../components/OTPInputWidget';

describe('OTPInputWidget Component Tests', () => {
  test('renders 6 distinct input fields', () => {
    const { container } = render(<OTPInputWidget length={6} />);
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBe(6);
  });

  test('calls onComplete when all 6 digits are entered', () => {
    const handleComplete = vi.fn();
    const { container } = render(<OTPInputWidget length={6} onComplete={handleComplete} />);
    const inputs = container.querySelectorAll('input');

    ['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } });
    });

    expect(handleComplete).toHaveBeenCalledWith('123456');
  });
});
