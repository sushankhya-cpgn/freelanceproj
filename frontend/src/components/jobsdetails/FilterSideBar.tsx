// import { Card } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { useState, useEffect } from "react";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Input } from "@/components/ui/input";

// interface FilterSidebarProps {
//   onFilterChange: (filters: FilterState) => void;
// }

// export interface FilterState {
//   jobType: string[];
//   experienceLevel: string[];
//   budgetMin?: number;
//   budgetMax?: number;
//   skills?: string[];
// }

// export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange }) => {
//   const [jobType, setJobType] = useState<string[]>([]);
//   const [experienceLevel, setExperienceLevel] = useState<string[]>([]);
//   const [budgetMin, setBudgetMin] = useState<number>(0);
//   const [budgetMax, setBudgetMax] = useState<number>(10000);
//   const [skills, setSkills] = useState<string[]>([]);

//   // Separate state for input display (updates immediately)
//   const [budgetMinInput, setBudgetMinInput] = useState<string>("0");
//   const [budgetMaxInput, setBudgetMaxInput] = useState<string>("10000");

//   const availableSkills = [
//     "React",
//     "Node.js",
//     "Python",
//     "Django",
//     "Next.js",
//     "JavaScript",
//     "TypeScript",
//     "UI/UX Design",
//     "AWS",
//     "Docker",
//     "Kubernetes",
//     "SQL",
//   ];

