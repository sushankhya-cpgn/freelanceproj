import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axios";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Star, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CLIENT_NAV_ITEMS } from "@/constants/navigation";

const FreelancerProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freelancer, setFreelancer] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const { user } = useAuth();

  const buildServerUrl = (p?: string) => {
    const apiBase = axiosInstance.defaults.baseURL || "";
    const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
    if (!p) return undefined;
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith("/")) return `${serverOrigin}${p}`;
    return `${serverOrigin}/${p}`;
  };

  const avatarSrc = useMemo(() => {
    const u = freelancer?.freelancerUser || freelancer?.user;
    return buildServerUrl(u?.profileImage || freelancer?.profileImg);
  }, [freelancer]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const endpoint = token
          ? `/client/freelancers/${id}`
          : `/client/freelancers/public/${id}`;
        const res = await axiosInstance.get(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setFreelancer(res.data?.freelancer || res.data?.data || res.data);
        setStats(res.data?.stats || null);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={CLIENT_NAV_ITEMS} showLogout />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading profile...
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={CLIENT_NAV_ITEMS} showLogout />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const u = freelancer.freelancerUser || freelancer.user;
  const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || 
               [freelancer?.firstName, freelancer?.lastName].filter(Boolean).join(" ") || 
               "Unnamed Freelancer";
  const title = freelancer.expertise || freelancer.shortBio || u?.bio || "Freelancer";
  const location = u?.country || freelancer.country || freelancer.city || "Remote";
  
  // Combine skills from both User and Freelancer models
  const userSkills = Array.isArray(u?.skills) ? u.skills : [];
  const freelancerSkills = Array.isArray(freelancer.category) ? freelancer.category : [];
  const skills: string[] = [...new Set([...userSkills, ...freelancerSkills])];
  
  // Combine experiences from both models
  const userExperiences = Array.isArray(u?.experiences) ? u.experiences : [];
  const freelancerExperiences = Array.isArray(freelancer.employmentHistory) ? freelancer.employmentHistory : [];
  const experiences: any[] = [...userExperiences, ...freelancerExperiences];
  
  const languages = (freelancer.languages && typeof freelancer.languages === 'object') ? freelancer.languages : {};
  const education: any[] = Array.isArray(freelancer.education) ? freelancer.education : [];
  const certifications: any[] = Array.isArray(freelancer.certification) ? freelancer.certification : [];
  
  // Combine portfolio from both models
  const userPortfolio = Array.isArray(u?.portfolioItems) ? u.portfolioItems : [];
  const freelancerPortfolio = Array.isArray(freelancer.portfolio) ? freelancer.portfolio : [];
  const portfolio: any[] = [...userPortfolio, ...freelancerPortfolio];
  
  // Get hourly rate and availability
  const hourlyRate = u?.hourlyRate || null;
  const availability = u?.availability || null;

  // Ratings are shown directly in the stats card below; no separate variables needed

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={CLIENT_NAV_ITEMS} showLogout />

      <section className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{name[0] || 'F'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
              <div className="text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                <span className="font-medium">{title}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {location}
                </span>
                {u?.email && (
                  <span className="text-xs">{u.email}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {hourlyRate && (
                  <div className="px-3 py-1 rounded bg-muted">Rate: ${hourlyRate}/hr</div>
                )}
                {availability && (
                  <div className="px-3 py-1 rounded bg-muted capitalize">
                    Status: {availability}
                  </div>
                )}
                {freelancer.yearsOfExperience && (
                  <div className="px-3 py-1 rounded bg-muted">Experience: {freelancer.yearsOfExperience}</div>
                )}
                {freelancer.userType && (
                  <div className="px-3 py-1 rounded bg-muted capitalize">Type: {freelancer.userType}</div>
                )}
                {typeof freelancer.localFreelance === 'boolean' && (
                  <div className="px-3 py-1 rounded bg-muted">Local: {freelancer.localFreelance ? 'Yes' : 'No'}</div>
                )}
                {freelancer.hours && (
                  <div className="px-3 py-1 rounded bg-muted">Hours: {freelancer.hours}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate(`/contracts/create?freelancerId=${id}`)}>Hire Now</Button>
              <Button variant="outline" onClick={() => navigate(`/clientmessages?userId=${id}`)}>Message</Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {(u?.bio || freelancer.shortBio) ? (
                <>
                  {u?.bio && (
                    <div className="text-sm mb-3">
                      <p className="font-medium text-foreground mb-1">Professional Summary</p>
                      <p className="text-muted-foreground">{u.bio}</p>
                    </div>
                  )}
                  {freelancer.shortBio && u?.bio !== freelancer.shortBio && (
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Additional Info</p>
                      <p className="text-muted-foreground">{freelancer.shortBio}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No bio provided.</p>
              )}
              {skills.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, idx) => (
                      <Badge key={`${s}-${idx}`} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{exp.title || exp.position || exp.role || 'Position'}</div>
                        {exp.company && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            {exp.company}
                          </div>
                        )}
                        {(exp.startDate || exp.endDate || exp.startYear || exp.endYear) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {exp.startDate || exp.startYear || ''}{(exp.startDate || exp.startYear) ? ' - ' : ''}{exp.endDate || exp.endYear || (exp.current ? 'Present' : 'Present')}
                          </div>
                        )}
                        {exp.description && (
                          <p className="text-xs mt-2 text-foreground">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {portfolio.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {portfolio.map((p, idx) => {
                    const portfolioUrl = buildServerUrl(p.url) || (typeof p.url === 'string' ? p.url : '#');
                    const isImage = typeof p.url === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(p.url);
                    
                    return (
                      <div
                        key={idx}
                        className="p-3 border rounded hover:bg-accent/50 transition-colors"
                      >
                        {isImage && (
                          <img 
                            src={portfolioUrl} 
                            alt={p.name || p.title || 'Portfolio'} 
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        )}
                        <a
                          href={portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <div className="text-sm font-medium truncate hover:text-primary">
                            {p.name || p.title || 'Portfolio Item'}
                          </div>
                          {p.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {p.description}
                            </div>
                          )}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded border">
                  <div className="text-xs text-muted-foreground">Completed</div>
                  <div className="text-lg font-semibold flex items-center gap-1"><Briefcase className="h-4 w-4" />{stats?.completedContracts ?? 0}</div>
                </div>
                <div className="p-3 rounded border">
                  <div className="text-xs text-muted-foreground">Active</div>
                  <div className="text-lg font-semibold flex items-center gap-1"><Briefcase className="h-4 w-4" />{stats?.activeContracts ?? 0}</div>
                </div>
                <div className="p-3 rounded border">
                  <div className="text-xs text-muted-foreground">Total Jobs</div>
                  <div className="text-lg font-semibold">{stats?.totalContracts ?? 0}</div>
                </div>
                <div className="p-3 rounded border">
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="text-lg font-semibold inline-flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />{(typeof stats?.avgRating === 'number' ? stats.avgRating : 0).toFixed(1)}{typeof stats?.reviewsCount === 'number' ? ` (${stats.reviewsCount})` : ''}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.keys(languages).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(languages).map(([lang, level]: any) => (
                    <Badge key={lang} variant="outline">{lang}: {String(level)}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {education.map((ed, idx) => (
                  <div key={idx} className="p-3 border rounded">
                    <div className="text-sm font-medium">{ed.degree || ed.title || 'Education'}</div>
                    {ed.institution && (
                      <div className="text-xs text-muted-foreground">{ed.institution}</div>
                    )}
                    {(ed.startYear || ed.endYear) && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ed.startYear || ''}{(ed.startYear || ed.endYear) ? ' - ' : ''}{ed.endYear || 'Present'}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {certifications.map((c, idx) => (
                  <div key={idx} className="p-3 border rounded">
                    <div className="text-sm font-medium">{c.name || c.title || 'Certification'}</div>
                    {c.issuer && (
                      <div className="text-xs text-muted-foreground">{c.issuer}</div>
                    )}
                    {c.year && (
                      <div className="text-xs text-muted-foreground mt-0.5">{c.year}</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfilePage;
