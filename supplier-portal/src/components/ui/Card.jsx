/**
 * Reusable Card Component for Supplier Portal
 * 
 * Location: supplier-portal/src/components/ui/Card.jsx
 */

import { clsx } from 'clsx';

// Main Card Component
export default function Card({
  children,
  className = '',
  padding = 'default',
  hoverable = false,
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border border-gray-200',
        paddingClasses[padding],
        hoverable && 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  );
}

// Card Title
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}

// Card Description
export function CardDescription({ children, className = '' }) {
  return (
    <p className={clsx('text-sm text-gray-600 mt-1', className)}>
      {children}
    </p>
  );
}

// Card Content
export function CardContent({ children, className = '' }) {
  return (
    <div className={clsx('space-y-4', className)}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('mt-6 flex items-center gap-3', className)}>
      {children}
    </div>
  );
}

// Stats Card (for dashboard)
export function StatsCard({ title, value, icon, color = 'blue', trend, className = '' }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <Card className={clsx(colorClasses[color], className)} padding="default">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={clsx(
              'text-sm mt-2 flex items-center gap-1',
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-4xl">{icon}</div>
        )}
      </div>
    </Card>
  );
}

// Empty State Card
export function EmptyCard({ icon, title, description, action, className = '' }) {
  return (
    <Card className={className} padding="lg">
      <div className="text-center py-8">
        {icon && (
          <div className="text-6xl mb-4 opacity-50">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}
        {action}
      </div>
    </Card>
  );
}