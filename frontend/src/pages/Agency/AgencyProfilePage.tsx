import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AGENCY_NAV_ITEMS } from "@/constants/navigation";

export default function AgencyProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agencyData, setAgencyData] = useState({
    agencyName: "",
    description: "",
    website: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    teamSize: "",
    yearsInBusiness: "",
  });

  useEffect(() => {
    fetchAgencyProfile();
  }, []);

  const fetchAgencyProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/agencies/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const agency = response.data.agency;
      setAgencyData({
        agencyName: agency.agencyName || "",
        description: agency.description || "",
        website: agency.website || "",
        phone: agency.phone || "",
        address: agency.address || "",
        city: agency.city || "",
        country: agency.country || "",
        teamSize: agency.teamSize?.toString() || "",
        yearsInBusiness: agency.yearsInBusiness?.toString() || "",
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Agency profile doesn't exist yet
        toast.info("Please complete your agency profile");
      } else {
        toast.error("Failed to load agency profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAgencyData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...agencyData,
        teamSize: agencyData.teamSize ? parseInt(agencyData.teamSize) : undefined,
        yearsInBusiness: agencyData.yearsInBusiness ? parseInt(agencyData.yearsInBusiness) : undefined,
      };

      // Try to update first, if that fails, create
      try {
        await axiosInstance.put("/agencies/profile", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Agency profile updated successfully!");
      } catch (updateErr: any) {
        if (updateErr.response?.status === 404) {
          // Profile doesn't exist, create it
          await axiosInstance.post("/agencies", payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Agency profile created successfully!");
        } else {
          throw updateErr;
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save agency profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header navItems={AGENCY_NAV_ITEMS} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={AGENCY_NAV_ITEMS} />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Agency Profile</h1>
          <p className="text-muted-foreground">
            Manage your agency information and details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  value={agencyData.agencyName}
                  onChange={handleChange}
                  placeholder="Enter your agency name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={agencyData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your agency..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={agencyData.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={agencyData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={agencyData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={agencyData.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={agencyData.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    name="teamSize"
                    type="number"
                    min="1"
                    value={agencyData.teamSize}
                    onChange={handleChange}
                    placeholder="Number of team members"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Input
                    id="yearsInBusiness"
                    name="yearsInBusiness"
                    type="number"
                    min="0"
                    value={agencyData.yearsInBusiness}
                    onChange={handleChange}
                    placeholder="Years"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
