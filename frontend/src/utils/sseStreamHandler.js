// src/utils/sseStreamHandler.js

/**
 * Enhanced SSE Stream Handler with Reconnection
 * Handles Server-Sent Events with automatic retry and connection management
 */
export class SSEStreamHandler {
  constructor(config = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 2000,
      retryMultiplier: 1.5,
      timeout: 120000, // 2 minutes
      ...config
    };

    this.retryCount = 0;
    this.isConnected = false;
    this.isClosed = false;
    this.xhr = null;
    this.reconnectTimer = null;
  }

  /**
   * Start streaming connection
   */
  connect(url, method, body, callbacks) {
    const { onEvent, onComplete, onError, onReconnecting, onConnected } = callbacks;

    console.log('[SSE] Starting connection:', { url, method });

    // Clear any existing connection
    this.disconnect();

    this.isConnected = false;
    this.isClosed = false;

    // Create XHR request
    this.xhr = new XMLHttpRequest();
    this.xhr.open(method, url, true);
    this.xhr.setRequestHeader('Content-Type', 'application/json');
    this.xhr.setRequestHeader('Accept', 'text/event-stream');

    let lastIndex = 0;
    let capturedThreadId = null;
    let eventBuffer = '';

    // Handle progress (streaming data)
    this.xhr.onprogress = () => {
      if (this.isClosed) return;

      const newData = this.xhr.responseText.substring(lastIndex);
      lastIndex = this.xhr.responseText.length;

      if (!newData) return;

      // Add to buffer
      eventBuffer += newData;

      // Process complete events (lines ending with \n\n)
      const events = eventBuffer.split('\n\n');
      
      // Keep incomplete event in buffer
      eventBuffer = events.pop() || '';

      // Process each complete event
      events.forEach(eventStr => {
        if (!eventStr.trim()) return;

        try {
          // Parse SSE format: "data: {...json...}"
          const lines = eventStr.split('\n');
          let eventData = '';

          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              eventData += line.substring(6);
            } else if (line.startsWith(': ping')) {
              // Skip ping
              return;
            }
          });

          if (!eventData) return;

          // Parse JSON
          const parsedData = JSON.parse(eventData);
          console.log('[SSE] Event received:', parsedData.type);

          // Mark as connected on first event
          if (!this.isConnected) {
            this.isConnected = true;
            this.retryCount = 0;
            onConnected?.();
          }

          // Capture thread_id
          if (parsedData.thread_id && !capturedThreadId) {
            capturedThreadId = parsedData.thread_id;
            console.log('[SSE] Thread ID captured:', capturedThreadId);
          }

          // Call event handler
          onEvent({
            type: parsedData.type,
            data: parsedData
          });

        } catch (err) {
          console.error('[SSE] Parse error:', err, 'Data:', eventStr);
        }
      });
    };

    // Handle successful completion
    this.xhr.onload = () => {
      if (this.isClosed) return;

      console.log('[SSE] Stream completed:', {
        status: this.xhr.status,
        threadId: capturedThreadId
      });

      this.isConnected = false;

      if (this.xhr.status >= 200 && this.xhr.status < 300) {
        onComplete({
          status: 'completed',
          thread_id: capturedThreadId
        });
      } else {
        this.handleError(new Error(`HTTP ${this.xhr.status}`), callbacks);
      }
    };

    // Handle network errors
    this.xhr.onerror = () => {
      if (this.isClosed) return;

      console.error('[SSE] Network error');
      this.isConnected = false;
      this.handleError(new Error('Network error'), callbacks);
    };

    // Handle timeouts
    this.xhr.ontimeout = () => {
      if (this.isClosed) return;

      console.error('[SSE] Request timeout');
      this.isConnected = false;
      this.handleError(new Error('Connection timeout'), callbacks);
    };

    // Handle abort
    this.xhr.onabort = () => {
      console.log('[SSE] Connection aborted');
      this.isConnected = false;
    };

    // Set timeout
    this.xhr.timeout = this.config.timeout;

    // Send request
    try {
      this.xhr.send(body ? JSON.stringify(body) : null);
      console.log('[SSE] Request sent');
    } catch (err) {
      console.error('[SSE] Send error:', err);
      this.handleError(err, callbacks);
    }
  }

  /**
   * Handle errors with retry logic
   */
  handleError(error, callbacks) {
    const { onError, onReconnecting } = callbacks;

    if (this.isClosed) return;

    console.error('[SSE] Error occurred:', error.message);

    // Check if we should retry
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      const delay = this.config.retryDelay * Math.pow(this.config.retryMultiplier, this.retryCount - 1);

      console.log(`[SSE] Retrying in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);
      
      onReconnecting?.(this.retryCount, delay);

      this.reconnectTimer = setTimeout(() => {
        if (!this.isClosed) {
          console.log('[SSE] Attempting reconnection...');
          // Re-establish connection (caller should handle this)
          onError(error, true); // true = can retry
        }
      }, delay);
    } else {
      console.error('[SSE] Max retries reached, giving up');
      onError(error, false); // false = cannot retry
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    console.log('[SSE] Disconnecting...');
    
    this.isClosed = true;
    this.isConnected = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
  }

  /**
   * Check if currently connected
   */
  get connected() {
    return this.isConnected;
  }
}