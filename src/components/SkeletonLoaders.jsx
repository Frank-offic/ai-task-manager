import React from 'react';

// Base skeleton component
const Skeleton = ({ className = "", width = "w-full", height = "h-4" }) => (
  <div className={`${width} ${height} bg-gray-700 rounded animate-pulse ${className}`} />
);

// Task List Skeleton
export const TaskListSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <Skeleton width="w-5" height="h-5" className="rounded" />
              <div className="flex-1">
                <Skeleton width="w-3/4" height="h-5" className="mb-2" />
                <Skeleton width="w-1/2" height="h-3" />
              </div>
            </div>
            <div className="flex items-center gap-2 pl-8">
              <Skeleton width="w-16" height="h-6" className="rounded-full" />
              <Skeleton width="w-20" height="h-6" className="rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton width="w-6" height="h-6" />
            <Skeleton width="w-6" height="h-6" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Kanban Board Skeleton
export const KanbanSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {['To Do', 'Completed'].map((title) => (
      <div key={title} className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="w-24" height="h-6" />
          <Skeleton width="w-8" height="h-6" className="rounded-full" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded-lg border-l-4 border-gray-600">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton width="w-3/4" height="h-4" className="mb-2" />
                  <Skeleton width="w-1/2" height="h-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton width="w-5" height="h-5" className="rounded" />
                  <Skeleton width="w-5" height="h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Calendar Skeleton
export const CalendarSkeleton = () => (
  <div className="bg-gray-800 rounded-lg p-6">
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="w-32" height="h-8" />
      <div className="flex gap-2">
        <Skeleton width="w-8" height="h-8" className="rounded" />
        <Skeleton width="w-8" height="h-8" className="rounded" />
      </div>
    </div>
    
    {/* Calendar grid */}
    <div className="grid grid-cols-7 gap-1 mb-4">
      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
        <div key={day} className="p-2 text-center">
          <Skeleton width="w-6" height="h-4" className="mx-auto" />
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-7 gap-1">
      {[...Array(35)].map((_, i) => (
        <div key={i} className="aspect-square p-1">
          <Skeleton width="w-full" height="h-full" className="rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Analytics Skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-800 p-4 rounded-lg">
          <Skeleton width="w-16" height="h-4" className="mb-2" />
          <Skeleton width="w-12" height="h-8" />
        </div>
      ))}
    </div>
    
    <div className="bg-gray-800 p-6 rounded-lg">
      <Skeleton width="w-32" height="h-6" className="mb-4" />
      <Skeleton width="w-full" height="h-64" className="rounded" />
    </div>
  </div>
);

// Search Results Skeleton
export const SearchSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-gray-800 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <Skeleton width="w-4" height="h-4" className="rounded" />
          <div className="flex-1">
            <Skeleton width="w-3/4" height="h-4" className="mb-1" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
