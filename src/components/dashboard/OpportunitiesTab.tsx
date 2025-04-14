
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { OpportunityCard } from "./OpportunityCard";
import { Opportunity } from "@/types/database";

interface OpportunitiesTabProps {
  opportunities: Opportunity[];
  isAutoApplying: boolean;
  getCategoryIcon: (category: string) => React.ReactNode;
  onAutoApplyAll: () => void;
  onApply: (opportunity: Opportunity) => void;
}

export const OpportunitiesTab = ({ 
  opportunities, 
  isAutoApplying, 
  getCategoryIcon, 
  onAutoApplyAll, 
  onApply 
}: OpportunitiesTabProps) => {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Opportunities Matched to Your Profile</h2>
          <p className="text-muted-foreground">
            We've found {opportunities.length} opportunities that match your skills and interests.
          </p>
        </div>
        
        {opportunities.length > 0 && (
          <Button 
            onClick={onAutoApplyAll}
            disabled={isAutoApplying}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isAutoApplying ? "Applying..." : "Auto-Apply to All Matches"}
          </Button>
        )}
      </div>
      
      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              getCategoryIcon={getCategoryIcon}
              onApply={onApply}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            No matched opportunities found. Update your profile with more skills to see matches.
          </p>
        </div>
      )}
    </>
  );
};
