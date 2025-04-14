import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Briefcase, Award, Calendar } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Opportunity, Application, Profile } from "@/types/database";
import { OpportunitiesTab } from "@/components/dashboard/OpportunitiesTab";
import { ApplicationsTab } from "@/components/dashboard/ApplicationsTab";
import { generateCoverLetter } from "@/utils/coverLetterGenerator";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [filter, setFilter] = useState("all");
  
  const {
    matchedOpportunities,
    applications,
    isLoading,
    fetchData
  } = useDashboardData(user?.id);
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'internship':
        return <Briefcase className="h-4 w-4" />;
      case 'hackathon':
        return <Award className="h-4 w-4" />;
      case 'workshop':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };
  
  const handleAutoApplyAll = async () => {
    if (!user) return;
    
    setIsAutoApplying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-apply', {
        body: { userId: user.id }
      });
      
      if (error) throw error;
      
      toast.success(data.message || "Auto-applied to all matched opportunities!");
      
      fetchData();
    } catch (error) {
      console.error("Error auto-applying:", error);
      toast.error("Failed to auto-apply to all opportunities");
    } finally {
      setIsAutoApplying(false);
    }
  };
  
  const handleApply = async (opportunity: Opportunity) => {
    if (!user) return;
    
    try {
      const coverLetter = generateCoverLetter(null, opportunity);
      
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: user.id,
          opportunity_id: opportunity.id,
          status: 'pending',
          match_score: opportunity.match_score || 0,
          cover_letter: coverLetter
        }])
        .select();
      
      if (error) throw error;
      
      toast.success(`Applied to ${opportunity.title}!`);
      
      fetchData();
    } catch (error) {
      console.error("Error applying:", error);
      toast.error(`Failed to apply to ${opportunity.title}`);
    }
  };

  const handleViewApplicationDetails = (application: Application) => {
    setSelectedApplication(application);
    setDialogOpen(true);
  };
  
  const handleGenerateCoverLetter = () => {
    if (selectedApplication && selectedApplication.opportunity) {
      setCoverLetter(generateCoverLetter(null, selectedApplication.opportunity));
    }
  };
  
  const handleMarkAsApplied = async () => {
    if (!selectedApplication) return;
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'applied' })
        .eq('id', selectedApplication.id);
      
      if (error) throw error;
      
      toast.success("Application marked as applied!");
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error marking as applied:", error);
      toast.error("Failed to mark application as applied");
    }
  };
  
  if (loading || isLoading) {
    return (
      <MainLayout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        
        <OpportunitiesTab 
          opportunities={matchedOpportunities}
          isAutoApplying={isAutoApplying}
          getCategoryIcon={getCategoryIcon}
          onAutoApplyAll={handleAutoApplyAll}
          onApply={handleApply}
        />
        
        <ApplicationsTab 
          applications={applications}
          getCategoryIcon={getCategoryIcon}
          onViewDetails={handleViewApplicationDetails}
          filter={filter}
          onFilterChange={setFilter}
        />
        
        {dialogOpen && selectedApplication && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
            <div className="relative p-8 bg-white rounded-lg max-w-3xl mx-auto mt-20">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedApplication.opportunity?.title}</CardTitle>
                    </div>
                    <Badge 
                      variant={selectedApplication.status === "applied" ? "default" : "outline"}
                      className={selectedApplication.status === "applied" ? "bg-green-600" : ""}
                    >
                      {selectedApplication.status === "applied" ? (
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
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Briefcase className="mr-1 h-3 w-3" />
                      {selectedApplication.opportunity?.platform}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      Due {new Date(selectedApplication.opportunity?.deadline || "").toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Cover Letter</h3>
                    {coverLetter ? (
                      <Textarea 
                        value={coverLetter} 
                        readOnly 
                        className="bg-muted" 
                        rows={8}
                      />
                    ) : (
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleGenerateCoverLetter}>
                          Generate Cover Letter
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                      Close
                    </Button>
                    {selectedApplication.status === "pending" && (
                      <Button onClick={handleMarkAsApplied}>
                        Mark as Applied
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
