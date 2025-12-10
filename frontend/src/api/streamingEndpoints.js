// src/api/streamingEndpoints.js
import { SSEStreamHandler } from '../utils/sseStreamHandler';
import { API_BASE_URL } from '../utils/constants';

/**
 * Create a streaming connection with enhanced error handling
 */
function createStream(url, method, body, onEvent, onComplete, onError) {
  console.log('[API] Creating stream:', url);

  const handler = new SSEStreamHandler({
    maxRetries: 3,
    retryDelay: 2000,
    retryMultiplier: 1.5,
    timeout: 120000
  });

  let retryAttempt = null;

  // Wrap callbacks to handle reconnection
  const callbacks = {
    onEvent,
    onComplete: (data) => {
      console.log('[API] Stream completed successfully');
      onComplete(data);
    },
    onError: (error, canRetry) => {
      if (canRetry) {
        console.log('[API] Connection lost, will retry...');
        // Let the handler manage reconnection
      } else {
        console.error('[API] Stream failed permanently:', error);
        onError(error);
      }
    },
    onReconnecting: (attempt, delay) => {
      console.log(`[API] Reconnecting (attempt ${attempt})...`);
      onEvent({
        type: 'reconnecting',
        data: { attempt, delay }
      });
    },
    onConnected: () => {
      console.log('[API] Connected successfully');
      onEvent({
        type: 'connected',
        data: { timestamp: new Date().toISOString() }
      });
    }
  };

  // Start connection
  handler.connect(url, method, body, callbacks);

  // Return cleanup function
  return () => {
    console.log('[API] Cleanup requested');
    handler.disconnect();
  };
}

/**
 * Start conversation with streaming
 */
export const startConversationStream = (data, onEvent, onComplete, onError) => {
  const url = `${API_BASE_URL}/conversations/stream`;
  
  return createStream(
    url,
    'POST',
    {
      user_input: data.userInput,
      recipient_email: data.recipientEmail || null,
      channel: data.channel || 'web',
    },
    onEvent,
    onComplete,
    onError
  );
};

/**
 * Continue conversation with streaming
 */
export const continueConversationStream = (threadId, userInput, onEvent, onComplete, onError) => {
  const url = `${API_BASE_URL}/conversations/${threadId}/stream/continue`;
  
  return createStream(
    url,
    'POST',
    { user_input: userInput },
    onEvent,
    onComplete,
    onError
  );
};

/**
 * Resume conversation with streaming
 */
export const resumeConversationStream = (threadId, requestId, onEvent, onComplete, onError) => {
  const url = `${API_BASE_URL}/conversations/${threadId}/stream/resume`;
  
  return createStream(
    url,
    'POST',
    { request_id: requestId },
    onEvent,
    onComplete,
    onError
  );
};