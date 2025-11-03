import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DollarSign, User } from "lucide-react";
import { type ProfileData } from "../../../type/job/profiledata";

interface PersonalTabProps {
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoUrl?: string;
}

export default function PersonalTab({ profileData, setProfileData, onPhotoUpload, photoUrl }: PersonalTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>Update your personal details and contact information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Upload */}
        <div className="space-y-2">
          <Label htmlFor="photo">Profile Photo</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photoUrl || "/placeholder.svg"} />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <Input id="photo" type="file" accept="image/*" onChange={onPhotoUpload} className="max-w-xs" />
              <p className="text-sm text-muted-foreground mt-1">JPG, PNG, or GIF. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Name & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={profileData.location}
              onChange={(e) => setProfileData({ ...profileData, location: e.target.value })} />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Professional Bio</Label>
          <Textarea
            id="bio"
            rows={5}
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            placeholder="Tell clients about your experience, skills, and what makes you unique..."
          />
        </div>

        {/* Hourly Rate & Availability */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="hourlyRate"
                type="number"
                className="pl-9"
                value={profileData.hourlyRate}
                onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability Status</Label>
            <Select
              value={profileData.availability}
              onValueChange={(value) => setProfileData({ ...profileData, availability: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="unavailable">Not Taking Work</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
