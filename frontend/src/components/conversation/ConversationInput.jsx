// src/components/conversation/ConversationInput.jsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function ConversationInput({
  onSubmit,
  onResume,
  disabled = false,
  isWaitingForSupplier = false,
  placeholder = "Type your message..."
}) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef(null);
  const sendButtonRef = useRef(null);

  // Check if send button should be enabled
  const canSend = message.trim() !== '' && !disabled && !isSending;
  const canResume = isWaitingForSupplier && !disabled && !isSending;

  /**
   * Handle sending the message
   */
  const handleSend = (x, y) => {
    if (!canSend && !canResume) return;

    setIsSending(true);

    // Create ripple effect
    if (x !== undefined && y !== undefined) {
      const newRipple = { x, y, id: Date.now() };
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Simulate send animation delay
    setTimeout(() => {
      if (canResume) {
        // Resume conversation (no message needed)
        onResume();
      } else if (message.trim()) {
        // Send new message
        onSubmit(message.trim());
        setMessage(''); // Clear input after sending
      }
      
      setIsSending(false);
      inputRef.current?.focus();
    }, 400);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (canSend || canResume) {
        // Get button position for ripple
        const buttonRect = sendButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          const x = buttonRect.width / 2;
          const y = buttonRect.height / 2;
          handleSend(x, y);
        } else {
          handleSend();
        }
      }
    }
  };

  /**
   * Handle button click
   */
  const handleButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleSend(x, y);
  };

  /**
   * Handle Escape key to clear input
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setMessage('');
      inputRef.current?.blur();
    }
  };

  // Split message into characters for animation
  const messageCharacters = Array.from(message);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Waiting for Supplier Indicator */}
      {isWaitingForSupplier && (
        <div 
          className="mb-3 px-4 py-2 bg-warning-50 border border-warning-200 rounded-lg flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="w-4 h-4 animate-spin text-warning-600" />
          <span className="text-sm text-warning-800 font-medium">
            Waiting for supplier response...
          </span>
          <span className="text-xs text-warning-600">
            Click the arrow when ready to continue
          </span>
        </div>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Placeholder Animation */}
        <AnimatePresence>
          {!message && !isFocused && (
            <motion.div
              className="absolute inset-0 flex items-center pl-5 pr-14 pointer-events-none text-neutral-400"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              {placeholder}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || isSending}
            className={`
              w-full px-5 pr-14 py-3.5 
              bg-white border-2 rounded-full
              transition-all duration-200
              focus:outline-none
              ${isSending ? 'text-transparent' : 'text-neutral-900'}
              ${isFocused 
                ? 'border-primary-500 shadow-lg shadow-primary-100' 
                : 'border-neutral-300 hover:border-neutral-400'
              }
              ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}
            `}
            placeholder=""
            aria-label="Message input"
            aria-disabled={disabled}
          />

          {/* Send/Resume Button */}
          <button
            ref={sendButtonRef}
            onClick={handleButtonClick}
            disabled={(!canSend && !canResume) || disabled}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              w-10 h-10 rounded-full
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${isSending 
                ? 'bg-primary-400 cursor-not-allowed' 
                : (canSend || canResume)
                  ? 'bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-200' 
                  : 'bg-neutral-300 cursor-not-allowed'
              }
            `}
            title={
              isWaitingForSupplier 
                ? "Resume conversation" 
                : disabled 
                  ? "Waiting for supplier response" 
                  : "Send message (Enter)"
            }
            aria-label={isWaitingForSupplier ? "Resume conversation" : "Send message"}
            aria-disabled={!canSend && !canResume}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 text-white" />
            )}

            {/* Ripple Effects */}
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                className="absolute inset-0 rounded-full bg-white opacity-30"
                style={{
                  left: ripple.x - 20,
                  top: ripple.y - 20,
                }}
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </button>
        </div>

        {/* Sending Animation (Message Blur Effect) */}
        {isSending && message && (
          <motion.div
            className="absolute inset-0 flex items-center pl-5 pr-14 pointer-events-none overflow-hidden rounded-full"
            initial={{ opacity: 1 }}
            animate={{
              opacity: [1, 0.5, 0],
              filter: ['blur(0px)', 'blur(3px)', 'blur(8px)'],
            }}
            transition={{ duration: 0.8, ease: 'linear' }}
          >
            <div className="flex">
              {messageCharacters.map((char, index) => (
                <motion.span
                  key={index}
                  className="text-neutral-900 font-medium"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{
                    opacity: [1, 0.7, 0],
                    y: [0, -5, -10],
                  }}
                  transition={{
                    delay: index * 0.02,
                    duration: 0.5,
                    ease: 'easeOut',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-2 px-2 flex items-center justify-between text-xs text-neutral-500">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-mono">Enter</kbd> to send
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-mono">Esc</kbd> to clear
        </span>
      </div>
    </div>
  );
}