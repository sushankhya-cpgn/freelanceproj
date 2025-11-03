// // import React, { useState, useEffect } from "react";
// // import { useLocation } from "react-router-dom";
// // import axiosInstance from "@/api/axios";
// // import Header from "@/components/layout/Header";
// // import JobsSearch from "@/components/jobsdetails/JobSearch";
// // import JobCard from "@/components/jobsdetails/JobCard";
// // import JobDetailModal from "@/components/jobsdetails/JobDetailModal";
// // import { JobPagination } from "@/components/pagination/pagination";
// // import { FilterSidebar, type FilterState } from "@/components/jobsdetails/FilterSideBar";

// // import type { JobPost } from "@/type/job/jobpost";

// // const JobsPage: React.FC = () => {
// //   const location = useLocation();
// //   const queryParams = new URLSearchParams(location.search);
// //   const initialSearch = queryParams.get("search") || "";

// //   const [searchTerm, setSearchTerm] = useState(initialSearch);
// //   const [filters, setFilters] = useState<FilterState>({
// //     jobType: [],
// //     experienceLevel: [],
// //     budgetMin: undefined,
// //     budgetMax: undefined,
// //     skills: [],
// //   });
// //   const [jobs, setJobs] = useState<JobPost[]>([]);
// //   const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [page, setPage] = useState(1);
// //   const [limit] = useState(10);

// //   const token = localStorage.getItem("token");
// //      const freelancerNav = [
// //     { label: "Freelancer Search", href: "/freelancers" },
// //     { label: "Post Job", href: "/post-job" },
// //     { label: "Applications", href: "/applications" },
// //     { label: "Messages", href: "/messages" },
// //     { label: "Contracts", href: "/contracts" },
// //   ];

// //   // Fetch jobs from API
// //   const fetchJobs = async () => {
// //     try {
// //       setLoading(true);
// //       setError(null);

// //       const response = await axios.get(
// //         `http://localhost:3000/api/freelancer/jobs/search`,
// //         {
// //           params: {
// //             searchTerm,
// //             skills: filters.skills,
// //             budgetMin: filters.budgetMin,
// //             budgetMax: filters.budgetMax,
// //             jobType: filters.jobType[0], // assuming single value
// //             experienceLevel: filters.experienceLevel[0], // assuming single value
// //             page,
// //             limit,
// //           },
// //           headers: {
// //             Authorization: `Bearer ${token}`,
// //           },
// //         }
// //       );

// //       const data = response.data;
// //       if (!data.success) throw new Error(data.message || "Failed to fetch");

// //       setJobs(Array.isArray(data.jobs) ? data.jobs : [data.job]);
// //     } catch (err: any) {
// //       setError(err.message || "Failed to load jobs");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Fetch on filters, searchTerm, page change
// //   useEffect(() => {
// //     fetchJobs();
// //   }, [searchTerm, filters, page]);

// //   return (
// //     <div className="flex flex-col min-h-screen bg-background">
// //       <Header navItems={freelancerNav} />

// //       <div className="bg-gradient-to-b from-muted/30 to-background border-b">
// //         <div className="container mx-auto px-4 py-8 md:py-12">
// //           <div className="max-w-4xl mx-auto space-y-4">
// //             <div className="text-center space-y-2 mb-6">
// //               <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
// //                 Find Your Next Opportunity
// //               </h1>
// //               <p className="text-muted-foreground text-sm md:text-base">
// //                 Discover projects that match your skills and expertise
// //               </p>
// //             </div>
// //             <div className=" flex justify-center">
// //              <JobsSearch
// //               initialTerm={searchTerm}
// //               onSearch={(term) => {
// //                 setSearchTerm(term);
// //                 setPage(1); // reset page when search changes
// //               }}
// //             />
// //             </div>
// //           </div>
// //         </div>
// //       </div>

      

// //       {/* Main Content */}
// //       <div className="container mx-auto px-4 py-8 md:px-6 lg:px-10 flex gap-6">
// //         {/* Sidebar */}
// //         <FilterSidebar
// //           onFilterChange={(newFilters) => {
// //             setFilters(newFilters);
// //             setPage(1); // reset page on filter change
// //           }}
// //         />

// //         {/* Jobs List */}
      
// //         <div className="flex-1 space-y-4">
// //           {loading && <p>Loading jobs...</p>}
// //           {error && <p className="text-red-500">{error}</p>}
// //           {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

