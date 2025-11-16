/**
 * Universal Select Component
 * 
 * Works in both web and React Native environments.
 * For React Native, use react-native's Picker or a custom picker library.
 */

import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  onValueChange?: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  testID?: string;
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Select({
  value,
  defaultValue,
  onChange,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  style,
  testID,
  label,
  error,
  helperText,
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    onValueChange?.(newValue);
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 16,
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: 6,
    minHeight: '44px',
    touchAction: 'manipulation',
    background: 'white',
    ...style,
  };

  const select = (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      style={baseStyle}
      data-testid={testID}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
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
        {select}
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

  return select;
}

