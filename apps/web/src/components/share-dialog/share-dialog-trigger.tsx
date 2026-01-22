"use client";

import { useState } from "react";
import { ShareDialog } from "./share-dialog";
import { Button } from "@legal/ui";
import { Share2 } from "lucide-react";

interface ShareDialogTriggerProps {
  documentId: string;
  documentTitle: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Share Dialog Trigger Component
 *
 * Button that opens the share dialog for a document.
 * Can be used with default content or custom children.
 */
export function ShareDialogTrigger({
  documentId,
  documentTitle,
  variant = "default",
  size = "default",
  className,
  children,
}: ShareDialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        {children || (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </>
        )}
      </Button>
      <ShareDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        documentId={documentId}
        documentTitle={documentTitle}
      />
    </>
  );
}