// //           {!loading &&
// //             !error &&
// //             jobs.map((job) => (
// //               <div key={job.id}>
// //                 <JobCard job={job} onViewDetails={() => setSelectedJob(job)} />
// //                 {selectedJob?.id === job.id && (
// //                   <JobDetailModal
// //                     job={job}
// //                     open={selectedJob?.id === job.id}
// //                     onClose={() => setSelectedJob(null)}
// //                   />
// //                 )}
// //               </div>
// //             ))}

// //           {/* Pagination */}
// //           {/* {jobs.length > 0 && (
// //             <div className="mt-6 flex justify-center">
// //               <JobPagination
// //                 page={page}
// //                 setPage={setPage}
// //                 totalCount={100} // ideally from API response
// //                 pageSize={limit}
// //               />
// //             </div>
// //           )} */}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default JobsPage;

// import React, { useState, useEffect, useRef } from "react";
// import { useLocation } from "react-router-dom";
// import axios from "axios";
// import Header from "@/components/layout/Header";
// import JobsSearch from "@/components/jobsdetails/JobSearch";
// import JobCard from "@/components/jobsdetails/JobCard";
// import JobDetailModal from "@/components/jobsdetails/JobDetailModal";
// import { JobPagination } from "@/components/pagination/pagination";
// import { FilterSidebar, type FilterState } from "@/components/jobsdetails/FilterSideBar";

// import type { JobPost } from "@/type/job/jobpost";

// const JobsPage: React.FC = () => {
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const initialSearch = queryParams.get("search") || "";

//   const [searchTerm, setSearchTerm] = useState(initialSearch);
//   const [filters, setFilters] = useState<FilterState>({
//     jobType: [],
//     experienceLevel: [],
//     budgetMin: undefined,
//     budgetMax: undefined,
//     skills: [],
//   });
//   const [jobs, setJobs] = useState<JobPost[]>([]);
//   const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10);

//   // AbortController ref to cancel previous requests
//   const abortControllerRef = useRef<AbortController | null>(null);

//   const token = localStorage.getItem("token");
//   const freelancerNav = [
//     { label: "Freelancer Search", href: "/freelancers" },
//     { label: "Post Job", href: "/post-job" },
//     { label: "Applications", href: "/applications" },
//     { label: "Messages", href: "/messages" },
//     { label: "Contracts", href: "/contracts" },
//   ];

//   // Fetch jobs from API with abort control
//   const fetchJobs = async () => {
//     try {
//       // Cancel previous request if still pending
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }

//       // Create new abort controller for this request
//       abortControllerRef.current = new AbortController();

//       setLoading(true);
//       setError(null);

//       const response = await axios.get(
//         `http://localhost:3000/api/freelancer/jobs/search`,
//         {
//           params: {
//             searchTerm,
//             skills: filters.skills,
//             budgetMin: filters.budgetMin,
//             budgetMax: filters.budgetMax,
//             jobType: filters.jobType, // assuming single value
//             experienceLevel: filters.experienceLevel, // assuming single value
//             page,
//             limit,
//           },
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           signal: abortControllerRef.current.signal,
//         }
//       );

//       const data = response.data;
//       if (!data.success) throw new Error(data.message || "Failed to fetch");

//       setJobs(Array.isArray(data.jobs) ? data.jobs : [data.job]);
//     } catch (err: any) {
//       // Don't show error if request was cancelled
//       if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
//         return;
//       }
//       setError(err.message || "Failed to load jobs");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced fetch - wait for user to stop changing filters
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       fetchJobs();
//     }, 300); // Additional 300ms delay before API call

//     return () => {
//       clearTimeout(timeoutId);
//     };
//   }, [searchTerm, filters, page]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//   }, []);

//   return (
//     <div className="flex flex-col min-h-screen bg-background">
//       <Header navItems={freelancerNav} />

//       <div className="bg-gradient-to-b from-muted/30 to-background border-b">
//         <div className="container mx-auto px-4 py-8 md:py-12">
//           <div className="max-w-4xl mx-auto space-y-4">
//             <div className="text-center space-y-2 mb-6">
//               <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
//                 Find Your Next Opportunity
//               </h1>
//               <p className="text-muted-foreground text-sm md:text-base">
//                 Discover projects that match your skills and expertise
//               </p>
//             </div>
//             <div className=" flex justify-center">
//              <JobsSearch
//               initialTerm={searchTerm}
//               onSearch={(term) => {
//                 setSearchTerm(term);
//                 setPage(1); // reset page when search changes
//               }}
//             />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8 md:px-6 lg:px-10 flex gap-6">
//         {/* Sidebar */}
//         <FilterSidebar
//           onFilterChange={(newFilters) => {
//             setFilters(newFilters);
//             setPage(1); // reset page on filter change
//           }}
//         />

