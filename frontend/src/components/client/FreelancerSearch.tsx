import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Star, MapPin, DollarSign, Loader2 } from "lucide-react";
import axiosInstance from "@/api/axios";

interface FreelancerSearchProps {
  onHireFreelancer: (freelancer: any) => void;
}

export function FreelancerSearch({ onHireFreelancer }: FreelancerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<any[]>([]);

  const buildAvatarSrc = (img?: string) => {
    const apiBase = axiosInstance.defaults.baseURL || "";
    const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
    if (!img) return undefined;
    if (/^https?:\/\//i.test(img)) return img;
    if (img.startsWith('/')) return `${serverOrigin}${img}`;
    return `${serverOrigin}/${img}`;
  };

  const fetchFreelancers = async (q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/client/freelancers/search", {
        params: { searchTerm: q || undefined, page: 1, limit: 10 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const arr: any[] = res.data?.freelancers || [];
      // Sort by rating if available (avgRating|rating), desc
      const sorted = arr
        .map((f) => ({
          ...f,
          _rating: typeof f.avgRating === 'number' ? f.avgRating : (typeof f.rating === 'number' ? f.rating : 0),
        }))
        .sort((a, b) => (b._rating || 0) - (a._rating || 0));
      setFreelancers(sorted);
    } catch (e: any) {
      setError(e?.message || "Failed to load freelancers");
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  // View Profile now navigates to dedicated public route; no inline modal

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search freelancers by skills, title, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => fetchFreelancers(searchQuery)}>Search</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading freelancers...
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-red-600 mb-2">{error}</p>
          <Button variant="outline" onClick={() => fetchFreelancers(searchQuery)}>Retry</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {freelancers.map((f) => {
            const u = f.freelancerUser || f.user;
            const name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : `${f.firstName ?? ''} ${f.lastName ?? ''}`.trim();
            const title = f.expertise || f.shortBio || 'Freelancer';
            const rating = typeof f._rating === 'number' ? f._rating : 0;
            const reviews = Array.isArray(f.reviews) ? f.reviews.length : (typeof f.reviewsCount === 'number' ? f.reviewsCount : undefined);
            const location = f.country || f.city || 'Remote';
            const hourlyRate = f.hourlyRate || f.expectedRate || undefined;
            const img = u?.profileImage || f.profileImg;
            const avatarSrc = buildAvatarSrc(img);
            const skills: string[] = Array.isArray(f.skills) ? f.skills : (Array.isArray(f.category) ? f.category : []);

            return (
              <Card key={f.id || f.uuid} className="hover:shadow-lg transition">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{name?.[0] || 'F'}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{name || 'Unnamed Freelancer'}</h3>
                      <p className="text-sm text-muted-foreground">{title}</p>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{rating.toFixed(1)}</span>
                          {typeof reviews === 'number' && (
                            <span className="text-muted-foreground">({reviews})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {hourlyRate ? (
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <DollarSign className="w-5 h-5" />
                          {hourlyRate}/hr
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {f.shortBio && (
                    <p className="text-sm text-muted-foreground mt-4">
                      {f.shortBio}
                    </p>
                  )}

                  {skills && skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {skills.slice(0, 8).map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        const fid = f.id || f.uuid;
                        if (fid) window.location.href = `/client/freelancers/${fid}`;
                      }}
                    >
                      View Profile
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => onHireFreelancer(f)}
                    >
                      Hire Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
