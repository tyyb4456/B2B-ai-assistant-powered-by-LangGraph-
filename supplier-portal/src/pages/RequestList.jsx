/**
 * Request List Page - Shows all requests with filtering
 * 
 * Location: supplier-portal/src/pages/RequestList.jsx
 */

import { useState, useMemo } from 'react';
import { useRequests } from '../api/hooks';
import Card, { CardHeader, CardTitle, CardContent, EmptyCard } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import { StatusBadge, PriorityBadge, RequestTypeBadge } from '../components/ui/Badge';
import { FullPageSpinner } from '../components/ui/Spinner';

export default function RequestList({ onRequestClick }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch requests
  const { data, isLoading, error, refetch } = useRequests({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const requests = data?.requests || [];

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.request_subject?.toLowerCase().includes(query) ||
        req.request_id?.toLowerCase().includes(query) ||
        req.request_type?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'expires_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [requests, searchQuery, sortBy, sortOrder]);

  // Loading state
  if (isLoading) {
    return <FullPageSpinner message="Loading requests..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Load Requests
              </h3>
              <p className="text-gray-600 mb-6">{error.message}</p>
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Requests</h1>
        <p className="text-gray-600 mt-1">
          View and manage all your procurement requests
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                placeholder="Search by subject, ID, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'responded', label: 'Responded' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />

            {/* Sort By */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'created_at', label: 'Date Created' },
                { value: 'expires_at', label: 'Expiry Date' },
                { value: 'priority', label: 'Priority' },
                { value: 'request_subject', label: 'Subject' },
              ]}
            />
          </div>

          {/* Sort Order Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredRequests.length}</span> of{' '}
              <span className="font-semibold">{requests.length}</span> requests
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              leftIcon={
                sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )
              }
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <EmptyCard
          icon="📭"
          title={searchQuery ? 'No Matching Requests' : 'No Requests Found'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'You have no requests at the moment'
          }
          action={
            searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear Search
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.request_id}
              request={request}
              onClick={() => onRequestClick && onRequestClick(request.request_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// REQUEST CARD COMPONENT
// ============================================

function RequestCard({ request, onClick }) {
  const isExpiringSoon = request.expires_at && 
    new Date(request.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <Card
      hoverable
      onClick={onClick}
      className="transition-all"
    >
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          {/* Left: Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              {/* Icon */}
              <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  {request.request_type === 'negotiation' ? '💬' :
                   request.request_type === 'clarification' ? '❓' : '📄'}
                </span>
              </div>

              {/* Title and ID */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {request.request_subject}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  ID: {request.request_id} • Round {request.conversation_round}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
              <RequestTypeBadge type={request.request_type} />
            </div>

            {/* Dates */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Created {formatDate(request.created_at)}</span>
              </div>

              {request.expires_at && (
                <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'text-red-600 font-medium' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Expires {formatDate(request.expires_at)}
                    {isExpiringSoon && ' ⚠️'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Button */}
          <div className="shrink-0">
            <Button variant="outline" size="sm">
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}