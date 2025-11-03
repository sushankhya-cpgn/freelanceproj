import React from "react";
import { stripHtml } from "@/utils/stripHtml";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import type { JobPost } from "@/type/job/jobpost";

// ✅ Define JobPost type inline or import it from src/types/job.ts


interface JobCardProps {
  job: JobPost;
  onViewDetails: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onViewDetails }) => {
  const clientName = job.client
    ? `${job.client.firstName} ${job.client.lastName}`
    : "Unknown Client";

  const budget =
    job.budgetType === "fixed"
      ? job.budget
        ? `$${job.budget.toLocaleString()}`
        : job.minBudget && job.maxBudget
        ? `$${job.minBudget} - $${job.maxBudget}`
        : "Not specified"
      : job.minBudget && job.maxBudget
      ? `$${job.minBudget} - $${job.maxBudget}/hr`
      : "Not specified";

  return (
    <Card
      className="bg-transparent border border-border shadow-none hover:shadow-md hover:bg-accent/50 transition cursor-pointer"
      onClick={onViewDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onViewDetails(); }}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {job.experienceLevel
            ? `${job.experienceLevel} • ${job.projectDuration || "Duration N/A"}`
            : "Experience not specified"}{" "}
          • Budget: {budget}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        {/* Render job description as plain text, no HTML tags */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {stripHtml(job.description)}
        </p>

        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="bg-accent/50 text-accent-foreground px-2 py-1 rounded-md text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          <div>Client: {clientName}</div>
          <div>Timezone: {job.timezone || "N/A"}</div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
