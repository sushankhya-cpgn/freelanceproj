import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Step {
  title: string;
  description: string;
}

const steps: Step[] = [
  { title: "Create Your Profile", description: "Set up your professional profile and showcase your skills and experience." },
  { title: "Find Work You Love", description: "Browse thousands of projects and apply to the ones that match your expertise." },
  { title: "Get Paid Securely", description: "Complete the work and receive secure payments through our platform." }
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="howitworks" className="max-w-5xl mx-auto py-20 px-6 text-center">
      <h3 className="text-2xl font-semibold mb-10">How It Works</h3>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-4">0{i + 1}</div>
              <h4 className="font-semibold mb-2">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
