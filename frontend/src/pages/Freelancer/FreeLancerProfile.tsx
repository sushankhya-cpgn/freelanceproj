import { useEffect, useState } from "react";
import axiosInstance from "@/api/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/layout/Header";
import ProfileHeader from "@/components/freelancer/profile/ProfileHeader";
import PersonalTab from "@/components/freelancer/profile/PersonalTab";
import SkillsTab from "@/components/freelancer/profile/SkillTab";
import PortfolioTab from "@/components/freelancer/profile/PortfolioTab";
import { ExperienceTab } from "@/components/freelancer/profile/ExperienceTab";
import { type PortfolioItem, type ProfileData, type Transaction, type VerificationStatus } from "@/type/job/profiledata";
import { EarningsTab } from "@/components/freelancer/profile/EarningTab";
import { VerificationTab } from "@/components/freelancer/profile/VerificationTab";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";
// import { useToast } from "@/hooks/use-toast";

export default function FreelancerProfile() {
    //   const { toast } = useToast();


    const [activeTab, setActiveTab] = useState("personal");
    const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [totalReviews, setTotalReviews] = useState<number>(0);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
        emailVerified: true,
        phoneVerified: false,
        kycCompleted: false,
        paymentMethodAdded: false,
        email: "john.doe@example.com",
    });
    const [profileData, setProfileData] = useState<ProfileData>({
        name: "",
        bio: "",
        location: "",
        hourlyRate: "",
        availability: "available",
        skills: [],
        experience: [],
        certifications: [],
        portfolioItems: []
    });



    useEffect(() => {
        const loadProfileData = async () => {
            setLoading(true);
            try {
                console.log('🔄 Loading profile data...');
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Please log in to view your profile");
                    return;
                }

                const response = await axiosInstance.get("/auth/me", { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                
                const user = response.data?.user;
                console.log('👤 Loaded user data:', user);
                
                if (user) {
                    const apiBase = axiosInstance.defaults.baseURL || "";
                    const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
                    
                    // Set rating data
                    setAverageRating(typeof user.averageRating === 'number' ? user.averageRating : 0);
                    setTotalReviews(typeof user.totalReviews === 'number' ? user.totalReviews : 0);
                    
                    setProfileData((prev) => ({
                        ...prev,
                        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || prev.name,
                        bio: user.bio || prev.bio,
                        location: user.location || user.country || prev.location, // fallback to country
                        hourlyRate: (user.hourlyRate != null ? String(user.hourlyRate) : prev.hourlyRate),
                        availability: user.availability || prev.availability,
                        skills: Array.isArray(user.skills) ? user.skills : prev.skills,
                        experience: Array.isArray(user.experiences) ? user.experiences : prev.experience,
                        portfolioItems: Array.isArray(user.portfolioItems)
                          ? user.portfolioItems.map((item: any) => ({
                              ...item,
                              url: typeof item.url === 'string' && item.url.startsWith('/') ? 
                                   `${serverOrigin}${item.url}` : item.url,
                            }))
                          : prev.portfolioItems,
                    }));
                    
                    // Set profile image if available
                    if (user.profileImage) {
                        setPhotoUrl(`${serverOrigin}${user.profileImage}`);
                    }
                    
                    console.log('✅ Profile data loaded successfully');
                }
            } catch (error: any) {
                console.error('❌ Failed to load profile data:', error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        
        loadProfileData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            console.log('💾 Saving profile data:', profileData);
            
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please log in to save your profile");
                return;
            }

            // Prepare the data to send
            const [firstName, ...rest] = (profileData.name || "").trim().split(" ");
            const lastName = rest.join(" ");
            
            const updateData = {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                bio: profileData.bio || undefined,
                location: profileData.location || undefined,
                hourlyRate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : undefined,
                availability: profileData.availability || undefined,
            };

            console.log('📤 Sending update data:', updateData);

            const response = await axiosInstance.put(
                "/auth/profile",
                updateData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Profile update response:', response.data);
            
            // Update local state with server response
            const updatedUser = response.data?.user;
            if (updatedUser) {
                setProfileData(prev => ({
                    ...prev,
                    name: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || prev.name,
                    bio: updatedUser.bio || prev.bio,
                    location: updatedUser.location || prev.location,
                    hourlyRate: updatedUser.hourlyRate != null ? String(updatedUser.hourlyRate) : prev.hourlyRate,
                    availability: updatedUser.availability || prev.availability,
                }));
            }

            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error('❌ Profile update error:', error);
            toast.error(error.response?.data?.error || "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optimistic preview
        const localUrl = URL.createObjectURL(file);
        setPhotoUrl(localUrl);

        try {
            const formData = new FormData();
            formData.append("profileImage", file);

            const token = localStorage.getItem("token");
            const response = await axiosInstance.put("/auth/profile", formData, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    // Override default JSON content-type for multipart upload
                    "Content-Type": "multipart/form-data",
                },
            });

            const updatedUser = response.data?.user;
            if (updatedUser?.profileImage) {
                const apiBase = axiosInstance.defaults.baseURL || "";
                // Remove trailing /api if present to get server origin
                const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
                setPhotoUrl(`${serverOrigin}${updatedUser.profileImage}`);
            }
        } catch (err) {
            console.error("Failed to upload profile image", err);
            // Revert optimistic preview on error if desired
        }
    };

    const transactions: Transaction[] = [
        { id: 1, title: "Website Redesign Project", date: "Jan 15, 2024", amount: 1500 },
        { id: 2, title: "Mobile App Design", date: "Jan 10, 2024", amount: 750 },
        { id: 3, title: "Bug Fixing", date: "Jan 5, 2024", amount: 300 },
    ];

    const addSkill = async (skill: string) => {
        if (!skill || profileData.skills.includes(skill)) {
            toast.error("Skill already exists or is empty");
            return;
        }
        
        const newSkills = [...profileData.skills, skill];
        
        // Optimistic update
        setProfileData({ ...profileData, skills: newSkills });
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please log in to update skills");
                return;
            }
            
            console.log('➕ Adding skill:', skill);
            await axiosInstance.put(
                "/auth/profile/skills",
                { skills: newSkills },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Skill added successfully');
            toast.success(`Added skill: ${skill}`);
        } catch (error: any) {
            console.error('❌ Failed to add skill:', error);
            // Revert optimistic update
            setProfileData({ ...profileData, skills: profileData.skills });
            toast.error("Failed to add skill. Please try again.");
        }
    };

    const removeSkill = async (skill: string) => {
        const newSkills = profileData.skills.filter(s => s !== skill);
        
        // Optimistic update
        setProfileData({ ...profileData, skills: newSkills });
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please log in to update skills");
                return;
            }
            
            console.log('➖ Removing skill:', skill);
            await axiosInstance.put(
                "/auth/profile/skills",
                { skills: newSkills },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Skill removed successfully');
            toast.success(`Removed skill: ${skill}`);
        } catch (error: any) {
            console.error('❌ Failed to remove skill:', error);
            // Revert optimistic update
            setProfileData({ ...profileData, skills: [...profileData.skills, skill] });
            toast.error("Failed to remove skill. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-muted-foreground">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header navItems={FREELANCER_NAV_ITEMS} showLogout />
            {/* Header */}

            <ProfileHeader 
                profileData={profileData} 
                onSave={handleSave} 
                photoUrl={photoUrl}
                saving={saving}
                averageRating={averageRating}
                totalReviews={totalReviews}
            />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6 mb-8">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="skills">Skills</TabsTrigger>
                        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                        <TabsTrigger value="experience">Experience</TabsTrigger>
                        <TabsTrigger value="earnings">Earnings</TabsTrigger>
                        <TabsTrigger value="verification">Verification</TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal">
                        <PersonalTab
                            profileData={profileData}
                            setProfileData={setProfileData}
                            onPhotoUpload={handlePhotoUpload}
                            photoUrl={photoUrl}
                        />
                    </TabsContent>

                    {/* Skills Tab */}
                    <TabsContent value="skills">
                        <SkillsTab
                            profileData={profileData}
                            addSkill={addSkill}
                            removeSkill={removeSkill}
                        />
                    </TabsContent>

                    {/* Portfolio Tab */}
                    <TabsContent value="portfolio">
                        <PortfolioTab
                            portfolioItems={profileData.portfolioItems}
                            setPortfolioItems={async (items) => {
                                setProfileData((prev) => ({ ...prev, portfolioItems: items }));
                                try {
                                    const token = localStorage.getItem("token");
                                    const apiBase = axiosInstance.defaults.baseURL || "";
                                    const serverOrigin = apiBase.replace(/\/?api\/?$/, "");
                                    const normalized = items.map((it: any) => ({
                                        ...it,
                                        url: typeof it.url === 'string' && it.url.startsWith(serverOrigin)
                                          ? it.url.slice(serverOrigin.length)
                                          : it.url,
                                    }));
                                    await axiosInstance.put(
                                        "/auth/profile/portfolio",
                                        { portfolioItems: normalized },
                                        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                                    );
                                } catch (e) { console.error(e); }
                            }}
                        />
                    </TabsContent>


                    {/* Experience Tab */}
                    <TabsContent value="experience">
                        <ExperienceTab
                            experiences={profileData.experience}
                            setExperiences={async (items) => {
                                setProfileData((prev) => ({ ...prev, experience: items }));
                                try {
                                    const token = localStorage.getItem("token");
                                    await axiosInstance.put(
                                        "/auth/profile/experiences",
                                        { experiences: items },
                                        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                                    );
                                } catch (e) { console.error(e); }
                            }}
                        />
                    </TabsContent>

                    {/* Earnings Tab */}
                    <TabsContent value="earnings">
                        <EarningsTab
                            totalEarnings={45230}
                            monthlyEarnings={3450}
                            pendingEarnings={1200}
                            transactions={transactions}
                        />
                    </TabsContent>

                    {/* Verification Tab */}
                    <TabsContent value="verification">
                        <VerificationTab
                            status={verificationStatus}
                            setStatus={setVerificationStatus}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}