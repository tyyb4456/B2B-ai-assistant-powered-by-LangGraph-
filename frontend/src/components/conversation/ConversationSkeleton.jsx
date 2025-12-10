// src/components/conversation/ConversationSkeleton.jsx
export default function ConversationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
          {/* Avatar skeleton */}
          <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
          
          {/* Message skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-20" />
            <div className="bg-neutral-200 rounded-2xl p-4 space-y-2 max-w-[70%]">
              <div className="h-4 bg-neutral-300 rounded w-full" />
              <div className="h-4 bg-neutral-300 rounded w-4/5" />
              <div className="h-4 bg-neutral-300 rounded w-3/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}