//   // Debounced filter notification - only notify parent after user stops typing
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       onFilterChange({
//         jobType,
//         experienceLevel,
//         budgetMin,
//         budgetMax,
//         skills,
//       });
//     }, 200); // Wait 500ms after last change before sending to parent

//     return () => clearTimeout(timeoutId);
//   }, [jobType, experienceLevel, budgetMin, budgetMax, skills]);

//   // Debounced budget updates
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       const min = Number(budgetMinInput) || 0;
//       const max = Number(budgetMaxInput) || 10000;
//       setBudgetMin(min);
//       setBudgetMax(max);
//     }, 800); // Longer delay for price inputs (800ms)

//     return () => clearTimeout(timeoutId);
//   }, [budgetMinInput, budgetMaxInput]);

//   const toggleItem = (arr: string[], value: string) =>
//     arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

//   return (
//     <Card className="p-6 border border-border bg-card sticky top-4 space-y-6">
//       <h2 className="text-lg font-semibold mb-4 text-foreground">Filter by</h2>

//       {/* Job Type */}
//       <div>
//         <h3 className="font-medium mb-3 text-foreground">Job Type</h3>
//         <div className="space-y-2">
//           {["hourly", "fixed"].map((type) => (
//             <div key={type} className="flex items-center space-x-2">
//               <Checkbox
//                 id={type}
//                 checked={jobType.includes(type)}
//                 onCheckedChange={() => setJobType(toggleItem(jobType, type))}
//               />
//               <Label htmlFor={type} className="text-sm cursor-pointer text-foreground">
//                 {type === "hourly" ? "Hourly" : "Fixed-Price"}
//               </Label>
//             </div>
//           ))}
//         </div>
//       </div>

//       <Separator />

//       {/* Experience Level */}
//       <div>
//         <h3 className="font-medium mb-3 text-foreground">Experience Level</h3>
//         <div className="space-y-2">
//           {["entry", "intermediate", "expert"].map((level) => (
//             <div key={level} className="flex items-center space-x-2">
//               <Checkbox
//                 id={level}
//                 checked={experienceLevel.includes(level)}
//                 onCheckedChange={() => setExperienceLevel(toggleItem(experienceLevel, level))}
//               />
//               <Label htmlFor={level} className="text-sm cursor-pointer text-foreground">
//                 {level.charAt(0).toUpperCase() + level.slice(1)}
//               </Label>
//             </div>
//           ))}
//         </div>
//       </div>

//       <Separator />

//       {/* Budget */}
//       <div>
//         <h3 className="font-medium mb-3 text-foreground">Budget Range</h3>
//         <div className="flex space-x-2">
//           <Input
//             type="number"
//             placeholder="Min"
//             value={budgetMinInput}
//             onChange={(e) => setBudgetMinInput(e.target.value)}
//             className="w-1/2"
//             min="0"
//           />
//           <Input
//             type="number"
//             placeholder="Max"
//             value={budgetMaxInput}
//             onChange={(e) => setBudgetMaxInput(e.target.value)}
//             className="w-1/2"
//             min="0"
//           />
//         </div>
//       </div>

//       <Separator />

//       {/* Skills */}
//       <div>
//         <h3 className="font-medium mb-3 text-foreground">Skills</h3>
//         <ScrollArea className="h-40 pr-2">
//           <div className="space-y-2">
//             {availableSkills.map((skill) => (
//               <div key={skill} className="flex items-center space-x-2">
//                 <Checkbox
//                   id={skill}
//                   checked={skills.includes(skill)}
//                   onCheckedChange={() => setSkills(toggleItem(skills, skill))}
//                 />
//                 <Label htmlFor={skill} className="text-sm cursor-pointer text-foreground">
//                   {skill}
//                 </Label>
//               </div>
//             ))}
//           </div>
//         </ScrollArea>
//       </div>
//     </Card>
//   );
// };

// import { Card } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { useState, useEffect } from "react";
// import { Input } from "@/components/ui/input";

// interface FilterSidebarProps {
//   onFilterChange: (filters: FilterState) => void;
// }

// export interface FilterState {
//   jobType?: string;
//   experienceLevel?: string;
//   budgetMin?: number;
//   budgetMax?: number;
//   skills?: string;
// }

// export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange }) => {
//   const [jobType, setJobType] = useState<string>("");
//   const [experienceLevel, setExperienceLevel] = useState<string>("");
//   const [budgetMin, setBudgetMin] = useState<number>(0);
//   const [budgetMax, setBudgetMax] = useState<number>(10000);
//   const [skills, setSkills] = useState<string>("");

//   // Separate state for input display (updates immediately)
//   const [budgetMinInput, setBudgetMinInput] = useState<string>("0");
//   const [budgetMaxInput, setBudgetMaxInput] = useState<string>("10000");

//   const availableSkills = [
//     "React",
//     "Node.js",
//     "Python",
//     "Django",
//     "Next.js",
//     "JavaScript",
//     "TypeScript",
//     "UI/UX Design",
//     "AWS",
//     "Docker",
//     "Kubernetes",
//     "SQL",
//   ];

//   // Notify parent when filters change
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       onFilterChange({
//         jobType: jobType || undefined,
//         experienceLevel: experienceLevel || undefined,
//         budgetMin,
//         budgetMax,
//         skills: skills || undefined,
//       });
//     }, 200);

//     return () => clearTimeout(timeoutId);
//   }, [jobType, experienceLevel, budgetMin, budgetMax, skills]);

//   // Debounced budget updates
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       const min = Number(budgetMinInput) || 0;
//       const max = Number(budgetMaxInput) || 10000;
//       setBudgetMin(min);
//       setBudgetMax(max);
//     }, 800);

//     return () => clearTimeout(timeoutId);
//   }, [budgetMinInput, budgetMaxInput]);

//   return (
//     <Card className="p-6 border border-border bg-card sticky top-4 space-y-6">
//       <h2 className="text-lg font-semibold mb-4 text-foreground">Filter by</h2>

//       {/* Job Type */}
//       <div>
//         <Label htmlFor="jobType" className="font-medium mb-2 block text-foreground">
//           Job Type
//         </Label>
//         <select
//           id="jobType"
//           value={jobType}
//           onChange={(e) => setJobType(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//         >
//           <option value="">Any</option>
//           <option value="hourly">Hourly</option>
//           <option value="fixed">Fixed-Price</option>
//         </select>
//       </div>

//       <Separator />

//       {/* Experience Level */}
//       <div>
//         <Label htmlFor="experienceLevel" className="font-medium mb-2 block text-foreground">
//           Experience Level
//         </Label>
//         <select
//           id="experienceLevel"
//           value={experienceLevel}
//           onChange={(e) => setExperienceLevel(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//         >
//           <option value="">Any</option>
//           <option value="entry">Entry</option>
//           <option value="intermediate">Intermediate</option>
//           <option value="expert">Expert</option>
//         </select>
//       </div>

//       <Separator />

//       {/* Budget */}
//       <div>
//         <Label className="font-medium mb-2 block text-foreground">Budget Range</Label>
//         <div className="flex space-x-2">
//           <Input
//             type="number"
//             placeholder="Min"
//             value={budgetMinInput}
//             onChange={(e) => setBudgetMinInput(e.target.value)}
//             className="w-1/2"
//             min="0"
//           />
//           <Input
//             type="number"
//             placeholder="Max"
//             value={budgetMaxInput}
//             onChange={(e) => setBudgetMaxInput(e.target.value)}
//             className="w-1/2"
//             min="0"
//           />
//         </div>
//       </div>

//       <Separator />

//       {/* Skills */}
//       <div>
//         <Label htmlFor="skills" className="font-medium mb-2 block text-foreground">
//           Skills
//         </Label>
//         <select
//           id="skills"
//           value={skills}
//           onChange={(e) => setSkills(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//         >
//           <option value="">Any</option>
//           {availableSkills.map((skill) => (
//             <option key={skill} value={skill}>
//               {skill}
//             </option>
//           ))}
//         </select>
//       </div>
//     </Card>
//   );
// };


import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  jobType?: string;
  experienceLevel?: string;
  budgetMin?: number;
  budgetMax?: number;
  skills?: string[];
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange }) => {
  const [jobType, setJobType] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [budgetMin, setBudgetMin] = useState<number>(0);
  const [budgetMax, setBudgetMax] = useState<number>(10000);
  const [skills, setSkills] = useState<string[]>([]);

  // Separate state for input display (updates immediately)
  const [budgetMinInput, setBudgetMinInput] = useState<string>("0");
  const [budgetMaxInput, setBudgetMaxInput] = useState<string>("10000");

  const availableSkills = [
    "React",
    "Node.js",
    "Python",
    "Django",
    "Next.js",
    "JavaScript",
    "TypeScript",
    "UI/UX Design",
    "AWS",
    "Docker",
    "Kubernetes",
    "SQL",
  ];

  // Notify parent when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({
        jobType: jobType || undefined,
        experienceLevel: experienceLevel || undefined,
        budgetMin,
        budgetMax,
        skills: skills.length > 0 ? skills : undefined,
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [jobType, experienceLevel, budgetMin, budgetMax, skills]);

  // Debounced budget updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const min = Number(budgetMinInput) || 0;
      const max = Number(budgetMaxInput) || 10000;
      setBudgetMin(min);
      setBudgetMax(max);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [budgetMinInput, budgetMaxInput]);

  const handleSkillsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setSkills(selectedOptions);
  };

  return (
    <Card className="p-6 border border-border bg-card sticky top-4 space-y-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Filter by</h2>

      {/* Job Type */}
      <div>
        <Label htmlFor="jobType" className="font-medium mb-2 block text-foreground">
          Job Type
        </Label>
        <select
          id="jobType"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Any</option>
          <option value="hourly">Hourly</option>
          <option value="fixed">Fixed-Price</option>
        </select>
      </div>

      <Separator />

      {/* Experience Level */}
      <div>
        <Label htmlFor="experienceLevel" className="font-medium mb-2 block text-foreground">
          Experience Level
        </Label>
        <select
          id="experienceLevel"
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Any</option>
          <option value="entry">Entry</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <Separator />

      {/* Budget */}
      <div>
        <Label className="font-medium mb-2 block text-foreground">Budget Range</Label>
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Min"
            value={budgetMinInput}
            onChange={(e) => setBudgetMinInput(e.target.value)}
            className="w-1/2"
            min="0"
          />
          <Input
            type="number"
            placeholder="Max"
            value={budgetMaxInput}
            onChange={(e) => setBudgetMaxInput(e.target.value)}
            className="w-1/2"
            min="0"
          />
        </div>
      </div>

      <Separator />

      {/* Skills */}
      <div>
        <Label htmlFor="skills" className="font-medium mb-2 block text-foreground">
          Skills
        </Label>
        <select
          id="skills"
          multiple
          value={skills}
          onChange={handleSkillsChange}
          className="w-full border rounded px-3 py-2 h-40"
        >
          {availableSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
};
