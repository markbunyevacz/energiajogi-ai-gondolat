import React from 'react';
import { cn } from '@/lib/utils';

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  date?: string;
  icon?: React.ReactNode;
}

export function Timeline({ children, className, ...props }: TimelineProps) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {children}
    </div>
  );
}

export function TimelineItem({ 
  title, 
  description, 
  date, 
  icon,
  className,
  ...props 
}: TimelineItemProps) {
  return (
    <div className={cn("relative pl-8", className)} {...props}>
      {/* Timeline marker */}
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
        {icon || (
          <div className="h-2 w-2 rounded-full bg-blue-600" />
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {date && (
            <time className="text-xs text-gray-500">{date}</time>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
} 