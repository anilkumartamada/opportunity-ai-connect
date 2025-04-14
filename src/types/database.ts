
export interface Opportunity {
  id: string;
  title: string;
  platform: string;
  deadline: string;
  category: string;
  required_skills: string[];
  company?: string;
  location?: string;
  description?: string;
  application_url?: string;
  match_score?: number;
}

export interface Application {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: "pending" | "applied";
  match_score: number;
  cover_letter?: string;
  applied_at?: string;
  opportunity?: Opportunity;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  education: string;
  experience: string;
  resume_url: string;
  resume_name?: string;
}
