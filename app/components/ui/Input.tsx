/**
 * Universal Input Component
 * 
 * Works in both web and React Native environments.
 * For React Native, use react-native's TextInput.
 */

import React from 'react';

export interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'url' | 'search';
  style?: React.CSSProperties;
  testID?: string;
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  value,
  defaultValue,
  onChange,
  onChangeText,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  autoFocus = false,
  autoComplete,
  inputMode,
  style,
  testID,
  label,
  error,
  helperText,
}: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    onChangeText?.(newValue);
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 16,
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: 6,
    minHeight: '44px',
    touchAction: 'manipulation',
    ...style,
  };

  const input = (
    <input
      type={type}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      inputMode={inputMode}
      style={baseStyle}
      data-testid={testID}
    />
  );

  if (label || error || helperText) {
    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
          </label>
        )}
        {input}
        {error && (
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
            {error}
          </div>
        )}
        {helperText && !error && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {helperText}
          </div>
        )}
      </div>
    );
  }

  return input;
}

