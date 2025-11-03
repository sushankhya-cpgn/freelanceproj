import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ExperienceTabProps {
  experiences: Experience[];
  setExperiences: (items: Experience[]) => void;
}

export const ExperienceTab: React.FC<ExperienceTabProps> = ({
  experiences,
  setExperiences,
}) => {
  const [newExperience, setNewExperience] = useState<Experience>({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const handleAdd = () => {
    if (!newExperience.title.trim() || !newExperience.company.trim()) return;
    setExperiences([...experiences, newExperience]);
    setNewExperience({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    });
  };

  const handleRemove = (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    setExperiences(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h3 className="text-lg font-semibold">Add Experience</h3>
          <Input
            placeholder="Job Title"
            value={newExperience.title}
            onChange={(e) =>
              setNewExperience({ ...newExperience, title: e.target.value })
            }
          />
          <Input
            placeholder="Company"
            value={newExperience.company}
            onChange={(e) =>
              setNewExperience({ ...newExperience, company: e.target.value })
            }
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={newExperience.startDate}
              onChange={(e) =>
                setNewExperience({ ...newExperience, startDate: e.target.value })
              }
            />
            <Input
              type="date"
              value={newExperience.endDate}
              onChange={(e) =>
                setNewExperience({ ...newExperience, endDate: e.target.value })
              }
            />
          </div>
          <Textarea
            placeholder="Description"
            value={newExperience.description}
            onChange={(e) =>
              setNewExperience({ ...newExperience, description: e.target.value })
            }
          />
          <Button onClick={handleAdd}>Add Experience</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {experiences.length === 0 && (
          <p className="text-muted-foreground">No experiences added yet.</p>
        )}

        {experiences.map((exp, index) => (
          <Card key={index}>
            <CardContent className="flex justify-between items-start p-4">
              <div>
                <h4 className="font-semibold">{exp.title}</h4>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
                <p className="text-sm">
                  {exp.startDate} - {exp.endDate || "Present"}
                </p>
                {exp.description && (
                  <p className="text-sm mt-2">{exp.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
