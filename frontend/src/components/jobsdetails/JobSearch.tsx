// import React, { useState } from "react";
// import { Input } from "../ui/input";
// import { Button } from "../ui/button";
// import { Search } from "lucide-react";

// interface JobsSearchProps {
//   onSearch: (term: string) => void;
//   onSubmit?: () => void; // ✅ optional prop for "submit" action
//   initialTerm?: string;
// }

// const JobsSearch: React.FC<JobsSearchProps> = ({
//   onSearch,
//   onSubmit,
//   initialTerm = "",
// }) => {
//   const [searchTerm, setSearchTerm] = useState(initialTerm);

//   const handleSearch = () => {
//     onSearch(searchTerm); // update parent state
//     if (onSubmit) onSubmit(); // ✅ trigger navigation if provided
//   };

//   return (
//     <div className="flex w-full max-w-md items-center space-x-2">
//       <Input
//         placeholder="Search for jobs (e.g. React, Design, Writing)"
//         className="bg-background border-muted"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && handleSearch()} // ✅ press Enter support
//       />
//       <Button onClick={handleSearch}>
//         <Search className="w-4 h-4" />
//       </Button>
//     </div>
//   );
// };

// export default JobsSearch;

import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "@/api/axios";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

interface JobsSearchProps {
  onSearch: (term: string) => void;
  onSubmit?: (term: string) => void; // ✅ optional but supports parent navigation
  initialTerm?: string;
}

const JobsSearch: React.FC<JobsSearchProps> = ({
  onSearch,
  onSubmit,
  initialTerm = "",
}) => {
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = () => {
    onSearch(searchTerm);
    if (onSubmit) onSubmit(searchTerm);
    setOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        // Ensure dropdown opens immediately while we fetch
        setOpen(true);
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        const res = await axiosInstance.get("/jobs/suggest", {
          params: { q: term, limit: 5 },
          signal: abortRef.current.signal,
        });
        const items = Array.isArray(res.data?.suggestions) ? res.data.suggestions : [];
        const mapped = items.map((j: any) => ({ id: String(j.id), title: j.title })).filter((j: any) => !!j.title);
        setSuggestions(mapped);
        setOpen(true);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [searchTerm]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative flex w-full max-w-md items-center space-x-2">
      <div className="relative flex-1">
        <Input
          placeholder="Search for jobs (e.g. React, Design, Writing)"
          className="bg-background border-muted"
          value={searchTerm}
          onChange={(e) => {
            const v = e.target.value;
            setSearchTerm(v);
            if (v.trim()) setOpen(true); else setOpen(false);
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            if (searchTerm.trim()) setOpen(true);
          }}
        />
        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow">
            <ul className="max-h-60 overflow-auto">
              {loading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Searching...</li>
              )}
              {!loading && suggestions.map((s) => (
                <li
                  key={s.id}
                  className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchTerm(s.title);
                    onSearch(s.title);
                    if (onSubmit) onSubmit(s.title);
                    setOpen(false);
                  }}
                >
                  {s.title}
                </li>
              ))}
              {!loading && suggestions.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No suggestions</li>
              )}
            </ul>
          </div>
        )}
      </div>
      <Button onClick={handleSearch}>
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default JobsSearch;

