
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Plus, Check, FileText } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { normalizeSkills } from "@/utils/matchCalculator";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  useEffect(() => {
    if (!loading && user) {
      fetchProfile();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [loading, user]);
  
  useEffect(() => {
    if (profile) {
      calculateProgress();
    }
  }, [profile]);
  
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        if (error.code === 'PGRST116') {
          await createProfile();
          return;
        }
        throw error;
      }
      
      const formattedProfile = {
        ...data,
        skills: normalizeSkills(data.skills)
      };
      
      setProfile(formattedProfile as Profile);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };
  
  const createProfile = async () => {
    if (!user) return;
    
    try {
      const initialProfile = {
        id: user.id,
        name: user.user_metadata?.full_name || "",
        email: user.email || "",
        skills: [],
        education: "",
        experience: "",
        resume_url: ""
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([initialProfile])
        .select();
      
      if (error) throw error;
      
      setProfile(data[0] as Profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile");
    }
  };
  
  const handleSaveProfile = async () => {
    if (!profile || !user) return;
    
    setIsSaving(true);
    
    try {
      let resumeUrl = profile.resume_url;
      let resumeName = profile.resume_name || '';
      
      if (resumeFile) {
        const uploadToastId = toast.loading(`Uploading resume: 0%`);
        
        try {
          // Skip bucket creation as it's configured in supabase/config.toml
          // and check if the bucket exists first
          const { data: bucketData, error: bucketError } = await supabase
            .storage
            .getBucket('resumes');
            
          if (bucketError) {
            console.error("Error checking bucket:", bucketError);
            toast.error("Resume storage is not available", { id: uploadToastId });
            throw bucketError;
          }
          
          const fileName = `${crypto.randomUUID()}_${resumeFile.name}`;
          
          const { data: fileData, error: fileError } = await supabase.storage
            .from("resumes")
            .upload(`${user.id}/${fileName}`, resumeFile, {
              upsert: true,
              cacheControl: '3600'
            });
            
          setUploadProgress(100);
          
          if (fileError) {
            toast.error("Failed to upload resume", { id: uploadToastId });
            throw fileError;
          }
          
          // Get a public URL instead of a signed URL
          const { data: urlData } = await supabase.storage
            .from("resumes")
            .getPublicUrl(`${user.id}/${fileName}`);
          
          resumeUrl = urlData?.publicUrl || '';
          resumeName = resumeFile.name;
          
          toast.success("Resume uploaded successfully", { id: uploadToastId });
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(`Upload failed: ${error.message}`, { id: uploadToastId });
          throw error;
        }
      }
      
      const skillsToSave = Array.isArray(profile.skills) ? profile.skills : normalizeSkills(profile.skills);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          skills: skillsToSave,
          education: profile.education,
          experience: profile.experience,
          resume_url: resumeUrl,
          resume_name: resumeName
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      if (resumeFile) {
        setProfile({
          ...profile,
          resume_url: resumeUrl,
          resume_name: resumeName
        });
        setResumeFile(null);
      }
      
      toast.success("Profile saved successfully!");
      calculateProgress();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(`Failed to save profile: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };
  
  const handleAddSkill = () => {
    if (!newSkill.trim() || !profile) return;
    
    const normalizedSkills = normalizeSkills(profile.skills);
    
    if (normalizedSkills.includes(newSkill.trim())) {
      toast.error("This skill is already added");
      return;
    }
    
    setProfile({
      ...profile,
      skills: [...normalizedSkills, newSkill.trim()]
    });
    setNewSkill("");
  };
  
  const handleRemoveSkill = (skill: string) => {
    if (!profile) return;
    
    const normalizedSkills = normalizeSkills(profile.skills);
    
    setProfile({
      ...profile,
      skills: normalizedSkills.filter(s => s !== skill)
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setResumeFile(file);
    }
  };
  
  const calculateProgress = () => {
    if (!profile) {
      setProgressPercentage(0);
      return;
    }
    
    let completed = 0;
    const total = 5;
    
    if (profile.name) completed++;
    if (profile.email) completed++;
    if (normalizeSkills(profile.skills).length > 0) completed++;
    if (profile.education) completed++;
    if (profile.experience) completed++;
    if (profile.resume_url || resumeFile) completed++;
    
    const percentage = Math.floor((completed / total) * 100);
    setProgressPercentage(percentage);
  };
  
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (loading || isLoading) {
    return (
      <MainLayout>
        <div className="container py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">
                Profile Completion: {progressPercentage}%
              </div>
              <Progress value={progressPercentage} className="w-24" />
            </div>
          </div>
          
          {profile && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Technical Skills</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {normalizeSkills(profile.skills).map((skill) => (
                    <Badge key={skill} className="pl-2 py-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g., JavaScript, React, Python)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill} size="icon">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add skill</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Education</h2>
                <div className="space-y-2">
                  <Label htmlFor="education">Degree, College, Graduation Year</Label>
                  <Textarea
                    id="education"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                    placeholder="E.g., BS in Computer Science, ABC University, 2025"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Work Experience</h2>
                <div className="space-y-2">
                  <Label htmlFor="experience">Previous Internships and Projects</Label>
                  <Textarea
                    id="experience"
                    value={profile.experience}
                    onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                    placeholder="Describe your previous work experiences, internships, or significant projects."
                    rows={5}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Resume</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="resume">Upload Your Resume (PDF)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="resume"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="resume" className="cursor-pointer">
                      <div className="border rounded-md px-4 py-2 flex items-center gap-2 hover:bg-muted transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>{resumeFile ? resumeFile.name : "Choose file"}</span>
                      </div>
                    </label>
                    
                    {profile.resume_url && !resumeFile && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        <a
                          href={profile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline text-brand-600"
                        >
                          {profile.resume_name || "View current resume"}
                        </a>
                      </div>
                    )}
                  </div>
                  {resumeFile && (
                    <p className="text-sm text-muted-foreground">
                      New resume selected: {resumeFile.name}
                    </p>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <Progress value={uploadProgress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  type="button" 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full md:w-auto"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
