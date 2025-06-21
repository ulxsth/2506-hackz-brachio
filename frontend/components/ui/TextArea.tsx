import React from 'react';
import { cn } from '../../lib/utils';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
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
        <textarea
          className={cn(
            'flex min-h-[80px] w-full border-2 border-terminalBorder bg-terminalBg px-3 py-2 text-sm font-mono text-terminalText ring-offset-background placeholder:text-terminalText placeholder:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminalText focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm font-mono text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export { TextArea };
export type { TextAreaProps };
