
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Briefcase, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Opportunity, Application } from "@/types/database";
import { OpportunitiesTab } from "@/components/dashboard/OpportunitiesTab";
import { ApplicationsTab } from "@/components/dashboard/ApplicationsTab";
import { ApplicationDialog } from "@/components/dashboard/ApplicationDialog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { generateCoverLetter } from "@/utils/coverLetterGenerator";
import { normalizeSkills } from "@/utils/matchCalculator";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { 
    matchedOpportunities, 
    applications, 
    isLoading, 
    fetchData,
    setMatchedOpportunities,
    setApplications
  } = useDashboardData(user?.id);
  
  const handleAutoApplyToAll = async () => {
    if (!user) return;
    
    try {
      setIsAutoApplying(true);
      
      const { data, error } = await supabase.functions.invoke('auto-apply', {
        body: { userId: user.id },
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message || `Successfully auto-applied to ${data.applications_count} opportunities!`);
        // Refetch data to show updates
        await fetchData();
      } else {
        toast.error(data.message || "Auto-apply failed");
      }
    } catch (error) {
      console.error("Error auto-applying:", error);
      toast.error("Failed to auto-apply to opportunities");
    } finally {
      setIsAutoApplying(false);
    }
  };
  
  const handleApply = async (opportunity: Opportunity) => {
    if (!user) return;
    
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Ensure skills are properly formatted
      const profile = {
        ...profileData,
        skills: normalizeSkills(profileData.skills)
      };
      
      // Generate a cover letter
      const coverLetter = generateCoverLetter(profile, opportunity);
      
      // Create application
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: user.id,
          opportunity_id: opportunity.id,
          match_score: opportunity.match_score || 70,
          status: 'applied',
          cover_letter: coverLetter,
          applied_at: new Date().toISOString()
        }])
        .select('*, opportunity:opportunities(*)');
      
      if (error) throw error;
      
      // Remove opportunity from matched opportunities
      setMatchedOpportunities(prev => prev.filter(opp => opp.id !== opportunity.id));
      
      // Add to applications
      if (data && data[0]) {
        // Process the opportunity required_skills if needed
        let newApplication = data[0] as any;
        if (newApplication.opportunity && newApplication.opportunity.required_skills) {
          const requiredSkills = normalizeSkills(newApplication.opportunity.required_skills);
            
          newApplication = {
            ...newApplication,
            opportunity: {
              ...newApplication.opportunity,
              required_skills: requiredSkills
            }
          };
        }
        
        setApplications(prev => [...prev, newApplication as Application]);
      }
      
      toast.success("Successfully applied to opportunity!");
    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Failed to apply to opportunity");
    }
  };
  
  const viewApplicationDetails = (application: Application) => {
    setSelectedApplication(application);
    setDialogOpen(true);
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
  
  // If not logged in, redirect to login
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }
  
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
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        
        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="opportunities">Matched Opportunities</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="opportunities" className="mt-6">
            <OpportunitiesTab
              opportunities={matchedOpportunities}
              isAutoApplying={isAutoApplying}
              getCategoryIcon={getCategoryIcon}
              onAutoApplyAll={handleAutoApplyToAll}
              onApply={handleApply}
            />
          </TabsContent>
          
          <TabsContent value="applications" className="mt-6">
            <ApplicationsTab
              applications={applications}
              filter={filter}
              getCategoryIcon={getCategoryIcon}
              onFilterChange={setFilter}
              onViewDetails={viewApplicationDetails}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={selectedApplication}
      />
    </MainLayout>
  );
}

const viewApplicationDetails = (application: Application) => {
  setSelectedApplication(application);
  setDialogOpen(true);
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
