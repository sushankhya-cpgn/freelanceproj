// SkillsTab.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Briefcase} from "lucide-react";
import { type ProfileData } from "../../../type/job/profiledata";

interface SkillsTabProps {
  profileData: ProfileData;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
}

export default function SkillsTab({ profileData, addSkill, removeSkill }: SkillsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> Skills & Categories
        </CardTitle>
        <CardDescription>Add your skills and areas of expertise</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Skill Section */}
        <div className="space-y-2">
          <Label>Add Skills</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., React, Python, SEO..."
              id="newSkill"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const input = e.target as HTMLInputElement;
                  addSkill(input.value);
                  input.value = "";
                }
              }}
            />
            <Button
              onClick={() => {
                const input = document.getElementById("newSkill") as HTMLInputElement;
                addSkill(input.value);
                input.value = "";
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Skills List */}
        <div className="space-y-2">
          <Label>Your Skills</Label>
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1">
                {skill}
                <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
