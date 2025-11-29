import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationComprehensive, useConversationMessages, useConversationStatus } from '../api/hooks';
import * as api from '../api/endpoints';
import StreamingConversation from '../components/features/StreamingConversation';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { 
  ArrowLeft, 
  Send, 
  Zap, 
  MessageSquare,
  FileText,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
} from 'lucide-react';
import { STATUS_CONFIG } from '../utils/constants';

export default function ConversationDetail() {
  const { threadId } = useParams();
  const navigate = useNavigate();

  // Fetch conversation data
  const { data: conversation, isLoading, refetch } = useConversationComprehensive(threadId);
  const { data: messagesData, refetch: refetchMessages } = useConversationMessages(threadId);
  const { data: statusData } = useConversationStatus(threadId, { 
    refetchInterval: 5000 // Poll every 5 seconds
  });

  // Form states
  const [continueInput, setContinueInput] = useState('');
  const [resumeInput, setResumeInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | continue | resume

  // Streaming setup
  const streaming = StreamingConversation({
    onComplete: (completedThreadId, events) => {
      console.log('[ConversationDetail] ✅ Streaming completed', completedThreadId, events.length);
      
      // Refetch conversation data
      refetch();
      refetchMessages();
      
      // Reset forms
      setContinueInput('');
      setResumeInput('');
      
      // Switch back to overview
      setTimeout(() => {
        setActiveTab('overview');
      }, 2000);
    },
    onError: (error) => {
      console.error('[ConversationDetail] ❌ Streaming error:', error);
    },
    showEvents: true,
  });

  // Handle Continue Conversation (with streaming)
  const handleContinue = () => {
    if (!continueInput.trim()) return;

    console.log('[ConversationDetail] 🚀 Starting continue stream');
    
    streaming.startStreaming((onEvent, onComplete, onError) => {
      return api.continueConversationStream(
        threadId,
        continueInput,
        onEvent,
        onComplete,
        onError
      );
    });
  };

  // Handle Resume Conversation (with streaming)
  const handleResume = () => {
    if (!resumeInput.trim()) return;

    console.log('[ConversationDetail] 🚀 Starting resume stream');
    
    streaming.startStreaming((onEvent, onComplete, onError) => {
      return api.resumeConversationStream(
        threadId,
        resumeInput,
        onEvent,
        onComplete,
        onError
      );
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <XCircle size={48} className="mx-auto text-error-600 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Conversation Not Found
              </h3>
              <p className="text-neutral-600 mb-6">
                The conversation you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaused = conversation.is_paused;
  const status = conversation.status;
  const intent = conversation.intent;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Conversation Details</h1>
            <p className="text-sm text-neutral-600 font-mono mt-1">
              Thread: {threadId}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {isPaused && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning-50 border border-warning-200 rounded-lg">
              <Pause size={16} className="text-warning-600" />
              <span className="text-sm font-medium text-warning-900">Paused</span>
            </div>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-200">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={<FileText size={16} />}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeTab === 'messages'}
          onClick={() => setActiveTab('messages')}
          icon={<MessageSquare size={16} />}
        >
          Messages
        </TabButton>
        <TabButton
          active={activeTab === 'continue'}
          onClick={() => setActiveTab('continue')}
          icon={<Send size={16} />}
          disabled={isPaused}
        >
          Continue
        </TabButton>
        {isPaused && (
          <TabButton
            active={activeTab === 'resume'}
            onClick={() => setActiveTab('resume')}
            icon={<Play size={16} />}
          >
            Resume
          </TabButton>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab conversation={conversation} />
        )}

        {activeTab === 'messages' && (
          <MessagesTab messages={messagesData?.messages || []} />
        )}

        {activeTab === 'continue' && !streaming.streamState.isStreaming && (
          <ContinueTab
            input={continueInput}
            setInput={setContinueInput}
            onSubmit={handleContinue}
            disabled={isPaused}
          />
        )}

        {activeTab === 'resume' && !streaming.streamState.isStreaming && (
          <ResumeTab
            input={resumeInput}
            setInput={setResumeInput}
            onSubmit={handleResume}
          />
        )}

        {/* Streaming Progress */}
        {streaming.streamState.isStreaming && (
          <div className="space-y-4">
            {streaming.renderProgress()}
            <Button
              variant="outline"
              onClick={streaming.stopStreaming}
              fullWidth
            >
              Stop Processing
            </Button>
          </div>
        )}

        {/* Completion Message */}
        {!streaming.streamState.isStreaming && 
         streaming.streamState.events.length > 0 && 
         !streaming.streamState.error && (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-success-600 mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {activeTab === 'continue' ? 'Conversation Continued!' : 'Conversation Resumed!'}
                </h3>
                <p className="text-neutral-600 mb-4">
                  Your request has been processed successfully
                </p>
                <Button onClick={() => setActiveTab('overview')}>
                  View Updated Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function OverviewTab({ conversation }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <InfoRow label="Intent" value={conversation.intent || 'Unknown'} />
            <InfoRow label="Status" value={conversation.status} />
            <InfoRow 
              label="Created" 
              value={new Date(conversation.created_at).toLocaleString()} 
            />
            <InfoRow 
              label="Updated" 
              value={new Date(conversation.updated_at).toLocaleString()} 
            />
            {conversation.next_step && (
              <InfoRow label="Next Step" value={conversation.next_step} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Parameters */}
      {conversation.extracted_parameters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={18} />
              Extracted Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversation.extracted_parameters.fabric_details && (
                <>
                  <InfoRow 
                    label="Fabric Type" 
                    value={conversation.extracted_parameters.fabric_details.type} 
                  />
                  <InfoRow 
                    label="Quantity" 
                    value={`${conversation.extracted_parameters.fabric_details.quantity} ${conversation.extracted_parameters.fabric_details.unit}`} 
                  />
                  <InfoRow 
                    label="Urgency" 
                    value={conversation.extracted_parameters.urgency_level} 
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote Info */}
      {conversation.quote && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} />
              Quote Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">Quote ID:</span>
                <span className="text-sm font-mono text-neutral-900">{conversation.quote.quote_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">Options:</span>
                <span className="text-sm text-neutral-900">{conversation.quote.total_options_count} suppliers</span>
              </div>
              {conversation.quote.estimated_savings && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-700">Potential Savings:</span>
                  <span className="text-sm font-semibold text-success-600">
                    {conversation.quote.estimated_savings}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Info */}
      {conversation.negotiation && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Negotiation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow 
                label="Rounds" 
                value={conversation.negotiation.negotiation_rounds} 
              />
              <InfoRow 
                label="Status" 
                value={conversation.negotiation.negotiation_status} 
              />
              {conversation.negotiation.negotiation_topic && (
                <InfoRow 
                  label="Topic" 
                  value={conversation.negotiation.negotiation_topic} 
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MessagesTab({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12 text-neutral-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-neutral-400" />
            <p>No messages yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message History</CardTitle>
        <CardDescription>{messages.length} messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              <div className="flex items-start gap-3">
                <MessageSquare size={16} className="text-primary-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary-700 uppercase">
                      {msg.role || 'Assistant'}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-neutral-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-700">{msg.content}</p>
                  {msg.node && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Node: {msg.node}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContinueTab({ input, setInput, onSubmit, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send size={18} />
          Continue Conversation
        </CardTitle>
        <CardDescription>
          Send a new message to continue this conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="What would you like to do next? (e.g., 'Can you improve the lead time?')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            disabled={disabled}
          />
          <div className="flex gap-3">
            <Button
              onClick={onSubmit}
              disabled={!input.trim() || disabled}
              leftIcon={<Zap size={18} />}
              fullWidth
            >
              Continue with Live Updates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResumeTab({ input, setInput, onSubmit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play size={18} />
          Resume Negotiation
        </CardTitle>
        <CardDescription>
          Provide the supplier's response to continue negotiation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="Paste the supplier's response here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
          />
          <div className="flex gap-3">
            <Button
              onClick={onSubmit}
              disabled={!input.trim()}
              leftIcon={<Zap size={18} />}
              fullWidth
            >
              Resume with Live Updates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

function TabButton({ active, onClick, icon, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2 border-b-2 transition-all
        ${active 
          ? 'border-primary-600 text-primary-700 font-medium' 
          : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { color: 'neutral', label: status };
  
  const colorClasses = {
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    error: 'bg-error-50 text-error-700 border-error-200',
    info: 'bg-primary-50 text-primary-700 border-primary-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg border ${colorClasses[config.color] || colorClasses.neutral}`}>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <span className="text-sm text-neutral-900">{value}</span>
    </div>
  );
}

