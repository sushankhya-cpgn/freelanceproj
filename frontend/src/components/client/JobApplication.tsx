import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Clock, FileText, MessageSquare, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const mockApplications = [
  {
    id: 1,
    freelancer: {
      name: "Anita Sharma",
      title: "UI/UX Designer",
      rating: 4.9,
      reviews: 127,
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita",
      location: "India",
    },
    bid: 4500,
    duration: "4 weeks",
    coverLetter: "I'm excited about this project! With 8+ years of experience in UI/UX design, I've delivered similar e-commerce platforms. I specialize in creating user-centered designs that convert. My portfolio includes work with major brands...",
    proposedApproach: "I'll start with user research and competitor analysis, then create wireframes and high-fidelity mockups using Figma. We'll iterate based on your feedback...",
    appliedAt: "2 hours ago",
  },
  {
    id: 2,
    freelancer: {
      name: "Ramesh Karki",
      title: "Full Stack Developer",
      rating: 5.0,
      reviews: 89,
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh",
      location: "Nepal",
    },
    bid: 5200,
    duration: "6 weeks",
    coverLetter: "Hello! I'm a senior full-stack developer with expertise in React and Node.js. I've built 15+ e-commerce platforms and can deliver a robust, scalable solution...",
    proposedApproach: "I'll use React with TypeScript for the frontend, Node.js with Express for the API, and MongoDB for the database. I'll implement payment integration and admin dashboard...",
    appliedAt: "5 hours ago",
  },
];

interface JobApplicationsProps {
  job: any;
  onMessage: (freelancer: any) => void;
  onSendContract: (freelancer: any) => void;
}

export function JobApplications({ job, onMessage, onSendContract }: JobApplicationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications for: {job.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockApplications.map((application, index) => (
          <div key={application.id}>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={application.freelancer.img} />
                  <AvatarFallback>{application.freelancer.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{application.freelancer.name}</h4>
                      <p className="text-sm text-muted-foreground">{application.freelancer.title}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${application.bid}</div>
                      <p className="text-sm text-muted-foreground">in {application.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{application.freelancer.rating}</span>
                      <span className="text-muted-foreground">({application.freelancer.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {application.freelancer.location}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Applied {application.appliedAt}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Cover Letter</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{application.coverLetter}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Proposed Approach</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{application.proposedApproach}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onMessage(application.freelancer)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => onSendContract(application.freelancer)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Contract
                </Button>
              </div>
            </div>

            {index < mockApplications.length - 1 && <Separator className="my-6" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
