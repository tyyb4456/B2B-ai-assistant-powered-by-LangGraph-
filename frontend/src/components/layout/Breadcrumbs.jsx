// src/components/layout/Breadcrumbs.jsx
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const { threadId } = useParams();
  
  // Don't show on home page
  if (location.pathname === '/') return null;

  const getBreadcrumbs = () => {
    const path = location.pathname;
    
    if (path === '/conversation') {
      return [{ label: 'New Conversation', href: '/conversation' }];
    }
    
    if (path.startsWith('/conversation/') && threadId) {
      if (path.includes('/details')) {
        return [
          { label: 'Conversation', href: `/conversation/${threadId}` },
          { label: 'Details', href: `/conversation/${threadId}/details` }
        ];
      }
      return [{ label: 'Conversation', href: `/conversation/${threadId}` }];
    }
    
    if (path === '/history') {
      return [{ label: 'History', href: '/history' }];
    }
    
    if (path === '/negotiations') {
      return [{ label: 'Negotiations', href: '/negotiations' }];
    }
    
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  
  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-neutral-600 mb-4" aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="hover:text-neutral-900 transition-colors flex items-center"
      >
        <Home size={14} />
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center space-x-2">
          <ChevronRight size={14} className="text-neutral-400" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-neutral-900 font-medium">{crumb.label}</span>
          ) : (
            <Link 
              to={crumb.href}
              className="hover:text-neutral-900 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}