/**
 * Universal TextArea Component
 * 
 * Works in both web and React Native environments.
 * For React Native, use react-native's TextInput with multiline.
 */

import React from 'react';

export interface TextAreaProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  style?: React.CSSProperties;
  testID?: string;
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

export default function TextArea({
  value,
  defaultValue,
  onChange,
  onChangeText,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  style,
  testID,
  label,
  error,
  helperText,
  maxLength,
}: TextAreaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
    ...style,
  };

  const textarea = (
    <textarea
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      maxLength={maxLength}
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
        {textarea}
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

  return textarea;
}

