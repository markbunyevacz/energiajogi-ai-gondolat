import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ErrorCode = 
  | 'CONTRACT_ANALYSIS_ERROR'
  | 'INVALID_CONTRACT_FORMAT'
  | 'MISSING_REQUIRED_SECTIONS'
  | 'INVALID_CONTRACT_STRUCTURE'
  | 'CONTRACT_PROCESSING_ERROR'
  | 'CONTRACT_VALIDATION_ERROR'
  | 'SYSTEM_UNSUPPORTED_ATTRIBUTE';

interface ErrorDisplayProps {
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
    severity: 'error' | 'warning' | 'info';
  };
}

const getErrorIcon = (code: ErrorCode, severity: 'error' | 'warning' | 'info') => {
  const baseClasses = "h-5 w-5";
  
  switch (severity) {
    case 'error':
      return <XCircle className={`${baseClasses} text-red-500`} />;
    case 'warning':
      return <AlertTriangle className={`${baseClasses} text-yellow-500`} />;
    case 'info':
      return <Info className={`${baseClasses} text-blue-500`} />;
    default:
      return <AlertCircle className={`${baseClasses} text-orange-500`} />;
  }
};

const getErrorTitle = (code: ErrorCode) => {
  switch (code) {
    case 'CONTRACT_ANALYSIS_ERROR':
      return 'Szerződés elemzési hiba';
    case 'INVALID_CONTRACT_FORMAT':
      return 'Érvénytelen szerződés formátum';
    case 'MISSING_REQUIRED_SECTIONS':
      return 'Hiányzó kötelező részek';
    case 'INVALID_CONTRACT_STRUCTURE':
      return 'Érvénytelen szerződés struktúra';
    case 'CONTRACT_PROCESSING_ERROR':
      return 'Szerződés feldolgozási hiba';
    case 'CONTRACT_VALIDATION_ERROR':
      return 'Szerződés validációs hiba';
    case 'SYSTEM_UNSUPPORTED_ATTRIBUTE':
      return 'Nem támogatott attribútum';
    default:
      return 'Ismeretlen hiba';
  }
};

const getErrorBackground = (severity: 'error' | 'warning' | 'info') => {
  switch (severity) {
    case 'error':
      return 'bg-red-50';
    case 'warning':
      return 'bg-yellow-50';
    case 'info':
      return 'bg-blue-50';
    default:
      return 'bg-red-50';
  }
};

const getErrorTextColor = (severity: 'error' | 'warning' | 'info') => {
  switch (severity) {
    case 'error':
      return 'text-red-800';
    case 'warning':
      return 'text-yellow-800';
    case 'info':
      return 'text-blue-800';
    default:
      return 'text-red-800';
  }
};

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  const bgColor = getErrorBackground(error.severity);
  const textColor = getErrorTextColor(error.severity);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{getErrorTitle(error.code)}</AlertTitle>
      <AlertDescription>
        {error.message}
        {error.details && (
          <div className="mt-2 text-sm">
            {error.details}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 