import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Book, ExternalLink } from 'lucide-react';
import { 
  getOfficialSourceUrl, 
  extractUrlFromSource, 
  getSourceDisplayName 
} from '../utils/qaHelpers';

interface SourcesSectionProps {
  sources: string[];
}

export function SourcesSection({ sources }: SourcesSectionProps) {
  if (sources.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900 flex items-center">
        <Book className="w-4 h-4 mr-2" />
        Források:
      </h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const existingUrl = extractUrlFromSource(source);
          const officialUrl = getOfficialSourceUrl(source);
          const displayName = getSourceDisplayName(source);
          
          // Priority: existing URL in source, then official source mapping
          const targetUrl = existingUrl || officialUrl;
          
          if (targetUrl) {
            return (
              <a
                key={index}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-mav-blue hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {displayName}
                </Badge>
              </a>
            );
          } else {
            return (
              <Badge
                key={index}
                variant="outline"
                className="text-xs"
              >
                {source}
              </Badge>
            );
          }
        })}
      </div>
    </div>
  );
}
