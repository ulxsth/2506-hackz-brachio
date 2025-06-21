'use client';

import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div
        className={cn(
          'relative bg-terminalBg border-2 border-terminalBorder shadow-lg text-terminalText font-mono max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        {/* ヘッダー */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b-2 border-terminalBorder">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center hover:bg-terminalBorder hover:bg-opacity-30 transition-colors"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        )}
        
        {/* コンテンツ */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export { Modal };
export type { ModalProps };
