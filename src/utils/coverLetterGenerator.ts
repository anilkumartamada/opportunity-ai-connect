
import { Opportunity, Profile } from "@/types/database";
import { normalizeSkills } from "./matchCalculator";

/**
 * Generate a cover letter based on profile and opportunity
 */
export const generateCoverLetter = (profile: Profile, opportunity: Opportunity): string => {
  const userSkills = normalizeSkills(profile.skills);
  const requiredSkills = normalizeSkills(opportunity.required_skills);
  
  return `Dear Hiring Manager${opportunity.company ? ` at ${opportunity.company}` : ''},

I am writing to express my interest in the ${opportunity.title} opportunity listed on ${opportunity.platform}. As a ${profile?.education || 'student'} with skills in ${userSkills.join(', ') || 'various technologies'}, I believe I am well-suited for this role.

${profile?.experience || 'I have experience in relevant projects and am eager to apply my skills in a professional environment.'}

I am particularly excited about this opportunity because it aligns with my career goals and would allow me to further develop my skills in ${requiredSkills.join(', ') || 'this field'}.

Thank you for considering my application. I look forward to the possibility of discussing this opportunity with you further.

Sincerely,
${profile?.name || 'Applicant'}`;
};