//         {/* Jobs List */}
//         <div className="flex-1 space-y-4">
//           {loading && <p>Loading jobs...</p>}
//           {error && <p className="text-red-500">{error}</p>}
//           {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

//           {!loading &&
//             !error &&
//             jobs.map((job) => (
//               <div key={job.id}>
//                 <JobCard job={job} onViewDetails={() => setSelectedJob(job)} />
//                 {selectedJob?.id === job.id && (
//                   <JobDetailModal
//                     job={job}
//                     open={selectedJob?.id === job.id}
//                     onClose={() => setSelectedJob(null)}
//                   />
//                 )}
//               </div>
//             ))}

//           {/* Pagination */}
//           {/* {jobs.length > 0 && (
//             <div className="mt-6 flex justify-center">
//               <JobPagination
//                 page={page}
//                 setPage={setPage}
//                 totalCount={100} // ideally from API response
//                 pageSize={limit}
//               />
//             </div>
//           )} */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default JobsPage;

// import React, { useState, useEffect, useRef } from "react";
// import { useLocation } from "react-router-dom";
// import axios from "axios";
// import Header from "@/components/layout/Header";
// import JobsSearch from "@/components/jobsdetails/JobSearch";
// import JobCard from "@/components/jobsdetails/JobCard";
// import JobDetailModal from "@/components/jobsdetails/JobDetailModal";
// import { JobPagination } from "@/components/pagination/pagination";
// import { FilterSidebar, type FilterState } from "@/components/jobsdetails/FilterSideBar";

// import type { JobPost } from "@/type/job/jobpost";

// const JobsPage: React.FC = () => {
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const initialSearch = queryParams.get("search") || "";

//   const [searchTerm, setSearchTerm] = useState(initialSearch);
//   const [filters, setFilters] = useState<FilterState>({
//     jobType: undefined,
//     experienceLevel: undefined,
//     budgetMin: undefined,
//     budgetMax: undefined,
//     skills: undefined,
//   });
//   const [jobs, setJobs] = useState<JobPost[]>([]);
//   const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10);

//   // AbortController ref to cancel previous requests
//   const abortControllerRef = useRef<AbortController | null>(null);

//   const token = localStorage.getItem("token");
//   const freelancerNav = [
//     { label: "Freelancer Search", href: "/freelancers" },
//     { label: "Post Job", href: "/post-job" },
//     { label: "Applications", href: "/applications" },
//     { label: "Messages", href: "/messages" },
//     { label: "Contracts", href: "/contracts" },
//   ];

//   const fetchJobs = async () => {
//     try {
//       if (abortControllerRef.current) abortControllerRef.current.abort();
//       abortControllerRef.current = new AbortController();

//       setLoading(true);
//       setError(null);

//       // Build query params only if values exist
//       const params: any = {
//         searchTerm,
//         page,
//         limit,
//       };
//       if (filters.skills) params.skills = filters.skills;
//       if (filters.budgetMin !== undefined) params.budgetMin = filters.budgetMin;
//       if (filters.budgetMax !== undefined) params.budgetMax = filters.budgetMax;
//       if (filters.jobType) params.jobType = filters.jobType;
//       if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;

//       const response = await axios.get(
//         `http://localhost:3000/api/freelancer/jobs/search`,
//         {
//           params,
//           headers: { Authorization: `Bearer ${token}` },
//           signal: abortControllerRef.current.signal,
//         }
//       );

//       const data = response.data;
//       if (!data.success) throw new Error(data.message || "Failed to fetch");

//       setJobs(Array.isArray(data.jobs) ? data.jobs : [data.job]);
//     } catch (err: any) {
//       if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
//       setError(err.message || "Failed to load jobs");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debounced fetch
//   useEffect(() => {
//     const timeoutId = setTimeout(() => fetchJobs(), 300);
//     return () => clearTimeout(timeoutId);
//   }, [searchTerm, filters, page]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => abortControllerRef.current?.abort();
//   }, []);

//   return (
//     <div className="flex flex-col min-h-screen bg-background">
//       <Header navItems={freelancerNav} />

