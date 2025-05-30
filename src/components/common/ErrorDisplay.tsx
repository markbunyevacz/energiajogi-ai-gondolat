import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { ErrorCode, ErrorResponse } from '@/types/errors';

interface ErrorDisplayProps {
  error: ErrorResponse;
  onDismiss?: () => void;
  onRetry?: () => void;
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
    // Contract Analysis Errors
    case 'CONTRACT_ANALYSIS_FAILED':
      return 'Szerződés Elemzési Hiba';
    case 'RISK_ANALYSIS_FAILED':
      return 'Kockázatelemzési Hiba';
    case 'IMPROVEMENT_SUGGESTION_FAILED':
      return 'Javaslat Generálási Hiba';
    case 'CONTRACT_VALIDATION_FAILED':
      return 'Szerződés Validációs Hiba';
    
    // API and Network Errors
    case 'API_ERROR':
      return 'API Hiba';
    case 'NETWORK_ERROR':
      return 'Hálózati Hiba';
    case 'RATE_LIMIT_ERROR':
      return 'Kérés Limit Hiba';
    case 'AUTHENTICATION_ERROR':
      return 'Hitelesítési Hiba';
    
    // Document Processing Errors
    case 'DOCUMENT_PROCESSING_ERROR':
      return 'Dokumentum Feldolgozási Hiba';
    case 'OCR_ERROR':
      return 'OCR Feldolgozási Hiba';
    case 'PDF_PROCESSING_ERROR':
      return 'PDF Feldolgozási Hiba';
    
    // Validation Errors
    case 'VALIDATION_ERROR':
      return 'Validációs Hiba';
    case 'INVALID_INPUT':
      return 'Érvénytelen Bemenet';
    case 'MISSING_REQUIRED_FIELD':
      return 'Hiányzó Kötelező Mező';
    
    // System Errors
    case 'SYSTEM_ERROR':
      return 'Rendszer Hiba';
    case 'DATABASE_ERROR':
      return 'Adatbázis Hiba';
    case 'CONFIGURATION_ERROR':
      return 'Konfigurációs Hiba';
    
    default:
      return 'Hiba';
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

export function ErrorDisplay({ error, onDismiss, onRetry }: ErrorDisplayProps) {
  const bgColor = getErrorBackground(error.severity);
  const textColor = getErrorTextColor(error.severity);

  return (
    <div className={`rounded-md ${bgColor} p-4 mb-4 shadow-sm`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon(error.code, error.severity)}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${textColor}`}>
              {getErrorTitle(error.code)}
            </h3>
            <div className="flex items-center space-x-2">
              {error.retryable && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Újrapróbálás
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  <span className="sr-only">Bezárás</span>
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <div className={`mt-2 text-sm ${textColor}`}>
            <p>{error.message}</p>
            {error.details && (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs font-medium hover:underline"
                  onClick={() => {
                    const detailsElement = document.getElementById('error-details');
                    if (detailsElement) {
                      detailsElement.classList.toggle('hidden');
                    }
                  }}
                >
                  Részletek megjelenítése
                </button>
                <pre
                  id="error-details"
                  className="mt-2 text-xs bg-white/50 p-2 rounded hidden"
                >
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </div>
            )}
            {error.action && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={error.action.onClick}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {error.action.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 