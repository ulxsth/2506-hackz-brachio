import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminalBorder focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary: 'bg-terminalBorder text-terminalBg hover:bg-terminalText border-2 border-terminalBorder',
      secondary: 'bg-terminalBg text-terminalText hover:bg-terminalBorder hover:bg-opacity-20 border-2 border-terminalBorder',
      outline: 'border-2 border-terminalBorder text-terminalText hover:bg-terminalBorder hover:bg-opacity-20',
      ghost: 'text-terminalText hover:bg-terminalBorder hover:bg-opacity-20',
      danger: 'bg-red-600 text-white hover:bg-red-700 border-2 border-red-600'
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg'
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
