
import { MainLayout } from "@/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">About CareerConnect</h1>
          
          <div className="prose prose-lg dark:prose-invert mb-8">
            <p>
              CareerConnect was created with a simple mission: to bridge the gap between talented college students and 
              the opportunities that can launch their careers. We believe that every student deserves access to 
              high-quality internships, hackathons, workshops, and coding contests that align with their skills and interests.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
            <p>
              We envision a world where every student can easily discover, apply for, and secure opportunities 
              that match their unique skills and career aspirations. By leveraging the power of AI, we're making 
              this vision a reality.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
            <p>
              CareerConnect uses advanced AI algorithms to match your profile with opportunities across the web. 
              Our platform analyzes your skills, experience, and preferences to find opportunities that are the 
              best fit for you. Then, our auto-apply feature handles the application process, saving you time 
              and increasing your chances of success.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Features</h2>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>AI-powered opportunity matching based on your skills and preferences</li>
              <li>Smart auto-apply system that generates personalized applications</li>
              <li>Comprehensive database of internships, hackathons, workshops, and contests</li>
              <li>User-friendly dashboard to track applications and matches</li>
              <li>Regular updates with new opportunities from trusted platforms</li>
            </ul>
          </div>
          
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Ready to discover opportunities?</h2>
            <p className="mb-6">
              Join thousands of students who have already found their perfect match through CareerConnect.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
