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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  
  useEffect(() => {
    if (!loading && user) {
      fetchProfile();
      fetchOpportunities();
      fetchApplications();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [loading, user]);
  
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };
  
  const fetchOpportunities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const matchedOpportunities = data.map(opportunity => ({
          ...opportunity,
          match_score: calculateMatchScore(opportunity, profile)
        })).filter(opportunity => opportunity.match_score > 50);
        
        setOpportunities(matchedOpportunities as Opportunity[]);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast.error("Failed to load opportunities");
    }
  };
  
  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, opportunity:opportunities(*)')
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      
      setApplications(data as Application[]);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateMatchScore = (opportunity: Opportunity, profile: Profile | null): number => {
    if (!profile) return 0;
    
    const userSkills = profile.skills || [];
    const requiredSkills = opportunity.required_skills || [];
    
    const matchingSkills = (requiredSkills as string[]).filter(skill =>
      (userSkills as string[]).includes(skill)
    );
    
    return Math.round((matchingSkills.length / (requiredSkills as string[]).length) * 100);
  };
  
  const handleAutoApplyAll = async () => {
    if (!user || !profile) return;
    
    setIsAutoApplying(true);
    
    try {
      for (const opportunity of opportunities) {
        // Generate cover letter
        const coverLetter = generateCoverLetter(profile, opportunity);
        
        // Create application
        const { data, error } = await supabase
          .from('applications')
          .insert([{
            user_id: user.id,
            opportunity_id: opportunity.id,
            status: 'pending',
            match_score: opportunity.match_score,
            cover_letter: coverLetter
          }])
          .select();
        
        if (error) throw error;
        
        // Optimistically update applications state
        setApplications(prevApplications => [
          ...prevApplications,
          {
            id: data[0].id,
            user_id: user.id,
            opportunity_id: opportunity.id,
            status: 'pending',
            match_score: opportunity.match_score,
            cover_letter: coverLetter,
            opportunity: opportunity
          }
        ]);
      }
      
      toast.success("Auto-applied to all matched opportunities!");
    } catch (error) {
      console.error("Error auto-applying:", error);
      toast.error("Failed to auto-apply to all opportunities");
    } finally {
      setIsAutoApplying(false);
    }
  };
  
  const handleApply = async (opportunity: Opportunity) => {
    if (!user || !profile) return;
    
    try {
      // Generate cover letter
      const coverLetter = generateCoverLetter(profile, opportunity);
      
      // Create application
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: user.id,
          opportunity_id: opportunity.id,
          status: 'pending',
          match_score: opportunity.match_score,
          cover_letter: coverLetter
        }])
        .select();
      
      if (error) throw error;
      
      // Optimistically update applications state
      setApplications(prevApplications => [
        ...prevApplications,
        {
          id: data[0].id,
          user_id: user.id,
          opportunity_id: opportunity.id,
          status: 'pending',
          match_score: opportunity.match_score,
          cover_letter: coverLetter,
          opportunity: opportunity
        }
      ]);
      
      toast.success(`Applied to ${opportunity.title}!`);
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
    if (selectedApplication && profile) {
      setCoverLetter(generateCoverLetter(profile, selectedApplication.opportunity as Opportunity));
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
      
      // Optimistically update application status
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === selectedApplication.id ? { ...app, status: 'applied' } : app
        )
      );
      
      toast.success("Application marked as applied!");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error marking as applied:", error);
      toast.error("Failed to mark application as applied");
    }
  };
  
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
          opportunities={opportunities}
          isAutoApplying={isAutoApplying}
          getCategoryIcon={getCategoryIcon}
          onAutoApplyAll={handleAutoApplyAll}
          onApply={handleApply}
        />
        
        <ApplicationsTab 
          applications={applications}
          getCategoryIcon={getCategoryIcon}
          onViewDetails={handleViewApplicationDetails}
        />
        
        {/* Application Details Modal */}
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
