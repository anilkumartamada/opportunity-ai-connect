
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Opportunity } from "@/types/database";

interface OpportunityCardProps {
  opportunity: Opportunity;
  getCategoryIcon: (category: string) => React.ReactNode;
  onApply: (opportunity: Opportunity) => void;
}

export const OpportunityCard = ({ 
  opportunity, 
  getCategoryIcon,
  onApply 
}: OpportunityCardProps) => {
  return (
    <Card key={opportunity.id} className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{opportunity.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              {opportunity.platform}
            </CardDescription>
            {opportunity.company && (
              <p className="text-sm font-medium mt-1">{opportunity.company}</p>
            )}
          </div>
          <Badge 
            variant={opportunity.match_score && opportunity.match_score >= 90 ? "default" : "outline"}
            className={opportunity.match_score && opportunity.match_score >= 90 ? "bg-green-600" : ""}
          >
            {opportunity.match_score || 0}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Due {new Date(opportunity.deadline).toLocaleDateString()}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getCategoryIcon(opportunity.category)}
            <span className="ml-1">{opportunity.category}</span>
          </div>
        </div>
        
        <div className="mb-4 flex-1">
          <p className="text-sm font-medium mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-1">
            {opportunity.required_skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={() => onApply(opportunity)}
          className="w-full mt-2"
        >
          Auto-Apply with AI
        </Button>
      </CardContent>
    </Card>
  );
};
