import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import axiosInstance from "@/api/axios";

interface JobPostFormProps {
  open: boolean;
  onClose: () => void;
}

export function JobPostForm({ open, onClose }: JobPostFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed");
  const [budget, setBudget] = useState<number | "">("");
  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [projectDuration, setProjectDuration] = useState("1-3months");
  const [timezone, setTimezone] = useState("EST");
  const [status, setStatus] = useState("active");
  const [connectRequired, setConnectRequired] = useState<number | "">("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    const jobData = {
      title,
      description,
      budget,
      budgetType,
      minBudget,
      maxBudget,
      skills,
      experienceLevel,
      projectDuration,
      timezone,
      status,
      connectRequired,
      isFeatured,
      isUrgent,
    };
     try {
    const token = localStorage.getItem("token");
    const response = await axiosInstance.post("/jobs", jobData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("✅ Job posted:", response.data);
    onClose();
  } catch (error) {
    console.error("❌ Failed to post job:", error);
  }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] h-[92vh] !max-w-[90vw] max-h-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="e.g. React Developer Needed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <div className="border rounded">
              <CKEditor
                editor={ClassicEditor as any}
                data={description}
                onReady={(editor: any) => {
                  const el = editor?.ui?.view?.editable?.element as HTMLElement | undefined;
                  if (el) el.style.minHeight = '360px';
                }}
                onChange={(_, editor) => {
                  const data = editor.getData();
                  setDescription(data);
                }}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetType">Budget Type</Label>
              <Select value={budgetType} onValueChange={(v) => setBudgetType(v as any)}>
                <SelectTrigger id="budgetType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget Amount ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="2500"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Min/Max Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minBudget">Minimum Budget</Label>
              <Input
                id="minBudget"
                type="number"
                placeholder="1000"
                value={minBudget}
                onChange={(e) => setMinBudget(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBudget">Maximum Budget</Label>
              <Input
                id="maxBudget"
                type="number"
                placeholder="5000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label htmlFor="experienceLevel">Experience Level</Label>
            <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v)}>
              <SelectTrigger id="experienceLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Duration */}
          <div className="space-y-2">
            <Label htmlFor="projectDuration">Project Duration</Label>
            <Select value={projectDuration} onValueChange={(v) => setProjectDuration(v)}>
              <SelectTrigger id="projectDuration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="less1month">Less than 1 month</SelectItem>
                <SelectItem value="1-3months">1-3 months</SelectItem>
                <SelectItem value="3-6months">3-6 months</SelectItem>
                <SelectItem value="6months+">More than 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              placeholder="EST"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </div>

          {/* Connect Required */}
          <div className="space-y-2">
            <Label htmlFor="connectRequired">Connects Required</Label>
            <Input
              id="connectRequired"
              type="number"
              placeholder="3"
              value={connectRequired}
              onChange={(e) => setConnectRequired(Number(e.target.value))}
              required
            />
          </div>

          {/* Featured & Urgent */}
          <div className="flex gap-4 items-center">
            <Checkbox
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(!!checked)}
              id="isFeatured"
            />
            <Label htmlFor="isFeatured">Featured Job</Label>

            <Checkbox
              checked={isUrgent}
              onCheckedChange={(checked) => setIsUrgent(!!checked)}
              id="isUrgent"
            />
            <Label htmlFor="isUrgent">Urgent Job</Label>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Job Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills</Label>
            <div className="flex gap-2">
              <Input
                id="skills"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Type a skill and press Enter"
              />
              <Button type="button" onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Post Job</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
