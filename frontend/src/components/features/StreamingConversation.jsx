import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, MessageSquare, Target, Package, Building2, FileText, Clock, AlertCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

/**
 * Reusable Streaming Conversation Component
 * Handles streaming for start, continue, and resume operations
 */
export default function StreamingConversation({ 
  onComplete, 
  onError,
  showEvents = true,
  autoNavigate = false
}) {
  const [streamState, setStreamState] = useState({
    isStreaming: false,
    events: [],
    currentNode: '',
    threadId: null,
    error: null,
  });

  const cleanupRef = useRef(null);
  const eventsEndRef = useRef(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (streamState.events.length > 0 && showEvents) {
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamState.events.length, showEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        console.log('[Streaming] 🧹 Cleanup on unmount');
        cleanupRef.current();
      }
    };
  }, []);

  /**
   * Start streaming with the provided stream function
   * @param {Function} streamFn - Function that returns cleanup function
   */
  const startStreaming = (streamFn) => {
    console.log('[Streaming] 🚀 Starting stream');
    
    // Reset state
    setStreamState({
      isStreaming: true,
      events: [],
      currentNode: 'Initializing...',
      threadId: null,
      error: null,
    });

    const cleanup = streamFn(
      // onEvent callback
      (event) => {
        console.log('[Streaming] ✅ Event received:', event);
        
        const eventType = event.type || 'message';

        setStreamState(prev => {
          const newEvents = [...prev.events, event];
          let newNode = prev.currentNode;
          let newThreadId = prev.threadId;

          // Update current node based on event type
          switch (eventType) {
            case 'connected':
              newNode = '✅ Connected';
              newThreadId = event.data?.thread_id || newThreadId;
              break;
            case 'node_progress':
              newNode = `⚙️ ${formatNodeName(event.data?.node || 'Processing')}`;
              break;
            case 'intent_classified':
              newNode = `🎯 Intent: ${event.data?.intent || 'Unknown'}`;
              break;
            case 'parameters_extracted':
              newNode = '📋 Parameters Extracted';
              break;
            case 'suppliers_found':
              const supplierCount = event.data?.count || (event.data?.suppliers?.length || 0);
              newNode = `🏢 Found ${supplierCount} Suppliers`;
              break;
            case 'quote_generated':
              newNode = '📄 Quote Generated';
              break;
            case 'message_drafted':
              newNode = '✍️ Message Drafted';
              break;
            case 'response_analyzed':
              newNode = '🔍 Response Analyzed';
              break;
            case 'message':
              newNode = `💬 ${formatNodeName(event.data?.node || 'Message')}`;
              break;
            case 'workflow_complete':
              newNode = '✅ Completed';
              newThreadId = event.data?.thread_id || newThreadId;
              break;
            case 'error':
              newNode = '❌ Error';
              break;
            case 'close':
              newNode = '✅ Stream Closed';
              newThreadId = event.data?.thread_id || newThreadId;
              break;
          }

          return {
            ...prev,
            events: newEvents,
            currentNode: newNode,
            threadId: newThreadId,
          };
        });
      },
      
      // onComplete callback
      (data) => {
        console.log('[Streaming] ✅ Stream completed', data);
        
        setStreamState(prev => {
          const finalThreadId = data.thread_id || prev.threadId;
          
          const finalState = {
            ...prev,
            isStreaming: false,
            currentNode: '✅ Processing Complete',
            threadId: finalThreadId,
          };

          // Call completion callback
          if (onComplete) {
            setTimeout(() => {
              onComplete(finalThreadId, prev.events);
            }, 500);
          }

          return finalState;
        });
      },
      
      // onError callback
      (error) => {
        console.error('[Streaming] ❌ Error:', error);
        
        setStreamState(prev => ({
          ...prev,
          isStreaming: false,
          currentNode: '❌ Error occurred',
          error: error.message,
          events: [...prev.events, { 
            type: 'error', 
            data: { error: error.message } 
          }],
        }));

        if (onError) {
          onError(error);
        }
      }
    );

    cleanupRef.current = cleanup;
  };

  /**
   * Stop streaming manually
   */
  const stopStreaming = () => {
    if (cleanupRef.current) {
      console.log('[Streaming] 🛑 Manual stop');
      cleanupRef.current();
      cleanupRef.current = null;
      
      setStreamState(prev => ({
        ...prev,
        isStreaming: false,
        currentNode: '🛑 Stopped',
      }));
    }
  };

  const formatNodeName = (nodeName) => {
    return nodeName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return {
    streamState,
    startStreaming,
    stopStreaming,
    
    // Render methods
    renderProgress: () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {streamState.isStreaming ? (
              <Loader2 size={20} className="animate-spin text-primary-600" />
            ) : streamState.error ? (
              <AlertCircle size={20} className="text-error-600" />
            ) : (
              <CheckCircle size={20} className="text-success-600" />
            )}
            {streamState.isStreaming ? 'Processing Your Request' : 
             streamState.error ? 'Error Occurred' : 
             'Processing Complete'}
          </CardTitle>
          <CardDescription>
            {streamState.isStreaming ? 'Watch your request being processed in real-time' :
             streamState.error ? 'Something went wrong' :
             'Your request has been processed successfully'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Current Step */}
            {streamState.isStreaming && (
              <div className="p-4 bg-linear-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 size={20} className="animate-spin text-primary-600" />
                  <div>
                    <p className="text-xs font-medium text-primary-700 uppercase tracking-wide">
                      Current Step
                    </p>
                    <p className="text-lg font-bold text-primary-900 mt-1">
                      {streamState.currentNode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {streamState.error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-error-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-error-900 mb-1">
                      Error
                    </p>
                    <p className="text-sm text-error-700">
                      {streamState.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Event Timeline */}
            {showEvents && streamState.events.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                {streamState.events.map((event, index) => (
                  <StreamEventCard 
                    key={`event-${index}`}
                    event={event} 
                    index={index} 
                  />
                ))}
                <div ref={eventsEndRef} />
              </div>
            )}

            {/* Event counter */}
            {showEvents && (
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{streamState.events.length} event{streamState.events.length !== 1 ? 's' : ''} received</span>
                {streamState.threadId && (
                  <span className="font-mono">Thread: {streamState.threadId.split('_').pop()}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ),

    renderCompact: () => (
      <div className="space-y-3">
        {/* Compact Progress Bar */}
        <div className="flex items-center gap-3 p-3 bg-linear-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg">
          {streamState.isStreaming ? (
            <>
              <Loader2 size={18} className="animate-spin text-primary-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 truncate">
                  {streamState.currentNode}
                </p>
                <p className="text-xs text-primary-600">
                  {streamState.events.length} events processed
                </p>
              </div>
            </>
          ) : streamState.error ? (
            <>
              <AlertCircle size={18} className="text-error-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-error-900">Error</p>
                <p className="text-xs text-error-600 truncate">{streamState.error}</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle size={18} className="text-success-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-success-900">Complete</p>
                <p className="text-xs text-success-600">
                  {streamState.events.length} events processed
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    ),
  };
}

/**
 * Event Card Component
 */
function StreamEventCard({ event, index }) {
  const eventType = event.type;
  const eventData = event.data || {};
  
  const getEventIcon = (type) => {
    switch (type) {
      case 'connected':
        return <CheckCircle size={20} className="text-success-600" />;
      case 'message':
        return <MessageSquare size={20} className="text-primary-600" />;
      case 'intent_classified':
        return <Target size={20} className="text-secondary-600" />;
      case 'parameters_extracted':
        return <Package size={20} className="text-secondary-600" />;
      case 'suppliers_found':
        return <Building2 size={20} className="text-warning-600" />;
      case 'quote_generated':
      case 'message_drafted':
        return <FileText size={20} className="text-success-600" />;
      case 'node_progress':
        return <Clock size={20} className="text-primary-600" />;
      case 'workflow_complete':
        return <CheckCircle size={20} className="text-success-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-error-600" />;
      default:
        return <MessageSquare size={20} className="text-neutral-400" />;
    }
  };

  const getEventTitle = (type, data) => {
    switch (type) {
      case 'connected':
        return 'Connection Established';
      case 'message':
        return 'Message Received';
      case 'intent_classified':
        return `Intent: ${data.intent || 'Unknown'}`;
      case 'parameters_extracted':
        return 'Parameters Extracted';
      case 'suppliers_found':
        return `Found ${data.count || 0} Suppliers`;
      case 'quote_generated':
        return 'Quote Generated';
      case 'message_drafted':
        return 'Negotiation Message Drafted';
      case 'response_analyzed':
        return 'Supplier Response Analyzed';
      case 'node_progress':
        return formatNodeName(data.node || 'Processing');
      case 'workflow_complete':
        return 'Workflow Complete ✅';
      case 'error':
        return 'Error Occurred';
      default:
        return type;
    }
  };

  const formatNodeName = (nodeName) => {
    return nodeName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-neutral-200 shadow-sm animate-slideIn">
      <div className="shrink-0 mt-0.5">
        {getEventIcon(eventType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <p className="text-sm font-semibold text-neutral-900">
            {getEventTitle(eventType, eventData)}
          </p>
          <span className="text-xs text-neutral-400 ml-2">#{index + 1}</span>
        </div>
        
        {eventData.content && (
          <p className="text-sm text-neutral-600 mb-2 line-clamp-3">
            {eventData.content}
          </p>
        )}
        
        {eventData.status && (
          <p className="text-xs text-neutral-600 mb-1">
            <span className="font-semibold">Status:</span> {eventData.status}
          </p>
        )}
        
        {eventType === 'intent_classified' && (
          <div className="mt-2 space-y-1">
            {eventData.intent && (
              <p className="text-xs text-primary-600 font-medium">
                🎯 Intent: {eventData.intent}
              </p>
            )}
            {eventData.confidence && (
              <p className="text-xs text-primary-600 font-medium">
                📊 Confidence: {(eventData.confidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
        )}
        
        {eventType === 'parameters_extracted' && eventData.parameters && (
          <div className="mt-2 p-2 bg-neutral-50 rounded border border-neutral-200">
            <p className="text-xs text-neutral-600 font-medium mb-1">📋 Extracted Parameters:</p>
            <div className="space-y-1">
              {Object.entries(eventData.parameters).map(([key, value]) => (
                <div key={key} className="text-xs text-neutral-600">
                  <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {eventType === 'suppliers_found' && eventData.suppliers && (
          <div className="mt-2">
            <p className="text-xs text-neutral-600 mb-1 font-medium">🏢 Suppliers:</p>
            <div className="space-y-1">
              {eventData.suppliers.slice(0, 3).map((supplier, idx) => (
                <div key={idx} className="text-xs text-neutral-600 bg-warning-50 p-1 rounded">
                  <p><span className="font-semibold">{supplier.name}</span> - {supplier.location}</p>
                  {supplier.price && <p>Price: ${supplier.price}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {eventData.quote_id && (
          <p className="text-xs text-neutral-500 font-mono mt-1">
            📄 Quote ID: {eventData.quote_id}
          </p>
        )}
        
        {eventType === 'error' && eventData.error && (
          <p className="text-sm text-error-600 mt-1 bg-error-50 p-2 rounded">
            ❌ {eventData.error}
          </p>
        )}
        
        {eventData.timestamp && (
          <p className="text-xs text-neutral-400 mt-2">
            ⏱️ {new Date(eventData.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}