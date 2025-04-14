
import { Json } from "@/integrations/supabase/types";

/**
 * Convert Json skills to string array
 */
export const normalizeSkills = (skills: Json | string[]): string[] => {
  if (!skills) return [];
  
  // If already a string array, return as is
  if (Array.isArray(skills)) return skills as string[];
  
  // If it's a JSON string, try to parse it
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [skills];
    } catch (e) {
      return [skills];
    }
  }
  
  // If it's a number or boolean, convert to string
  if (typeof skills === 'number' || typeof skills === 'boolean') {
    return [String(skills)];
  }
  
  // Handle nested JSON structure
  if (typeof skills === 'object' && skills !== null) {
    if (Array.isArray(skills)) {
      return skills.map(s => typeof s === 'string' ? s : String(s));
    }
    // For other objects, just return an empty array
    return [];
  }
  
  return [];
};

/**
 * Calculate match score between user skills and required skills
 * Uses a more sophisticated matching algorithm that understands related technologies
 */
export const calculateMatchScore = (userSkills: Json | string[], requiredSkills: Json | string[]): number => {
  const normUserSkills = normalizeSkills(userSkills).map(skill => skill.toLowerCase());
  const normRequiredSkills = normalizeSkills(requiredSkills).map(skill => skill.toLowerCase());
  
  if (!normRequiredSkills.length || !normUserSkills.length) return 0;
  
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
};
