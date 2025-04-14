
/**
 * Calculate match score between user skills and required skills
 */
export const calculateMatchScore = (userSkills: string[], requiredSkills: string[]): number => {
  if (!requiredSkills?.length || !userSkills?.length) return 0;
  
  const normUserSkills = userSkills.map(skill => skill.toLowerCase());
  const normRequiredSkills = requiredSkills.map(skill => skill.toLowerCase());
  
  const matchingSkills = normRequiredSkills.filter(skill => 
    normUserSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
  );
  
  return Math.round((matchingSkills.length / normRequiredSkills.length) * 100);
};
