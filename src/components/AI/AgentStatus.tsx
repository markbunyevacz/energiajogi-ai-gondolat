import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from 'lucide-react';
import { useAgentStatus } from '@/hooks/useAgentStatus';

interface AgentStatusProps {
  agentId: string;
}

export function AgentStatus({ agentId }: AgentStatusProps) {
  const { status, lastActive, isOnline } = useAgentStatus(agentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Active</span>
            <span className="text-sm text-muted-foreground">
              {lastActive ? new Date(lastActive).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 