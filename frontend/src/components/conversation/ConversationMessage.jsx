// src/components/conversation/ConversationMessage.jsx
import { useState } from 'react';
import { 
  User, 
  Bot, 
  Building2,
  Copy, 
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageTime, formatRelativeTime } from '../../utils/dateFormatters';

export default function ConversationMessage({ message, isStreaming = false }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const { from, content, timestamp, status } = message;

  // Determine message alignment and styling
  const isUser = from === 'user';
  const isAssistant = from === 'assistant';
  const isSupplier = from === 'supplier';

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle retry (for failed messages)
  const handleRetry = () => {
    console.log('Retry message:', message.id);
    // Implement retry logic
  };

  return (
    <div 
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`Message from ${from}`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isUser ? 'bg-primary-100' : isSupplier ? 'bg-warning-100' : 'bg-secondary-100'}
        `}>
          {isUser && <User className="w-5 h-5 text-primary-600" />}
          {isAssistant && <Bot className="w-5 h-5 text-secondary-600" />}
          {isSupplier && <Building2 className="w-5 h-5 text-warning-600" />}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-sm font-semibold text-neutral-900">
            {isUser ? 'You' : isSupplier ? 'Supplier' : 'AI Assistant'}
          </span>
          {timestamp && (
            <span className="text-xs text-neutral-500">
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <span className="animate-pulse">●</span> typing...
            </span>
          )}
        </div>

        {/* Message Bubble */}
        <div 
          className={`
            relative max-w-[85%] rounded-2xl px-4 py-3
            ${isUser 
              ? 'bg-primary-600 text-white rounded-tr-sm' 
              : isSupplier
              ? 'bg-warning-50 text-neutral-900 border border-warning-200 rounded-tl-sm'
              : 'bg-neutral-100 text-neutral-900 rounded-tl-sm'
            }
            ${isStreaming ? 'animate-pulse' : ''}
          `}
        >
          {/* Content */}
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-neutral dark:prose-invert prose-headings:font-semibold prose-a:text-primary-600 prose-code:text-sm prose-pre:bg-neutral-800 prose-pre:text-neutral-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming shimmer effect */}
          {isStreaming && (
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-2xl pointer-events-none" />
          )}
        </div>

        {timestamp && (
        <span 
            className="text-xs text-neutral-500"
            title={new Date(timestamp).toLocaleString()}
        >
            {formatRelativeTime(timestamp)}
        </span>
        )}

        {/* Action Buttons (only for assistant messages) */}
        {isAssistant && !isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Copy to clipboard"
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setLiked(!liked)}
              className={`p-1.5 rounded-lg hover:bg-neutral-100 transition-colors ${
                liked ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Like this response"
              aria-label="Like message"
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setDisliked(!disliked)}
              className={`p-1.5 rounded-lg hover:bg-neutral-100 transition-colors ${
                disliked ? 'text-error-600' : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Dislike this response"
              aria-label="Dislike message"
            >
              <ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-current' : ''}`} />
            </button>

            {status === 'failed' && (
              <button
                onClick={handleRetry}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors"
                title="Retry"
                aria-label="Retry sending message"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}