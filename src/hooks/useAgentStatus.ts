import { useState, useEffect } from 'react';

interface AgentStatus {
  status: string;
  lastActive: string | null;
  isOnline: boolean;
}

export function useAgentStatus(agentId: string): AgentStatus {
  const [status, setStatus] = useState<string>('Offline');
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    // TODO: Implement actual agent status monitoring
    // This is a placeholder implementation
    const checkStatus = () => {
      // Simulate status check
      const isAgentOnline = Math.random() > 0.5;
      setIsOnline(isAgentOnline);
      setStatus(isAgentOnline ? 'Online' : 'Offline');
      if (isAgentOnline) {
        setLastActive(new Date().toISOString());
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [agentId]);

  return { status, lastActive, isOnline };
} 