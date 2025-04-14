
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
 */
export const calculateMatchScore = (userSkills: Json | string[], requiredSkills: Json | string[]): number => {
  const normUserSkills = normalizeSkills(userSkills).map(skill => skill.toLowerCase());
  const normRequiredSkills = normalizeSkills(requiredSkills).map(skill => skill.toLowerCase());
  
  if (!normRequiredSkills.length || !normUserSkills.length) return 0;
  
  const matchingSkills = normRequiredSkills.filter(skill => 
    normUserSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
  );
  
  return Math.round((matchingSkills.length / normRequiredSkills.length) * 100);
};
