import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, User } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Import the logo for our app
import logo from "/lovable-uploads/19ee0d9a-a8ec-4e65-98a0-6c34833557ea.png";

// We'll create this hook next
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user, loading } = useAuth();
  
  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (isDesktop) {
      setIsOpen(false);
    }
  }, [isDesktop]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl inline-block text-brand-700">CareerConnect</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link to="/opportunities" className="text-sm font-medium transition-colors hover:text-primary">
              Opportunities
            </Link>
            {user && (
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
            )}
            <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
              About Us
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {!loading && (
            <>
              {user ? (
                <div className="hidden md:flex gap-2">
                  <Button asChild variant="ghost">
                    <Link to="/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </>
          )}
          
          <Button 
            variant="ghost" 
            className="md:hidden" 
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden container pb-4 animate-fade-in">
          <div className="flex flex-col space-y-3">
            <Link 
              to="/opportunities" 
              className="text-sm font-medium p-2 hover:bg-muted rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Opportunities
            </Link>
            {user && (
              <Link 
                to="/dashboard" 
                className="text-sm font-medium p-2 hover:bg-muted rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <Link 
              to="/about" 
              className="text-sm font-medium p-2 hover:bg-muted rounded-md"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            
            <div className="border-t pt-3 mt-3">
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    className="flex items-center text-sm font-medium p-2 hover:bg-muted rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full"
                  >
                    <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                  </Button>
                  <Button 
                    asChild 
                    className="w-full"
                  >
                    <Link to="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
