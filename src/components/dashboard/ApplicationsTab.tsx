
import React from "react";
import { Filter } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import { Application } from "@/types/database";

interface ApplicationsTabProps {
  applications: Application[];
  filter: string;
  getCategoryIcon: (category: string) => React.ReactNode;
  onFilterChange: (filter: string) => void;
  onViewDetails: (application: Application) => void;
}

export const ApplicationsTab = ({ 
  applications, 
  filter, 
  getCategoryIcon, 
  onFilterChange, 
  onViewDetails 
}: ApplicationsTabProps) => {
  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Your Applications</h2>
          <p className="text-muted-foreground">
            Track the status of your {applications.length} applications.
          </p>
        </div>
        
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <select 
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm bg-background"
          >
            <option value="all">All</option>
            <option value="applied">Applied</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      
      {filteredApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              getCategoryIcon={getCategoryIcon}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            No applications found. Start applying to opportunities to see them here.
          </p>
        </div>
      )}
    </>
  );
};
