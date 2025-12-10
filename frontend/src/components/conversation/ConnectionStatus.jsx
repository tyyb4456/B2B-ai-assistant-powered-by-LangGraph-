// src/components/conversation/ConnectionStatus.jsx
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function ConnectionStatus({ status, retryAttempt }) {
  if (status === 'connected') return null;

  return (
    <div 
      className={`
        fixed top-20 right-6 z-50
        px-4 py-2 rounded-lg shadow-lg
        flex items-center gap-2
        animate-in slide-in-from-top-2 fade-in duration-300
        ${status === 'reconnecting' 
          ? 'bg-warning-50 border border-warning-200' 
          : 'bg-error-50 border border-error-200'
        }
      `}
      role="status"
      aria-live="polite"
    >
      {status === 'reconnecting' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-warning-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-warning-900">
              Reconnecting...
            </span>
            {retryAttempt && (
              <span className="text-xs text-warning-700">
                Attempt {retryAttempt}/3
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-error-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-error-900">
              Connection lost
            </span>
            <span className="text-xs text-error-700">
              Please check your internet connection
            </span>
          </div>
        </>
      )}
    </div>
  );
}