// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // ✅ from react-router-dom
// import JobsSearch from "../jobsdetails/JobSearch";

// const HeroSection: React.FC = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const navigate = useNavigate(); // ✅ navigation hook

//   const handleSearch = () => {
//     if (searchTerm.trim()) {
//       // navigate to /jobs page with search query
//       navigate(`/jobs?search=${encodeURIComponent(searchTerm.trim())}`);
//     }
//   };

//   return (
//     <section className="py-24 text-center bg-gradient-to-br from-indigo-500/10 to-transparent">
//       <h2 className="text-4xl md:text-5xl font-bold mb-4">
//         Find Your Next Freelance Opportunity
//       </h2>
//       <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
//         Join thousands of professionals using FreelancePro to land projects that match your skills and passion.
//       </p>

//       <div className="flex justify-center">
//         <div className="flex w-full max-w-md items-center space-x-2">
//           <JobsSearch
//             onSearch={setSearchTerm}
//             initialTerm={searchTerm}
//             // onSubmit={handleSearch} // optional if supported
//           />
        
//         </div>
//       </div>
//     </section>
//   );
// };

// export default HeroSection;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import JobsSearch from "../jobsdetails/JobSearch";

const HeroSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // ✅ Receives latest term directly from child
  const handleSearch = (term: string) => {
    if (term.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <section className="py-24 text-center bg-gradient-to-br from-indigo-500/10 to-transparent">
      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        Find Your Next Freelance Opportunity
      </h2>
      <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
        Join thousands of professionals using FreelancePro to land projects that match your skills and passion.
      </p>

      <div className="flex justify-center">
        <div className="flex w-full max-w-md items-center space-x-2">
          <JobsSearch
            onSearch={setSearchTerm}
            onSubmit={handleSearch} // ✅ now receives the latest term
            initialTerm={searchTerm}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

