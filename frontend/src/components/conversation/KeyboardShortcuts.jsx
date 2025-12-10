// src/components/conversation/KeyboardShortcuts.jsx
import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Enter', description: 'Send message' },
    { key: 'Esc', description: 'Clear input' },
    { key: 'Ctrl + N', description: 'New conversation' },
    { key: 'Ctrl + K', description: 'Focus input' },
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-white border border-neutral-200 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        title="Keyboard shortcuts"
        aria-label="View keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5 text-neutral-600" />
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 fade-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-3">
                {shortcuts.map((shortcut) => (
                  <div 
                    key={shortcut.key}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-neutral-700">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-700">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}