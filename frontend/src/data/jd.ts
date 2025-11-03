// export interface JobPost {
//   id: number;
//   title: string;
//   postedTime: string;
//   jobType: string;
//   experienceLevel: string;
//   estimatedBudget?: number;
//   hourlyRate?: { min: number; max: number };
//   description: string;
//   skills: string[];
//   location: string;
//   client: { location: string; rating: number; reviewsCount: number };
//   proposals: { count: number };
//   payment: { verified: boolean };
//   projectType: string;
//   contractToHire: boolean;
// }

// export const jobPosts: JobPost[] = [
//   {
//     id: 1,
//     title: "React Developer Needed",
//     postedTime: "2 hours ago",
//     jobType: "Fixed-price",
//     experienceLevel: "Intermediate",
//     estimatedBudget: 1500,
//     description: "Looking for an experienced React developer to build a modern web application with TypeScript and Tailwind CSS.",
//     skills: ["React", "TypeScript", "Tailwind CSS", "REST API"],
//     location: "Remote",
//     client: { location: "United States", rating: 4.8, reviewsCount: 45 },
//     proposals: { count: 12 },
//     payment: { verified: true },
//     projectType: "One-time project",
//     contractToHire: false,
//   },
//   {
//     id: 2,
//     title: "Full Stack Developer for SaaS Platform",
//     postedTime: "5 hours ago",
//     jobType: "Fixed-price",
//     experienceLevel: "Expert",
//     estimatedBudget: 5000,
//     description: "We need a senior full-stack developer to help build our SaaS platform using Node.js and React.",
//     skills: ["Node.js", "React", "PostgreSQL", "AWS"],
//     location: "Remote",
//     client: { location: "Canada", rating: 5.0, reviewsCount: 23 },
//     proposals: { count: 8 },
//     payment: { verified: true },
//     projectType: "Ongoing project",
//     contractToHire: true,
//   },
//   {
//     id: 3,
//     title: "Vue.js Developer for E-commerce Site",
//     postedTime: "1 day ago",
//     jobType: "Hourly",
//     experienceLevel: "Intermediate",
//     estimatedBudget: 30,
//     description: "We are looking for a skilled Vue.js developer to help redesign and optimize our e-commerce platform. Experience with Vuex and Vuetify is a plus.",
//     skills: ["Vue.js", "Vuex", "Vuetify", "JavaScript", "E-commerce"],
//     location: "Remote",
//     client: { location: "Australia", rating: 4.6, reviewsCount: 58 },
//     proposals: { count: 15 },
//     payment: { verified: true },
//     projectType: "Ongoing project",
//     contractToHire: false,
//   },
//   {
//     id: 4,
//     title: "Senior Python Developer for Data Analytics Tool",
//     postedTime: "3 days ago",
//     jobType: "Fixed-price",
//     experienceLevel: "Senior",
//     estimatedBudget: 4000,
//     description: "We're building a data analytics tool and need an experienced Python developer to help with back-end integration, data processing, and API development.",
//     skills: ["Python", "Django", "Data Analysis", "PostgreSQL", "API Development"],
//     location: "Remote",
//     client: { location: "United Kingdom", rating: 4.9, reviewsCount: 72 },
//     proposals: { count: 10 },
//     payment: { verified: true },
//     projectType: "One-time project",
//     contractToHire: true,
//   },
//   {
//     id: 5,
//     title: "Mobile App Developer (Flutter)",
//     postedTime: "2 days ago",
//     jobType: "Fixed-price",
//     experienceLevel: "Intermediate",
//     estimatedBudget: 2500,
//     description: "Looking for a mobile app developer with experience in Flutter to build a cross-platform mobile app for an education startup. You will work closely with the design team to create a seamless user experience.",
//     skills: ["Flutter", "Dart", "Firebase", "Mobile App Development", "UI/UX"],
//     location: "Remote",
//     client: { location: "Germany", rating: 4.7, reviewsCount: 34 },
//     proposals: { count: 20 },
//     payment: { verified: true },
//     projectType: "One-time project",
//     contractToHire: false,
//   },
//   {
//     id: 6,
//     title: "WordPress Developer for Custom Theme Development",
//     postedTime: "6 hours ago",
//     jobType: "Fixed-price",
//     experienceLevel: "Intermediate",
//     estimatedBudget: 1200,
//     description: "We need a WordPress developer to create a custom theme for our blog, including custom post types, taxonomies, and a unique homepage layout. Must be familiar with advanced WP hooks and filters.",
//     skills: ["WordPress", "PHP", "HTML", "CSS", "JavaScript"],
//     location: "Remote",
//     client: { location: "United States", rating: 4.5, reviewsCount: 30 },
//     proposals: { count: 5 },
//     payment: { verified: true },
//     projectType: "One-time project",
//     contractToHire: false,
//   },
//   {
//     id: 7,
//     title: "UI/UX Designer for Social Media App Redesign",
//     postedTime: "1 day ago",
//     jobType: "Fixed-price",
//     experienceLevel: "Expert",
//     estimatedBudget: 3000,
//     description: "We are looking for an experienced UI/UX designer to lead the redesign of our social media app. The ideal candidate should have a strong portfolio in mobile app design and user experience optimization.",
//     skills: ["UI/UX Design", "Mobile App Design", "Adobe XD", "Figma", "Prototyping"],
//     location: "Remote",
//     client: { location: "India", rating: 4.8, reviewsCount: 50 },
//     proposals: { count: 18 },
//     payment: { verified: true },
//     projectType: "One-time project",
//     contractToHire: false,
//   },
//   {
//     id: 8,
//     title: "DevOps Engineer for Cloud Infrastructure Setup",
//     postedTime: "7 hours ago",
//     jobType: "Hourly",
//     experienceLevel: "Senior",
//     estimatedBudget: 45,
//     description: "We need a senior DevOps engineer to set up and manage our cloud infrastructure on AWS. The role includes automation, CI/CD pipeline setup, and security audits.",
//     skills: ["AWS", "Docker", "Terraform", "CI/CD", "Linux"],
//     location: "Remote",
//     client: { location: "Canada", rating: 4.9, reviewsCount: 80 },
//     proposals: { count: 6 },
//     payment: { verified: true },
//     projectType: "Ongoing project",
//     contractToHire: true,
//   },
  
// ];
export interface JobPost {
  id: string;
  title: string;
  description: string;
  jobType: string;
  experienceLevel: string;
  estimatedBudget: number;
  postedTime: string;
  location: string;
  skills: string[];
  requiredConnects: number;
  client: {
    location: string;
    rating: number;
    reviewsCount: number;
  };
  payment: { verified: boolean };
  proposals: { count: number };
}
export const jobPosts: JobPost[] = [{
  id: "1",
  title: "React Frontend Developer",
  description: "Build a responsive UI...",
  jobType: "Fixed-price",
  experienceLevel: "Intermediate",
  estimatedBudget: 500,
  postedTime: "2h ago",
  location: "Remote",
  requiredConnects: 6,
  skills: ["React", "Tailwind", "API"],
  client: { location: "USA", rating: 4.9, reviewsCount: 120 },
  payment: { verified: true },
  proposals: { count: 15 }
}];

