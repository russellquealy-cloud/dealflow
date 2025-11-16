/**
 * Universal Button Component
 * 
 * Works in both web and React Native environments.
 * For React Native, use react-native's TouchableOpacity or Pressable.
 */

import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  testID?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
  },
  secondary: {
    background: '#6b7280',
    color: 'white',
    border: 'none',
  },
  danger: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
  },
  ghost: {
    background: 'transparent',
    color: '#3b82f6',
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: '6px 12px',
    fontSize: 14,
    minHeight: '32px',
  },
  md: {
    padding: '10px 20px',
    fontSize: 16,
    minHeight: '44px',
  },
  lg: {
    padding: '14px 28px',
    fontSize: 18,
    minHeight: '48px',
  },
};

export default function Button({
  children,
  onClick,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  style,
  testID,
}: ButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    onPress?.();
  };

  const baseStyle: React.CSSProperties = {
    borderRadius: 6,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.2s',
    touchAction: 'manipulation',
    width: fullWidth ? '100%' : 'auto',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      style={baseStyle}
      data-testid={testID}
    >
      {children}
    </button>
  );
}

