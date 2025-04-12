
import { Link } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Briefcase, Award, Users, PenTool, Zap } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import heroImage from "/lovable-uploads/19ee0d9a-a8ec-4e65-98a0-6c34833557ea.png";

const features = [
  {
    icon: Search,
    title: "Discover",
    description: "Find opportunities from top companies and organizations tailored for students.",
  },
  {
    icon: Briefcase,
    title: "Match",
    description: "Our AI matches your profile with opportunities that align with your skills.",
  },
  {
    icon: Zap,
    title: "Auto-Apply",
    description: "Apply to multiple opportunities with a single click using AI-generated applications.",
  },
  {
    icon: Award,
    title: "Hackathons",
    description: "Discover the latest hackathons and coding contests to showcase your skills.",
  },
  {
    icon: Users,
    title: "Workshops",
    description: "Join workshops to learn new skills and expand your professional network.",
  },
  {
    icon: PenTool,
    title: "Personalize",
    description: "Customize your profile to get the most relevant opportunities.",
  },
];

export default function Index() {
  const { user } = useAuth();
  
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Students collaborating" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/90"></div>
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
              Discover. Match. Auto-Apply.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
              Connecting college students with internships, hackathons, workshops, and coding contests tailored to your skills and interests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg" className="text-md">
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="text-md">
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="text-md">
                <Link to="/opportunities">Browse Opportunities</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need To Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform offers a comprehensive suite of tools to help you find and land the perfect opportunity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-all animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to find your next opportunity?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of students who have already found their dream internships and opportunities through CareerConnect.
            </p>
            <Button asChild size="lg">
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "View Matched Opportunities" : "Create Your Free Account"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