//       <div className="bg-gradient-to-b from-muted/30 to-background border-b">
//         <div className="container mx-auto px-4 py-8 md:py-12">
//           <div className="max-w-4xl mx-auto space-y-4">
//             <div className="text-center space-y-2 mb-6">
//               <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
//                 Find Your Next Opportunity
//               </h1>
//               <p className="text-muted-foreground text-sm md:text-base">
//                 Discover projects that match your skills and expertise
//               </p>
//             </div>
//             <div className=" flex justify-center">
//               <JobsSearch
//                 initialTerm={searchTerm}
//                 onSearch={(term) => {
//                   setSearchTerm(term);
//                   setPage(1);
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8 md:px-6 lg:px-10 flex gap-6">
//         <FilterSidebar
//           onFilterChange={(newFilters) => {
//             setFilters(newFilters);
//             setPage(1);
//           }}
//         />

//         <div className="flex-1 space-y-4">
//           {loading && <p>Loading jobs...</p>}
//           {error && <p className="text-red-500">{error}</p>}
//           {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

//           {!loading &&
//             !error &&
//             jobs.map((job) => (
//               <div key={job.id}>
//                 <JobCard job={job} onViewDetails={() => setSelectedJob(job)} />
//                 {selectedJob?.id === job.id && (
//                   <JobDetailModal
//                     job={job}
//                     open={selectedJob?.id === job.id}
//                     onClose={() => setSelectedJob(null)}
//                   />
//                 )}
//               </div>
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default JobsPage;

import React, { useState, useEffect, useRef } from "react";
import {  useLocation } from "react-router-dom";
import axiosInstance from "@/api/axios";
import Header from "@/components/layout/Header";
import JobsSearch from "@/components/jobsdetails/JobSearch";
import JobCard from "@/components/jobsdetails/JobCard";
import JobDetailModal from "@/components/jobsdetails/JobDetailModal";
import { JobPagination } from "@/components/pagination/pagination";
import { FilterSidebar, type FilterState } from "@/components/jobsdetails/FilterSideBar";
import { useNotifications } from "@/context/NotificationContext";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";

import type { JobPost } from "@/type/job/jobpost";

const JobsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filters, setFilters] = useState<FilterState>({
    jobType: undefined,
    experienceLevel: undefined,
    budgetMin: undefined,
    budgetMax: undefined,
    skills: [],
  });
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const abortControllerRef = useRef<AbortController | null>(null);
  const token = localStorage.getItem("token");

  const fetchJobs = async () => {
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // Build params, send skills array if available
      const params: any = {
        searchTerm,
        page,
        limit,
      };
      if (filters.jobType) params.jobType = filters.jobType;
      if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;
      if (filters.budgetMin !== undefined) params.budgetMin = filters.budgetMin;
      if (filters.budgetMax !== undefined) params.budgetMax = filters.budgetMax;
      if (filters.skills && filters.skills.length > 0) params.skills = filters.skills;

      // Map UI params to backend search API
      const searchParams: any = {
        q: searchTerm || undefined,
        page,
        limit,
      };
      if (filters.jobType) searchParams.jobType = filters.jobType;
      if (filters.experienceLevel) searchParams.experienceLevel = filters.experienceLevel;
      if (filters.budgetMin !== undefined) searchParams.budgetMin = filters.budgetMin;
      if (filters.budgetMax !== undefined) searchParams.budgetMax = filters.budgetMax;
      if (filters.skills && filters.skills.length > 0) searchParams.skills = filters.skills.join(",");

      const response = await axiosInstance.get(
        "/jobs/search",
        {
          params: searchParams,
          signal: abortControllerRef.current.signal,
        }
      );

      const data = response.data;
      if (!data.success) throw new Error(data.message || "Failed to fetch");

      const jobsArray = Array.isArray(data.jobs) ? data.jobs : (data.job ? [data.job] : []);
      setJobs(jobsArray);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchJobs(), 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, page]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header navItems={FREELANCER_NAV_ITEMS} showLogout />

      <div className="bg-gradient-to-b from-muted/30 to-background border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Find Your Next Opportunity
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Discover projects that match your skills and expertise
              </p>
            </div>
            <div className=" flex justify-center">
              <JobsSearch
                initialTerm={searchTerm}
                onSearch={(term) => {
                  setSearchTerm(term);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-10">
        <div className="space-y-4">
          {loading && <p>Loading jobs...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

          {!loading &&
            !error &&
            jobs.map((job) => (
              <div key={job.id}>
                <JobCard job={job} onViewDetails={() => setSelectedJob(job)} />
                {selectedJob?.id === job.id && (
                  <JobDetailModal
                    job={job}
                    open={selectedJob?.id === job.id}
                    onClose={() => setSelectedJob(null)}
                  />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
