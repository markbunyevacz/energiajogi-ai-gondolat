import { Badge, BadgeProps } from "@/components/ui/badge";
import { Brain, FileText, Search, Shield } from 'lucide-react';
import { AgentType } from '@/services/aiAgentRouter';

interface AgentIndicatorProps {
  agentType: AgentType;
  confidence: number;
  reasoning: string;
}

export function AgentIndicator({ agentType, confidence, reasoning }: AgentIndicatorProps) {
  const getAgentConfig = (type: AgentType) => {
    const configs = {
      contract: {
        icon: FileText,
        label: 'Szerződés Ágens',
        color: 'bg-blue-100 text-blue-800'
      },
      legal_research: {
        icon: Search,
        label: 'Jogi Kutatás Ágens',
        color: 'bg-green-100 text-green-800'
      },
      compliance: {
        icon: Shield,
        label: 'Megfelelőségi Ágens',
        color: 'bg-orange-100 text-orange-800'
      },
      general: {
        icon: Brain,
        label: 'Általános Ágens',
        color: 'bg-gray-100 text-gray-800'
      }
    };

    return configs[type];
  };

  const config = getAgentConfig(agentType);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
      <Icon className="w-5 h-5 text-mav-blue" />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <Badge className={config.color}>
            {config.label}
          </Badge>
          <Badge variant="outline">
            {Math.round(confidence * 100)}% megbízhatóság
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{reasoning}</p>
      </div>
    </div>
  );
}
