
import { useState, useEffect } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Briefcase, Award, Clock, Search, Filter, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Opportunity } from "@/types/database";
import { normalizeSkills } from "@/utils/matchCalculator";

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showExpired, setShowExpired] = useState(false);
  
  useEffect(() => {
    fetchOpportunities();
  }, []);
  
  const fetchOpportunities = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        // If no data, use mock data
        setOpportunities(getMockOpportunities());
      } else {
        // Process the data to normalize required_skills
        const processedData = data.map(opp => ({
          ...opp,
          required_skills: normalizeSkills(opp.required_skills)
        })) as Opportunity[];
        
        setOpportunities(processedData);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast.error("Failed to load opportunities");
      // Use mock data as fallback
      setOpportunities(getMockOpportunities());
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshOpportunities = async () => {
    try {
      setIsRefreshing(true);
      
      // Call our edge function to scrape new opportunities
      const { error } = await supabase.functions.invoke('scrape-opportunities', {
        body: {},
      });
      
      if (error) throw error;
      
      // Fetch the updated list
      await fetchOpportunities();
      
      toast.success("Opportunities refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing opportunities:", error);
      toast.error("Failed to refresh opportunities");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getMockOpportunities = (): Opportunity[] => {
    // Get today's date to create some future deadlines
    const today = new Date();
    const oneWeekAhead = new Date();
    oneWeekAhead.setDate(today.getDate() + 7);
    
    const twoWeeksAhead = new Date();
    twoWeeksAhead.setDate(today.getDate() + 14);
    
    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(today.getMonth() + 1);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    return [
      {
        id: "1",
        title: "Frontend Developer Internship",
        platform: "Internshala",
        deadline: formatDate(oneWeekAhead),
        category: "Internship",
        required_skills: ["React", "JavaScript", "CSS"]
      },
      {
        id: "2",
        title: "AI for Social Good Hackathon",
        platform: "Devpost",
        deadline: formatDate(twoWeeksAhead),
        category: "Hackathon",
        required_skills: ["Python", "Machine Learning", "Data Analysis"]
      },
      {
        id: "3",
        title: "Full Stack Developer Workshop",
        platform: "Unstop",
        deadline: formatDate(today),
        category: "Workshop",
        required_skills: ["JavaScript", "Node.js", "MongoDB"]
      },
      {
        id: "4",
        title: "Cloud Computing Internship",
        platform: "LinkedIn",
        deadline: formatDate(oneMonthAhead),
        category: "Internship",
        required_skills: ["AWS", "Docker", "Kubernetes"]
      },
      {
        id: "5",
        title: "Mobile App Development Challenge",
        platform: "Unstop",
        deadline: formatDate(oneWeekAhead),
        category: "Hackathon",
        required_skills: ["Flutter", "Firebase", "UI/UX"]
      },
      {
        id: "6",
        title: "Data Science Workshop Series",
        platform: "Coursera",
        deadline: formatDate(twoWeeksAhead),
        category: "Workshop",
        required_skills: ["Python", "Data Visualization", "Machine Learning"]
      }
    ];
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
  
  // Get unique categories and platforms for filters
  const categories = [...new Set(opportunities.map(opp => opp.category))];
  const platforms = [...new Set(opportunities.map(opp => opp.platform))];
  
  // Apply filters
  const filteredOpportunities = opportunities.filter(opp => {
    // Search term filter
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         normalizeSkills(opp.required_skills).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (opp.company && opp.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (opp.location && opp.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || opp.category === categoryFilter;
    
    // Platform filter
    const matchesPlatform = platformFilter === "all" || opp.platform === platformFilter;
    
    // Deadline filter - filter out past opportunities unless showExpired is true
    const today = new Date();
    const deadline = new Date(opp.deadline);
    const isNotExpired = showExpired || deadline >= today;
    
    return matchesSearch && matchesCategory && matchesPlatform && isNotExpired;
  });
  
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    // Sort by deadline (closest first)
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  
  // Count of expired opportunities
  const expiredCount = opportunities.filter(opp => new Date(opp.deadline) < new Date()).length;
  const activeCount = opportunities.length - expiredCount;
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Opportunities</h1>
            <p className="text-muted-foreground mt-1">
              Discover internships, hackathons, workshops and more
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshOpportunities} 
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {user && (
              <Button asChild size="sm">
                <Link to="/dashboard">View Matched Opportunities</Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title, company, skills, or location..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className={showExpired ? "bg-muted" : ""}
                onClick={() => setShowExpired(!showExpired)}
              >
                <Clock className="h-4 w-4 mr-2" />
                {showExpired ? "Showing All" : "Hide Expired"}
                {expiredCount > 0 && !showExpired && (
                  <Badge variant="secondary" className="ml-2">{expiredCount}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {sortedOpportunities.length} opportunities
                {!showExpired && expiredCount > 0 && ` (${expiredCount} expired opportunities hidden)`}
              </p>
            </div>
            
            {sortedOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedOpportunities.map((opportunity) => {
                  const today = new Date();
                  const deadlineDate = new Date(opportunity.deadline);
                  const isDeadlinePassed = deadlineDate < today;
                  
                  return (
                    <Card key={opportunity.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">{opportunity.platform}</p>
                          {opportunity.company && (
                            <p className="text-sm font-medium">{opportunity.company}</p>
                          )}
                          {opportunity.location && (
                            <p className="text-xs text-muted-foreground">{opportunity.location}</p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            <span className={isDeadlinePassed ? "text-destructive" : ""}>
                              {isDeadlinePassed ? "Expired" : `Due ${deadlineDate.toLocaleDateString()}`}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {getCategoryIcon(opportunity.category)}
                            <span className="ml-1">{opportunity.category}</span>
                          </div>
                        </div>
                        
                        {opportunity.description && (
                          <div className="mb-4">
                            <p className="text-sm line-clamp-2">{opportunity.description}</p>
                          </div>
                        )}
                        
                        <div className="mb-4 flex-1">
                          <p className="text-sm font-medium mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {normalizeSkills(opportunity.required_skills).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {user ? (
                          <Link to="/dashboard">
                            <Button 
                              className="w-full" 
                              disabled={isDeadlinePassed && !showExpired}
                            >
                              {isDeadlinePassed ? "Opportunity Expired" : "View in Dashboard"}
                            </Button>
                          </Link>
                        ) : (
                          <Link to="/signup">
                            <Button 
                              className="w-full"
                              disabled={isDeadlinePassed && !showExpired}
                            >
                              {isDeadlinePassed ? "Opportunity Expired" : "Sign Up to Apply"}
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  No opportunities found matching your filters.
                </p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setPlatformFilter("all");
                    setShowExpired(true);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
