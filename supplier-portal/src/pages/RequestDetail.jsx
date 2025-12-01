import { useState, useEffect } from 'react';

// Mock API - replace with your actual API
const API_BASE = 'http://localhost:8000/api/v1/supplier';

function RequestDetailPage({ requestId, onBack }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responseType, setResponseType] = useState('accept');
  const [responseText, setResponseText] = useState('');
  const [responseData, setResponseData] = useState({
    new_price: '',
    new_lead_time: '',
    new_payment_terms: '',
  });

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`${API_BASE}/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRequest(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch request:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      alert('Please enter a response message');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('supplier_token');
      
      const response = await fetch(`${API_BASE}/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response_text: responseText,
          response_type: responseType,
          response_data: responseType === 'counteroffer' ? responseData : null
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('✅ Response submitted successfully! Workflow has been resumed.');
        onBack && onBack();
      } else {
        alert(`❌ Failed to submit response: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('❌ Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">Request not found</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">{request.request_subject}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Request ID: {request.request_id} • Round {request.conversation_round}
          </p>
        </div>

        {/* Request Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <InfoRow label="Type" value={request.request_type} />
            <InfoRow label="Priority" value={request.priority} />
            <InfoRow label="Status" value={request.status} />
            <InfoRow label="Created" value={new Date(request.created_at).toLocaleString()} />
            {request.expires_at && (
              <InfoRow 
                label="Expires" 
                value={new Date(request.expires_at).toLocaleString()}
                highlight={new Date(request.expires_at) < new Date()}
              />
            )}
          </div>
        </div>

        {/* Request Message */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Message</h2>
          </div>
          
          <div className="px-6 py-4">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{request.request_message}</p>
            </div>
          </div>
        </div>

        {/* Context Information */}
        {request.request_context && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Additional Context</h2>
            </div>
            
            <div className="px-6 py-4">
              <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(request.request_context, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Response Form (only if pending) */}
        {request.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-semibold text-gray-900">Submit Your Response</h2>
              <p className="text-sm text-gray-600 mt-1">
                Your response will automatically resume the workflow
              </p>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Response Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Response Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { value: 'accept', label: '✅ Accept', color: 'green' },
                    { value: 'counteroffer', label: '💬 Counteroffer', color: 'blue' },
                    { value: 'reject', label: '❌ Reject', color: 'red' },
                    { value: 'clarification', label: '❓ Need Clarification', color: 'yellow' },
                    { value: 'delay', label: '⏰ Request Delay', color: 'orange' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResponseType(option.value)}
                      className={`
                        px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                        ${responseType === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Counteroffer Fields (conditional) */}
              {responseType === 'counteroffer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    Counteroffer Terms
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Price (per unit)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={responseData.new_price}
                        onChange={(e) => setResponseData({...responseData, new_price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 4.50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Lead Time (days)
                      </label>
                      <input
                        type="number"
                        value={responseData.new_lead_time}
                        onChange={(e) => setResponseData({...responseData, new_lead_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms
                      </label>
                      <input
                        type="text"
                        value={responseData.new_payment_terms}
                        onChange={(e) => setResponseData({...responseData, new_payment_terms: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 50% advance"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Response Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Message *
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your detailed response here..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Provide a clear and professional response. This will be sent to the buyer.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !responseText.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Response & Resume Workflow'
                  )}
                </button>

                <button
                  onClick={onBack}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Already Responded */}
        {request.status === 'responded' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  ✅ Response Already Submitted
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  You responded on {new Date(request.responded_at).toLocaleString()}
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {request.supplier_response}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`text-sm ${highlight ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

export default RequestDetailPage;