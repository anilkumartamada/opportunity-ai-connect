
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Mock LinkedIn scraping (since actual scraping would require authentication)
    // In a real implementation, you'd use a service like Puppeteer, Playwright or a third-party API
    const mockOpportunities = [
      {
        title: "Frontend Developer",
        platform: "LinkedIn",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        category: "Internship",
        required_skills: ["React", "JavaScript", "CSS", "TypeScript"],
        company: "Tech Innovators Inc.",
        location: "Remote",
        description: "Looking for a talented frontend developer with experience in React and TypeScript.",
        application_url: "https://example.com/apply/frontend-dev"
      },
      {
        title: "Machine Learning Engineer",
        platform: "LinkedIn",
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        category: "Full-time",
        required_skills: ["Python", "TensorFlow", "PyTorch", "Data Analysis"],
        company: "AI Solutions Ltd",
        location: "New York, NY",
        description: "Join our team to build cutting-edge ML models for computer vision applications.",
        application_url: "https://example.com/apply/ml-engineer"
      },
      {
        title: "Full Stack Developer Hackathon",
        platform: "LinkedIn",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        category: "Hackathon",
        required_skills: ["JavaScript", "Node.js", "React", "MongoDB"],
        company: "DevNetwork",
        location: "Virtual",
        description: "Participate in our 48-hour hackathon to build innovative solutions.",
        application_url: "https://example.com/apply/hackathon"
      },
      {
        title: "Backend Developer Workshop",
        platform: "LinkedIn",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
        category: "Workshop",
        required_skills: ["Java", "Spring Boot", "SQL", "Microservices"],
        company: "CodeCampus",
        location: "Online",
        description: "Learn advanced backend development techniques in this interactive workshop.",
        application_url: "https://example.com/apply/backend-workshop"
      },
      {
        title: "UI/UX Design Internship",
        platform: "LinkedIn",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days from now
        category: "Internship",
        required_skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
        company: "Design Studios Co.",
        location: "San Francisco, CA",
        description: "Join our design team to create beautiful user experiences for web and mobile apps.",
        application_url: "https://example.com/apply/uiux-intern"
      }
    ];

    // Store scraped opportunities in the database
    const { data, error } = await supabase
      .from('opportunities')
      .upsert(mockOpportunities, { 
        onConflict: 'title,platform',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, count: mockOpportunities.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in scrape-opportunities function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
