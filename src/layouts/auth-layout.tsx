
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md px-8 py-12">
          <div className="mb-8">
            <Link to="/" className="inline-block mb-6">
              <span className="font-bold text-xl text-brand-700">CareerConnect</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
