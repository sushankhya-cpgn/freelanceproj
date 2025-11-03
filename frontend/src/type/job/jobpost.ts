export interface JobPost {
  id: number; // backend returns numeric IDs
  title: string;
  description: string;
  postedTime?: string; // e.g., "2 days ago" or ISO date string
  jobType?: "Fixed-price" | "Hourly" | string;
  experienceLevel: "entry" | "intermediate" | "expert" | string;
  projectDuration?: string;
  budgetType?: "fixed" | "hourly" | string;
  budget?: number | string;
  minBudget?: number | string;
  maxBudget?: number | string;
  skills: string[];
  timezone?: string;
  location?: string | null;
  status?: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  proposals?: {
    count: number;
  };
  connectRequired?: number;
  posted_date?: string;
  last_date_to_apply?: string;
  applicationDeadline?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // 🧍 Client info (nested)
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    profileImage?: string | null;
    location?: string;
    rating?: number;
    reviewsCount?: number;
    paymentVerified?: boolean;
  };
}
