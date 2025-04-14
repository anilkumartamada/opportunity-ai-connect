
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Application } from "@/types/database";

interface ApplicationCardProps {
  application: Application;
  getCategoryIcon: (category: string) => React.ReactNode;
  onViewDetails: (application: Application) => void;
}

export const ApplicationCard = ({ 
  application, 
  getCategoryIcon,
  onViewDetails 
}: ApplicationCardProps) => {
  return (
    <Card key={application.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{application.opportunity?.title}</CardTitle>
            <CardDescription className="mt-1">
              {application.opportunity?.platform}
            </CardDescription>
          </div>
          <Badge 
            variant={application.status === "applied" ? "default" : "outline"}
            className={application.status === "applied" ? "bg-green-600" : ""}
          >
            {application.status === "applied" ? (
              <span className="flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Applied
              </span>
            ) : (
              <span className="flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Due {new Date(application.opportunity?.deadline || "").toLocaleDateString()}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getCategoryIcon(application.opportunity?.category || "")}
            <span className="ml-1">{application.opportunity?.category}</span>
          </div>
        </div>
        
        {application.applied_at && (
          <div className="mb-4 text-xs text-muted-foreground">
            Applied on: {new Date(application.applied_at).toLocaleDateString()}
          </div>
        )}
        
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-1">
            {application.opportunity?.required_skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Match Score: {application.match_score}%</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full"
            onClick={() => onViewDetails(application)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
