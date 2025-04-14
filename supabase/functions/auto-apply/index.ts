
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
    
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // 1. Get user profile with resume
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile or profile does not exist');
    }
    
    if (!profile.resume_url) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No resume found. Please upload a resume first.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // 2. Get all available opportunities
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('opportunities')
      .select('*');
    
    if (opportunitiesError) {
      throw opportunitiesError;
    }
    
    // 3. Get user's existing applications to avoid duplicates
    const { data: existingApplications, error: applicationsError } = await supabase
      .from('applications')
      .select('opportunity_id')
      .eq('user_id', userId);
    
    if (applicationsError) {
      throw applicationsError;
    }
    
    const appliedOpportunityIds = new Set(existingApplications?.map(app => app.opportunity_id) || []);
    
    // 4. Use our improved matching algorithm
    const userSkills = Array.isArray(profile.skills) ? profile.skills : 
      (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : []);
      
    const matchedOpportunities = opportunities
      .filter(opp => !appliedOpportunityIds.has(opp.id)) // Filter out already applied 
      .map(opp => {
        // Calculate match score based on skill overlap
        const requiredSkills = Array.isArray(opp.required_skills) ? opp.required_skills :
          (typeof opp.required_skills === 'string' ? JSON.parse(opp.required_skills) : []);
          
        const matchScore = calculateMatchScore(userSkills, requiredSkills);
        return { 
          opportunity: opp,
          match_score: matchScore
        };
      })
      .filter(match => match.match_score >= 75); // Only apply to opportunities with 75%+ match
    
    // 5. Auto-apply to matched opportunities
    const applications = [];
    
    for (const match of matchedOpportunities) {
      const coverLetter = generateCoverLetter(profile, match.opportunity);
      
      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .insert([{
          user_id: userId,
          opportunity_id: match.opportunity.id,
          status: 'applied',
          match_score: match.match_score,
          cover_letter: coverLetter,
          applied_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (!applicationError && application) {
        applications.push(application);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      applications_count: applications.length,
      message: `Successfully auto-applied to ${applications.length} opportunities!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error in auto-apply function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Helper function to calculate match score between user skills and job requirements
function calculateMatchScore(userSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;
  
  // Convert to lowercase for case-insensitive matching
  const normUserSkills = userSkills.map(skill => skill.toLowerCase());
  const normRequiredSkills = requiredSkills.map(skill => skill.toLowerCase());
  
  // Create a map of technology groups for better matching
  const techGroups = {
    javascript: ['js', 'es6', 'typescript', 'ts', 'node', 'nodejs', 'react', 'vue', 'angular', 'jquery'],
    frontend: ['html', 'css', 'sass', 'scss', 'less', 'bootstrap', 'tailwind', 'react', 'vue', 'angular', 'svelte'],
    backend: ['node', 'express', 'django', 'flask', 'ruby', 'rails', 'php', 'laravel', 'spring', 'asp.net'],
    database: ['sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'nosql', 'firebase', 'supabase', 'oracle', 'redis'],
    mobile: ['android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'xamarin'],
    devops: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'github actions'],
    ai: ['machine learning', 'ml', 'deep learning', 'dl', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'cv', 'ai'],
    python: ['django', 'flask', 'fastapi', 'numpy', 'pandas', 'scikit-learn', 'pytorch', 'tensorflow']
  };
  
  // Calculate matching score based on direct matches and related technology matches
  let matchPoints = 0;
  let totalPoints = normRequiredSkills.length;
  
  for (const requiredSkill of normRequiredSkills) {
    // Direct match
    if (normUserSkills.some(userSkill => 
      userSkill.includes(requiredSkill) || 
      requiredSkill.includes(userSkill)
    )) {
      matchPoints += 1;
      continue;
    }
    
    // Related technology match
    for (const [group, technologies] of Object.entries(techGroups)) {
      if (technologies.some(tech => tech.includes(requiredSkill) || requiredSkill.includes(tech))) {
        // If required skill is in a tech group, check if user has any related skill
        const hasRelatedSkill = normUserSkills.some(userSkill => 
          technologies.some(tech => tech.includes(userSkill) || userSkill.includes(tech))
        );
        
        if (hasRelatedSkill) {
          matchPoints += 0.5; // Partial match for related technologies
          break;
        }
      }
    }
  }
  
  return Math.round((matchPoints / totalPoints) * 100);
}

// Helper function to generate a cover letter
function generateCoverLetter(profile: any, opportunity: any): string {
  return `Dear Hiring Manager at ${opportunity.company || 'the Company'},

I am writing to express my interest in the ${opportunity.title} opportunity listed on ${opportunity.platform}.

As a ${profile?.education || 'professional'} with skills in ${Array.isArray(profile?.skills) ? profile?.skills.join(', ') : 'various technologies'}, I believe I am well-suited for this role. ${opportunity.required_skills ? `I am proficient in the required skills including ${Array.isArray(opportunity.required_skills) ? opportunity.required_skills.join(', ') : opportunity.required_skills}.` : ''}

${profile?.experience || 'I have experience in relevant projects and am eager to apply my skills in a professional environment.'}

I am particularly excited about this opportunity because it aligns with my career goals and would allow me to further develop my skills in ${opportunity.category}.

Thank you for considering my application. I look forward to the possibility of discussing this opportunity with you further.

Sincerely,
${profile?.name || 'Applicant'}`;
}
