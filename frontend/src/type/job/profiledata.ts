export interface PortfolioItem {
    name: string;
    type: string;
    url: string;
}

export interface Experience {

    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;

}

export interface ProfileData {
    name: string;
    bio: string;
    location: string;
    hourlyRate: string;
    availability: string;
    skills: string[];
    experience: Experience[];
    certifications: string[];
    portfolioItems: PortfolioItem[];
}

export interface Transaction {
    id: number;
    title: string;
    date: string;
    amount: number;
}

export interface PortfolioItem {
    name: string;
    type: string;
    url: string;
}
export interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycCompleted: boolean;
  paymentMethodAdded: boolean;
  email?: string;
  phone?: string;
  kycDocument?: string;
  paymentMethod?: string;
}