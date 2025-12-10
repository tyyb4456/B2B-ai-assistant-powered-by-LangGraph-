// src/components/conversation/ConversationMessages.jsx
import { useRef, useEffect } from 'react';
import { MessageSquareIcon, AlertCircle } from 'lucide-react';
import { Spinner } from '@heroui/react';
import ConversationMessage from './ConversationMessage';

export default function ConversationMessages({
  messages,
  streamingMessage,
  isStreaming,
  error,
  messagesEndRef,
  onSelectSupplier,
  isLoading
}) {
  const containerRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = containerRef.current;
      const isNearBottom = scrollHeight - clientHeight - scrollTop < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, streamingMessage, messagesEndRef]);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto scroll-smooth"
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Empty State */}
        {messages.length === 0 && !streamingMessage && !error && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <MessageSquareIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-neutral-600 max-w-md">
              Messages will appear here as the conversation progresses. 
              Type your message below to begin.
            </p>
          </div>
        )}

        {/* Loading History State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading conversation history...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-error-900 mb-1">
                Failed to send
              </p>
              <p className="text-sm text-error-700">{error}</p>
              <button className="mt-2 text-sm font-medium text-error-600 hover:text-error-700">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Message List */}
        <div className="space-y-6">
          {messages.map((message) => (
            <ConversationMessage
              key={message.id}
              message={message}
              onSelectSupplier={onSelectSupplier}
            />
          ))}

          {/* Streaming Message with Typing Indicator */}
          {streamingMessage && (
            <ConversationMessage
              message={{
                id: 'streaming',
                from: 'assistant',
                content: streamingMessage,
                timestamp: new Date().toISOString(),
                status: 'streaming'
              }}
              isStreaming={true}
            />
          )}

          {/* 🔥 FIXED: Hero UI Wave Spinner - Shows between nodes */}
          {isStreaming && !streamingMessage && (
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
              </div>

              {/* Typing Indicator with Hero UI Wave Spinner */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-neutral-900">AI Assistant</span>
                </div>
                
                <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-3">
                  <Spinner 
                    size="sm"
                    variant="wave"
                    color="primary"
                    classNames={{
                      wrapper: "w-8 h-8",
                      circle1: "border-primary-600",
                      circle2: "border-primary-600"
                    }}
                  />
                  <span className="text-sm text-neutral-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}