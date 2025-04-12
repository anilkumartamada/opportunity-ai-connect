
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { MainLayout } from "@/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Briefcase, Award, Clock, CheckCircle, AlertCircle, Filter } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

interface Opportunity {
  id: string;
  title: string;
  platform: string;
  deadline: string;
  category: string;
  required_skills: string[];
  match_score?: number;
}

interface Application {
  id: string;
  opportunity_id: string;
  status: "pending" | "applied";
  match_score: number;
  cover_letter: string;
  opportunity?: Opportunity;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [matchedOpportunities, setMatchedOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  useEffect(() => {
    if (!loading && user) {
      fetchData();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [loading, user]);
  
  const fetchData = async () => {
    if (!user) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        toast.error("Missing Supabase credentials. Please connect to Supabase first.");
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch user profile and skills
      const { data: profile } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', user.id)
        .single();
      
      // Fetch opportunities
      const { data: allOpportunities } = await supabase
        .from('opportunities')
        .select('*');
      
      // Fetch user applications
      const { data: userApplications } = await supabase
        .from('applications')
        .select('*, opportunity:opportunities(*)')
        .eq('user_id', user.id);
      
      if (!allOpportunities) {
        // If no opportunities, show mock data for demonstration
        const mockOpportunities = getMockOpportunities();
        setMatchedOpportunities(mockOpportunities);
      } else {
        // If we have real data, filter for matches with user skills
        const userSkills = profile?.skills || [];
        
        // Filter out opportunities that are already applied for
        const appliedOpportunityIds = (userApplications || []).map(app => app.opportunity_id);
        
        const matches = allOpportunities
          .filter(opp => !appliedOpportunityIds.includes(opp.id))
          .map(opp => {
            // Calculate match score based on skill overlap
            const matchScore = calculateMatchScore(userSkills, opp.required_skills);
            return { ...opp, match_score: matchScore };
          })
          .filter(opp => opp.match_score >= 70) // Only show opportunities with 70%+ match
          .sort((a, b) => b.match_score - a.match_score); // Sort by match score
        
        setMatchedOpportunities(matches);
      }
      
      // Handle applications
      if (!userApplications || userApplications.length === 0) {
        // If no applications, use mock data for demonstration
        const mockApplications = getMockApplications();
        setApplications(mockApplications);
      } else {
        setApplications(userApplications as Application[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
      
      // Use mock data as fallback
      setMatchedOpportunities(getMockOpportunities());
      setApplications(getMockApplications());
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateMatchScore = (userSkills: string[], requiredSkills: string[]) => {
    if (!requiredSkills || requiredSkills.length === 0) return 0;
    if (!userSkills || userSkills.length === 0) return 0;
    
    // Convert to lowercase for case-insensitive matching
    const normUserSkills = userSkills.map(skill => skill.toLowerCase());
    const normRequiredSkills = requiredSkills.map(skill => skill.toLowerCase());
    
    // Count matching skills
    const matchingSkills = normRequiredSkills.filter(skill => 
      normUserSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    );
    
    return Math.round((matchingSkills.length / normRequiredSkills.length) * 100);
  };
  
  const handleApply = async (opportunity: Opportunity) => {
    if (!user) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        toast.error("Missing Supabase credentials. Please connect to Supabase first.");
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Generate a cover letter (simulated AI generation)
      const coverLetter = generateCoverLetter(profile, opportunity);
      
      // Create application
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: user.id,
          opportunity_id: opportunity.id,
          match_score: opportunity.match_score || 70,
          status: 'applied',
          cover_letter: coverLetter
        }])
        .select('*, opportunity:opportunities(*)');
      
      if (error) throw error;
      
      // Remove opportunity from matched opportunities
      setMatchedOpportunities(prev => prev.filter(opp => opp.id !== opportunity.id));
      
      // Add to applications
      if (data && data[0]) {
        setApplications(prev => [...prev, data[0] as Application]);
      }
      
      toast.success("Successfully applied to opportunity!");
    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Failed to apply to opportunity");
    }
  };
  
  const generateCoverLetter = (profile: any, opportunity: Opportunity) => {
    return `Dear Hiring Manager,

I am writing to express my interest in the ${opportunity.title} opportunity listed on ${opportunity.platform}. As a ${profile?.education || 'student'} with skills in ${profile?.skills?.join(', ') || 'various technologies'}, I believe I am well-suited for this role.

${profile?.experience || 'I have experience in relevant projects and am eager to apply my skills in a professional environment.'}

I am particularly excited about this opportunity because it aligns with my career goals and would allow me to further develop my skills in ${opportunity.required_skills?.join(', ') || 'this field'}.

Thank you for considering my application. I look forward to the possibility of discussing this opportunity with you further.

Sincerely,
${profile?.name || 'Applicant'}`;
  };
  
  const getMockOpportunities = (): Opportunity[] => [
    {
      id: "1",
      title: "Frontend Developer Internship",
      platform: "Internshala",
      deadline: "2023-06-30",
      category: "Internship",
      required_skills: ["React", "JavaScript", "CSS"],
      match_score: 95
    },
    {
      id: "2",
      title: "AI for Social Good Hackathon",
      platform: "Devpost",
      deadline: "2023-07-15",
      category: "Hackathon",
      required_skills: ["Python", "Machine Learning", "Data Analysis"],
      match_score: 85
    },
    {
      id: "3",
      title: "Full Stack Developer Workshop",
      platform: "Unstop",
      deadline: "2023-07-10",
      category: "Workshop",
      required_skills: ["JavaScript", "Node.js", "MongoDB"],
      match_score: 75
    }
  ];
  
  const getMockApplications = (): Application[] => [
    {
      id: "a1",
      opportunity_id: "4",
      status: "applied",
      match_score: 92,
      cover_letter: "This is a sample cover letter for the Data Science opportunity...",
      opportunity: {
        id: "4",
        title: "Data Science Intern",
        platform: "LinkedIn",
        deadline: "2023-06-25",
        category: "Internship",
        required_skills: ["Python", "Data Analysis", "Statistics"]
      }
    },
    {
      id: "a2",
      opportunity_id: "5",
      status: "pending",
      match_score: 88,
      cover_letter: "This is a sample cover letter for the Mobile App hackathon...",
      opportunity: {
        id: "5",
        title: "Mobile App Development Challenge",
        platform: "Unstop",
        deadline: "2023-07-05",
        category: "Hackathon",
        required_skills: ["Flutter", "Firebase", "UI/UX"]
      }
    }
  ];
  
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
  
  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (filter === "all") return true;
    return app.status === filter;
  });
  
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
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Opportunities Matched to Your Profile</h2>
              <p className="text-muted-foreground">
                We've found {matchedOpportunities.length} opportunities that match your skills and interests.
              </p>
            </div>
            
            {matchedOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedOpportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{opportunity.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            {opportunity.platform}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={opportunity.match_score >= 90 ? "default" : "outline"}
                          className={opportunity.match_score >= 90 ? "bg-green-600" : ""}
                        >
                          {opportunity.match_score}% Match
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
                        onClick={() => handleApply(opportunity)}
                        className="w-full mt-2"
                      >
                        Auto-Apply with AI
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  No matched opportunities found. Update your profile with more skills to see matches.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="applications" className="mt-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Your Applications</h2>
                <p className="text-muted-foreground">
                  Track the status of your {applications.length} applications.
                </p>
              </div>
              
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded-md px-3 py-1 text-sm bg-background"
                >
                  <option value="all">All</option>
                  <option value="applied">Applied</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            {filteredApplications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApplications.map((application) => (
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
                          onClick={() => {
                            // View application details logic
                            toast.info("Application details coming soon!");
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  No applications found. Start applying to opportunities to see them here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
