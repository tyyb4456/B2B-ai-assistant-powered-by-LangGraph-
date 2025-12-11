import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export default function StreamingConversation({ onComplete, onError, showEvents = true }) {
  const [streamState, setStreamState] = useState({
    isStreaming: false,
    events: [],
    currentNode: 'Waiting to start...',
    readyMessage: null,
    threadId: null,
    error: null,
  });

  const cleanupRef = useRef(null);
  const eventsEndRef = useRef(null);

  // Auto-scroll to the last event
  useEffect(() => {
    if (streamState.events.length > 0 && showEvents) {
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamState.events.length, showEvents]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const startStreaming = (streamFn) => {
    setStreamState({
      isStreaming: true,
      events: [],
      currentNode: 'AI is connecting...',
      readyMessage: null,
      threadId: null,
      error: null,
    });

    const cleanup = streamFn(
      (event) => {
        const { type, data = {} } = event;

        setStreamState((prev) => {
          let newEvents = [...prev.events];
          let newNode = prev.currentNode;
          let newThreadId = prev.threadId;

          switch (type) {
            case 'message':
              if (data.content?.startsWith('Received your message') || data.content?.startsWith('Intent classified')) {
                // Skip internal messages
                break;
              }
              // Only show final or user-facing messages
              const readyMessage = {
                id: data.quote_id || 'final',
                from: 'assistant',
                content: data.content || '✅ Completed',
                timestamp: data.timestamp || new Date().toISOString(),
                status: data.content?.startsWith('Error') ? 'error' : 'sent',
              };
              newEvents.push({ type: 'final_message', data: readyMessage });
              newNode = readyMessage.status === 'error' ? '❌ Error occurred' : '✅ Processing Complete';
              break;

            case 'connected':
              newNode = 'Connected to AI';
              newThreadId = data.thread_id || newThreadId;
              break;

            case 'node_progress':
              newNode = 'AI is processing your request...';
              break;

            case 'workflow_complete':
              newNode = data.status === 'error' ? '❌ Error occurred' : '✅ Processing Complete';
              newThreadId = data.thread_id || newThreadId;
              break;

            case 'error':
              newNode = '❌ Error occurred';
              break;

            case 'close':
              newNode = 'Stream closed';
              newThreadId = data.thread_id || newThreadId;
              break;

            default:
              break;
          }

          // Only push visible events
          if (type === 'final_message') {
            newEvents.push(event);
          }

          return { ...prev, events: newEvents, currentNode: newNode, threadId: newThreadId };
        });
      },
      (finalData) => {
        const finalThreadId = finalData.thread_id || streamState.threadId;
        const readyMessage = {
          id: finalData.quote_id || 'final',
          from: 'assistant',
          content: finalData.final_output || '✅ Quote generated successfully!',
          timestamp: new Date().toISOString(),
          status: 'sent',
        };

        setStreamState((prev) => ({
          ...prev,
          isStreaming: false,
          currentNode: '✅ Processing Complete',
          readyMessage,
          threadId: finalThreadId,
          events: [...prev.events, { type: 'final_message', data: readyMessage }],
        }));

        if (onComplete) onComplete(finalThreadId, streamState.events, readyMessage);
      },
      (error) => {
        const errorMessage = {
          id: 'error',
          from: 'assistant',
          content: error.message,
          timestamp: new Date().toISOString(),
          status: 'error',
        };

        setStreamState((prev) => ({
          ...prev,
          isStreaming: false,
          currentNode: '❌ Error occurred',
          error: error.message,
          events: [...prev.events, { type: 'final_message', data: errorMessage }],
        }));

        if (onError) onError(error);
      }
    );

    cleanupRef.current = cleanup;
  };

  const stopStreaming = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setStreamState((prev) => ({ ...prev, isStreaming: false, currentNode: '🛑 Stopped' }));
  };

  const renderProgress = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {streamState.isStreaming
            ? <Loader2 size={20} className="animate-spin text-primary-600" />
            : streamState.error
              ? <AlertCircle size={20} className="text-error-600" />
              : <CheckCircle size={20} className="text-success-600" />}
          {streamState.isStreaming ? 'Processing Your Request' : streamState.error ? 'Error Occurred' : 'Processing Complete'}
        </CardTitle>
        <CardDescription>
          {streamState.isStreaming ? 'AI is working on your request. Please wait...' :
            streamState.error ? 'Something went wrong' : 'Your request has been processed successfully'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {streamState.isStreaming && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-primary-600" />
                <div>
                  <p className="text-xs font-medium text-primary-700 uppercase tracking-wide">Status</p>
                  <p className="text-lg font-bold text-black mt-1">{streamState.currentNode}</p>
                </div>
              </div>
            </div>
          )}

          {streamState.events.length > 0 && showEvents && (
            <div className="space-y-2 max-h-96 overflow-y-auto bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              {streamState.events.map((event, idx) => (
                <StreamEventCard key={idx} event={event} index={idx} />
              ))}
              <div ref={eventsEndRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return {
    streamState,
    startStreaming,
    stopStreaming,
    renderProgress
  };
}

function StreamEventCard({ event, index }) {
  const { type, data = {} } = event;

  const getEventIcon = (type) => {
    switch (type) {
      case 'final_message':
        return <MessageSquare size={20} className={data.status === 'error' ? 'text-red-600' : 'text-green-600'} />;
      default:
        return <MessageSquare size={20} className="text-neutral-400" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="shrink-0 mt-0.5">{getEventIcon(type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <p className="text-sm font-semibold text-black">{type}</p>
          <span className="text-xs text-neutral-400 ml-2">#{index + 1}</span>
        </div>
        {data.content && (
          <p className={`text-sm whitespace-pre-wrap ${type === 'final_message' && data.status === 'error' ? 'text-red-600' : 'text-black'}`}>
            {data.content}
          </p>
        )}
      </div>
    </div>
  );
}
