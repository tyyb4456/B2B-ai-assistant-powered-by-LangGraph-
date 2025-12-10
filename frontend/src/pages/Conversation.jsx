// src/pages/Conversation.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api/endpoints';
import ConversationMessages from '../components/conversation/ConversationMessages';
import ConversationInput from '../components/conversation/ConversationInput';
import ConnectionStatus from '../components/conversation/ConnectionStatus';
import { Loader2, AlertCircle, Info, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Conversation() {
  const { threadId } = useParams();
  const navigate = useNavigate();

  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONS
  const [messages, setMessages] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(threadId || null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForSupplier, setIsWaitingForSupplier] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const cleanupRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Load existing conversation effect
  useEffect(() => {
    if (threadId) {
      loadExistingConversation(threadId);
    }
    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        console.log('[Conversation] Cleanup on unmount');
        cleanupRef.current();
      }
    };
  }, [threadId]); // Only depend on threadId

  // Load existing conversation function
  const loadExistingConversation = async (tid) => {
    setIsLoadingHistory(true);
    try {
      const response = await api.getConversationMessages(tid);
      if (response.messages) {
        setMessages(response.messages.map(msg => ({
          id: msg.id || Date.now(),
          from: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
          status: 'complete'
        })));
      }
      setCurrentThreadId(tid);
    } catch (err) {
      console.error('[Conversation] Failed to load:', err);
      setError('Failed to load conversation history');
      toast.error('Failed to load conversation');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Start new conversation
  const handleStartConversation = (userInput) => {
    console.log('[Conversation] Starting new conversation:', userInput);
    
    const userMessage = {
      id: Date.now(),
      from: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
      status: 'complete'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);
    setConnectionStatus('connected');

    cleanupRef.current = api.startConversationStream(
      { userInput, channel: 'web' },
      handleStreamEvent,
      handleStreamComplete,
      handleStreamError
    );
  };

  // Continue conversation
  const handleContinueConversation = (userInput) => {
    console.log('[Conversation] Continuing conversation:', currentThreadId);
    
    const userMessage = {
      id: Date.now(),
      from: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
      status: 'complete'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);
    setIsWaitingForSupplier(false);
    setConnectionStatus('connected');

    cleanupRef.current = api.continueConversationStream(
      currentThreadId,
      userInput,
      handleStreamEvent,
      handleStreamComplete,
      handleStreamError
    );
  };

  // Resume conversation
  const handleResumeConversation = () => {
    console.log('[Conversation] Resuming conversation:', currentThreadId);
    
    setIsStreaming(true);
    setError(null);
    setIsWaitingForSupplier(false);
    setConnectionStatus('connected');

    // TODO: Get actual request_id from backend state
    const requestId = 'temp_request_id';

    cleanupRef.current = api.resumeConversationStream(
      currentThreadId,
      requestId,
      handleStreamEvent,
      handleStreamComplete,
      handleStreamError
    );
  };

  // Handle stream events
  const handleStreamEvent = (event) => {
    const eventType = event.type;
    const eventData = event.data || {};

    switch (eventType) {
      case 'reconnecting':
        setConnectionStatus('reconnecting');
        setRetryAttempt(eventData.attempt || 0);
        break;

      case 'connected':
        setConnectionStatus('connected');
        setRetryAttempt(0);
        if (eventData.thread_id && !currentThreadId) {
          setCurrentThreadId(eventData.thread_id);
        }
        break;

      case 'message':
      case 'node_progress':
        if (eventData.content) {
          // 🔥 FIX: Add line break between node responses
          setStreamingMessage(prev => {
            // If there's already content, add double line break before new content
            if (prev.trim()) {
              return prev + '\n\n' + eventData.content;
            }
            return eventData.content;
          });
        }
        break;

      case 'ai_chunk':
        // 🔥 FIX: Add line break between node responses
        setStreamingMessage(prev => {
          if (prev.trim() && eventData.content) {
            return prev + '\n\n' + eventData.content;
          }
          return prev + (eventData.content || '');
        });
        break;

      case 'ai_complete':
        if (streamingMessage) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            from: 'assistant',
            content: streamingMessage,
            timestamp: new Date().toISOString(),
            status: 'complete'
          }]);
          setStreamingMessage('');
        }
        break;

      case 'supplier_wait':
      case 'paused':
        setIsWaitingForSupplier(true);
        setIsStreaming(false);
        if (streamingMessage) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            from: 'assistant',
            content: streamingMessage,
            timestamp: new Date().toISOString(),
            status: 'complete'
          }]);
          setStreamingMessage('');
        }
        break;

      case 'supplier_response':
        setIsWaitingForSupplier(false);
        if (eventData.content) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            from: 'supplier',
            content: eventData.content,
            timestamp: new Date().toISOString(),
            status: 'complete'
          }]);
        }
        break;

      case 'workflow_complete':
        if (streamingMessage) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            from: 'assistant',
            content: streamingMessage,
            timestamp: new Date().toISOString(),
            status: 'complete'
          }]);
          setStreamingMessage('');
        }
        setIsStreaming(false);
        break;

      case 'error':
        setError(eventData.error || 'An error occurred');
        setIsStreaming(false);
        break;

      default:
        console.log('[Conversation] Unknown event type:', eventType);
    }
  };

  // Handle stream complete
  const handleStreamComplete = (data) => {
    console.log('[Conversation] Stream completed:', data);
    
    if (data.thread_id && !currentThreadId) {
      setCurrentThreadId(data.thread_id);
    }
    
    if (streamingMessage) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        from: 'assistant',
        content: streamingMessage,
        timestamp: new Date().toISOString(),
        status: 'complete'
      }]);
      setStreamingMessage('');
    }
    
    setIsStreaming(false);
    setConnectionStatus('connected');
  };

  // Handle stream error
  const handleStreamError = (error) => {
    console.error('[Conversation] Stream error:', error);
    setError(error.message || 'Connection error occurred');
    setIsStreaming(false);
    setConnectionStatus('error');
    toast.error('Connection error: ' + error.message);
  };

  // Handle user input
  const handleSubmit = (userInput) => {
    if (!userInput.trim()) return;

    if (!currentThreadId) {
      handleStartConversation(userInput);
    } else {
      handleContinueConversation(userInput);
    }
  };

  // Start new conversation
  const handleNewConversation = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    setMessages([]);
    setCurrentThreadId(null);
    setIsStreaming(false);
    setIsWaitingForSupplier(false);
    setStreamingMessage('');
    setError(null);
    setConnectionStatus('connected');
    navigate('/conversation');
  };

  // Copy conversation
  const handleCopyConversation = () => {
    const conversationText = messages
      .map(msg => {
        const sender = msg.from === 'user' ? 'You' : msg.from === 'assistant' ? 'AI Assistant' : 'Supplier';
        return `${sender}: ${msg.content}`;
      })
      .join('\n\n');
    
    navigator.clipboard.writeText(conversationText);
    toast.success('Conversation copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-neutral-50">
      {/* Connection Status */}
      <ConnectionStatus 
        status={connectionStatus} 
        retryAttempt={retryAttempt} 
      />

      {/* Header */}
      <div className="px-6 py-6 border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                {currentThreadId ? 'Conversation' : 'Start a conversation'}
              </h1>
              <p className="text-neutral-600 mt-1">
                Get supplier info, request a quote, and negotiate — all from this page.
              </p>
            </div>
            
            {currentThreadId && (
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleCopyConversation}
                    className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2"
                    title="Copy conversation"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                )}
                <button
                  onClick={() => navigate(`/conversation/${currentThreadId}/details`)}
                  className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2"
                  title="View conversation details"
                >
                  <Info size={16} />
                  Details
                </button>
                <button
                  onClick={handleNewConversation}
                  className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ConversationMessages
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          error={error}
          messagesEndRef={messagesEndRef}
          isLoading={isLoadingHistory}
        />
      </div>

      {/* Bottom Input */}
      <div className="border-t border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <ConversationInput
            onSubmit={handleSubmit}
            onResume={handleResumeConversation}
            disabled={isStreaming}
            isWaitingForSupplier={isWaitingForSupplier}
            placeholder={
              isWaitingForSupplier
                ? "Waiting for supplier response..."
                : "Type your message..."
            }
          />
        </div>
      </div>
    </div>
  );
}