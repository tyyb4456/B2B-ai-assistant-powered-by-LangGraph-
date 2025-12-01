/**
 * Reusable Badge Component for Supplier Portal
 * 
 * Location: supplier-portal/src/components/ui/Badge.jsx
 */

import { clsx } from 'clsx';

const variants = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  primary: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

// Main Badge Component
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon = null,
  dot = false,
  removable = false,
  onRemove,
  ...props
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="w-2 h-2 rounded-full bg-current opacity-75" />
      )}
      
      {/* Icon */}
      {icon && (
        <span className="shrink-0">{icon}</span>
      )}
      
      {/* Content */}
      <span>{children}</span>
      
      {/* Remove button */}
      {removable && (
        <button
          onClick={onRemove}
          className="shrink-0 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
          type="button"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Status Badge (with predefined status mappings)
export function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    pending: { variant: 'warning', label: 'Pending', icon: '⏳' },
    responded: { variant: 'success', label: 'Responded', icon: '✅' },
    expired: { variant: 'danger', label: 'Expired', icon: '⏰' },
    cancelled: { variant: 'default', label: 'Cancelled', icon: '❌' },
    processing: { variant: 'info', label: 'Processing', icon: '⚙️' },
    completed: { variant: 'success', label: 'Completed', icon: '🎉' },
  };

  const config = statusConfig[status] || { 
    variant: 'default', 
    label: status, 
    icon: '•' 
  };

  return (
    <Badge variant={config.variant} className={className}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}

// Priority Badge
export function PriorityBadge({ priority, className = '' }) {
  const priorityConfig = {
    low: { variant: 'default', label: 'Low', icon: '📊' },
    medium: { variant: 'primary', label: 'Medium', icon: '📈' },
    high: { variant: 'warning', label: 'High', icon: '⚠️' },
    urgent: { variant: 'danger', label: 'Urgent', icon: '🔥' },
  };

  const config = priorityConfig[priority] || { 
    variant: 'default', 
    label: priority, 
    icon: '•' 
  };

  return (
    <Badge variant={config.variant} className={className}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}

// Request Type Badge
export function RequestTypeBadge({ type, className = '' }) {
  const typeConfig = {
    negotiation: { variant: 'primary', label: 'Negotiation', icon: '💬' },
    clarification: { variant: 'info', label: 'Clarification', icon: '❓' },
    quote_confirmation: { variant: 'success', label: 'Quote Confirmation', icon: '📄' },
  };

  const config = typeConfig[type] || { 
    variant: 'default', 
    label: type, 
    icon: '📋' 
  };

  return (
    <Badge variant={config.variant} className={className}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}

// Notification Badge (with count)
export function NotificationBadge({ count, className = '' }) {
  if (!count || count === 0) return null;

  return (
    <Badge 
      variant="danger" 
      size="sm" 
      className={clsx('font-bold', className)}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

// Badge Group (for multiple badges)
export function BadgeGroup({ children, className = '' }) {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}