
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Opportunity, Application, Profile } from "@/types/database";
import { calculateMatchScore } from "@/utils/matchCalculator";

export const useDashboardData = (userId: string | undefined) => {
  const [matchedOpportunities, setMatchedOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const fetchData = async () => {
    if (!userId) return;
    
    try {
      // Fetch user profile and skills
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Fetch opportunities
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*');
      
      if (opportunitiesError) throw opportunitiesError;
      
      // Fetch user applications with opportunities
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*, opportunity:opportunities(*)')
        .eq('user_id', userId);
      
      if (applicationsError) throw applicationsError;
      
      // Calculate match opportunities
      const userSkills = profileData.skills as string[] || [];
      
      const matchedOpps = (opportunitiesData as any[])
        .filter(opp => {
          // Convert JSON required_skills to string array if needed
          const requiredSkills = Array.isArray(opp.required_skills) 
            ? opp.required_skills 
            : (typeof opp.required_skills === 'string' ? JSON.parse(opp.required_skills) : []);
            
          const matchScore = calculateMatchScore(userSkills, requiredSkills);
          return matchScore >= 70;
        })
        .map(opp => {
          // Convert JSON required_skills to string array if needed
          const requiredSkills = Array.isArray(opp.required_skills) 
            ? opp.required_skills 
            : (typeof opp.required_skills === 'string' ? JSON.parse(opp.required_skills) : []);
            
          return {
            ...opp,
            required_skills: requiredSkills,
            match_score: calculateMatchScore(userSkills, requiredSkills)
          };
        })
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      
      setMatchedOpportunities(matchedOpps as Opportunity[]);
      
      // Process applications
      const formattedApplications = (applicationsData as any[]).map(app => {
        // Process opportunity data within application
        let opportunity = app.opportunity;
        if (opportunity && opportunity.required_skills) {
          const requiredSkills = Array.isArray(opportunity.required_skills) 
            ? opportunity.required_skills 
            : (typeof opportunity.required_skills === 'string' ? JSON.parse(opportunity.required_skills) : []);
            
          opportunity = {
            ...opportunity,
            required_skills: requiredSkills
          };
        }
        
        return {
          ...app,
          opportunity: opportunity || null
        };
      });
      
      setApplications(formattedApplications as Application[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  return {
    matchedOpportunities,
    applications,
    isLoading,
    fetchData
  };
};
