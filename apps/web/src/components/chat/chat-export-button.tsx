'use client';

import { useState } from 'react';
import { Download, FileText, Code, Loader2, Check } from 'lucide-react';
import { useChatExport, type ChatExportFormat } from '@/hooks/use-chat-export';
import { cn } from '@legal/ui';

interface ChatExportButtonProps {
  sessionId: string;
  title?: string;
  variant?: 'button' | 'menu';
  className?: string;
}

/**
 * Chat Export Button Component
 *
 * Provides UI for exporting chat sessions to PDF, Markdown, or JSON format.
 * Can be displayed as a simple button or a dropdown menu with format options.
 */
export function ChatExportButton({
  sessionId,
  title,
  variant = 'menu',
  className,
}: ChatExportButtonProps) {
  const { exportSession, isExporting } = useChatExport();
  const [showMenu, setShowMenu] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<ChatExportFormat | null>(null);

  const formats: Array<{
    key: ChatExportFormat;
    label: string;
    description: string;
    icon: typeof FileText | typeof Code;
    extension: string;
  }> = [
    {
      key: 'PDF',
      label: 'PDF',
      description: 'Formatted document',
      icon: FileText,
      extension: 'pdf',
    },
    {
      key: 'MARKDOWN',
      label: 'Markdown',
      description: 'Clean .md file',
      icon: FileText,
      extension: 'md',
    },
    {
      key: 'JSON',
      label: 'JSON',
      description: 'Raw data export',
      icon: Code,
      extension: 'json',
    },
  ];

  const handleExport = async (format: ChatExportFormat) => {
    setExportedFormat(null);
    setShowMenu(false);

    const filename = title
      ? `${title.replace(/[^a-z0-9а-яєїіґҐЄЇІА-Яё\s-]/gi, '').substring(0, 50)}`
      : undefined;

    try {
      await exportSession(sessionId, format, filename);
      setExportedFormat(format);
      setTimeout(() => setExportedFormat(null), 2000);
    } catch {
      // Error is handled by the hook
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleExport('PDF')}
        disabled={isExporting}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1.5" />
            Export PDF
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Export Button with Dropdown */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : exportedFormat ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>{isExporting ? 'Exporting...' : exportedFormat ? 'Exported!' : 'Export'}</span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-1">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.key}
                    onClick={() => handleExport(format.key)}
                    className="w-full flex items-start gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{format.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {format.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
