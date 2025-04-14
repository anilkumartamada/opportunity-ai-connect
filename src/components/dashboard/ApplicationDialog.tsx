
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/database";

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
}

export const ApplicationDialog = ({ open, onOpenChange, application }: ApplicationDialogProps) => {
  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{application.opportunity?.title}</DialogTitle>
          <DialogDescription>
            {application.opportunity?.platform} • {application.opportunity?.category}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Badge variant={application.status === 'applied' ? "default" : "outline"}>
                {application.status}
              </Badge>
              <Badge variant="outline">
                Match: {application.match_score}%
              </Badge>
            </div>
            {application.applied_at && (
              <p className="text-sm text-muted-foreground">
                Applied on {new Date(application.applied_at).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Cover Letter</h3>
            <div className="whitespace-pre-wrap rounded-md border p-4 text-sm">
              {application.cover_letter}
            </div>
          </div>
          
          {application.opportunity?.application_url && (
            <div className="pt-4">
              <a 
                href={application.opportunity.application_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-brand-600 hover:underline text-sm"
              >
                View original posting
              </a>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
