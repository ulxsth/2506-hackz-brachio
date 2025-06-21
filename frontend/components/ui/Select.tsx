import React from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    const id = props.id || props.name;
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-sm font-mono font-medium text-terminalText"
          >
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex h-10 w-full border-2 border-terminalBorder bg-terminalBg px-3 py-2 text-sm font-mono text-terminalText ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminalText focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-sm font-mono text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps };
