import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import { useNotifications } from "@/context/NotificationContext";
import { toast } from "sonner";
import { Loader2, FileText, DollarSign, Calendar } from "lucide-react";
import { CLIENT_NAV_ITEMS } from "@/constants/navigation";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CreateContractPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  
  const jobId = searchParams.get("jobId");
  const freelancerId = searchParams.get("freelancerId");
  const applicationId = searchParams.get("applicationId");

  const [loading, setLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [freelancerDetails, setFreelancerDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    paymentType: "fixed",
    startDate: "",
    endDate: "",
    milestonesHtml: "",
    termsHtml: "",
    deliverablesHtml: "",
  });

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch job details
      if (jobId) {
        const jobResponse = await axiosInstance.get(`/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJobDetails(jobResponse.data.job);
        setFormData(prev => ({
          ...prev,
          title: `Contract for: ${jobResponse.data.job.title}`,
          description: jobResponse.data.job.description,
          amount: jobResponse.data.job.budget?.toString() || "",
        }));
      }

      // Fetch freelancer details
      if (freelancerId) {
        const userResponse = await axiosInstance.get(`/users/${freelancerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFreelancerDetails(userResponse.data.user);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
      toast.error("Failed to load details");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const htmlToPlain = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  const extractListItems = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html || '', 'text/html');
      const items = Array.from(doc.querySelectorAll('li')).map(li => li.textContent?.trim()).filter(Boolean) as string[];
      if (items.length > 0) return items;
      const text = (doc.body.textContent || '').split(/\n|\r/).map(s => s.trim()).filter(Boolean);
      return text;
    } catch {
      const text = htmlToPlain(html).split(/\n|\r/).map(s => s.trim()).filter(Boolean);
      return text;
    }
  };

  const parseMilestones = (html: string) => {
    // Try to parse as JSON objects from plain text
    const text = htmlToPlain(html).trim();
    if (!text) return [] as any[];
    try {
      // accept single object or comma-separated objects without surrounding []
      const payload = text.startsWith('[') ? text : `[${text}]`;
      const arr = JSON.parse(payload);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [] as any[];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!freelancerId || freelancerId === "0") {
      toast.error("No freelancer selected. Please select a freelancer first.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const contractData = {
        freelancerId: parseInt(freelancerId),
        jobApplicationId: applicationId ? parseInt(applicationId) : undefined,
        workTitle: formData.title, // ✅ Changed from 'title' to 'workTitle'
        workDescription: formData.description, // ✅ Changed from 'description' to 'workDescription'
        totalAmount: formData.paymentType === 'fixed' ? parseFloat(formData.amount) : undefined, // ✅ Add totalAmount
        hourlyRate: formData.paymentType === 'hourly' ? parseFloat(formData.amount) : undefined, // ✅ Add hourlyRate
        paymentSchedule: formData.paymentType, // ✅ Changed from 'paymentType' to 'paymentSchedule'
        contractStartDate: formData.startDate, // ✅ Changed from 'startDate' to 'contractStartDate'
        contractEndDate: formData.endDate || undefined, // ✅ Changed from 'endDate' to 'contractEndDate'
        milestones: parseMilestones(formData.milestonesHtml),
        terms: formData.termsHtml, // store rich text
        deliverables: extractListItems(formData.deliverablesHtml),
        status: "pending",
      };

      console.log('📤 Sending contract data:', contractData);

      const response = await axiosInstance.post("/contracts", contractData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Contract sent successfully!");
      
      // Add notification
      addNotification({
        type: 'success',
        title: 'Contract Sent!',
        message: `You've sent a contract to ${freelancerDetails?.firstName} ${freelancerDetails?.lastName}. They will be notified to review and accept it.`,
        action: {
          label: 'View Applications',
          onClick: () => navigate(`/job-applications/${jobId}`)
        }
      });
      
      navigate(`/job-applications/${jobId}`);
    } catch (err: any) {
      console.error("Error creating contract:", err);
      console.error("Validation errors:", err.response?.data?.errors);
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Contract Failed',
        message: err.response?.data?.error || 'Failed to send contract. Please try again.'
      });
      
      // Show specific validation errors if available
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((error: any) => {
          toast.error(`${error.path}: ${error.msg}`);
        });
      } else {
        toast.error(err.response?.data?.error || "Failed to create contract");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header navItems={CLIENT_NAV_ITEMS} showLogout />

      <main className="max-w-4xl mx-auto py-8 px-6">
        {!freelancerId && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ No freelancer selected. Please go back and select a freelancer first.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="mt-2"
            >
              Go Back
            </Button>
          </div>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Create Contract
            </CardTitle>
            {freelancerDetails && (
              <p className="text-muted-foreground">
                Sending contract to: {freelancerDetails.firstName} {freelancerDetails.lastName}
              </p>
            )}
            {!freelancerDetails && freelancerId && (
              <p className="text-muted-foreground">
                Loading freelancer details...
              </p>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contract Title */}
              <div>
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Website Development Contract"
                  required
                />
              </div>

              {/* Description (optional: keep textarea or upgrade later) */}
              <div>
                <Label htmlFor="description">Project Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the project scope and requirements..."
                />
              </div>

              {/* Amount & Payment Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Amount *
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="5000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="milestone">Milestone Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Start & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Deliverables (CKEditor) */}
              <div>
                <Label htmlFor="deliverables">Deliverables (one per line)</Label>
                <div className="border rounded">
                  <CKEditor
                    editor={ClassicEditor as any}
                    data={formData.deliverablesHtml}
                    onReady={(editor: any) => {
                      const el = editor?.ui?.view?.editable?.element as HTMLElement | undefined;
                      if (el) el.style.minHeight = '200px';
                    }}
                    onChange={(_, editor) => {
                      const data = editor.getData();
                      setFormData(prev => ({ ...prev, deliverablesHtml: data }));
                    }}
                  />
                </div>
              </div>

              {/* Milestones (CKEditor) */}
              <div>
                <Label>Milestones (paste JSON objects or type text)</Label>
                <div className="border rounded">
                  <CKEditor
                    editor={ClassicEditor as any}
                    data={formData.milestonesHtml}
                    onReady={(editor: any) => {
                      const el = editor?.ui?.view?.editable?.element as HTMLElement | undefined;
                      if (el) el.style.minHeight = '160px';
                    }}
                    onChange={(_, editor) => {
                      const data = editor.getData();
                      setFormData(prev => ({ ...prev, milestonesHtml: data }));
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tip: paste comma-separated JSON objects like {`{"name":"Phase 1","amount":2000,"dueDate":"2025-02-01"}`}</p>
              </div>

              {/* Terms & Conditions (CKEditor) */}
              <div>
                <Label>Terms & Conditions</Label>
                <div className="border rounded">
                  <CKEditor
                    editor={ClassicEditor as any}
                    data={formData.termsHtml}
                    onReady={(editor: any) => {
                      const el = editor?.ui?.view?.editable?.element as HTMLElement | undefined;
                      if (el) el.style.minHeight = '220px';
                    }}
                    onChange={(_, editor) => {
                      const data = editor.getData();
                      setFormData(prev => ({ ...prev, termsHtml: data }));
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Contract"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateContractPage;

