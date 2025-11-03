import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { VerificationStatus } from "@/type/job/profiledata";


interface VerificationTabProps {
  status: VerificationStatus;
  setStatus: (status: VerificationStatus) => void;
}

export const VerificationTab: React.FC<VerificationTabProps> = ({ status, setStatus }) => {
  // Handle email verification
  const handleVerifyEmail = () => {
    alert("Email is already verified"); // or remove if already verified
  };

  // Handle phone verification
  const handleVerifyPhone = () => {
    const phone = window.prompt("Enter your phone number to verify:");
    if (phone) {
      setStatus({ ...status, phoneVerified: true, phone });
      alert("Phone number verified successfully!");
    }
  };

  // Handle KYC verification
  const handleStartKYC = () => {
    const kycFile = window.prompt("Enter KYC document name to upload (simulated):");
    if (kycFile) {
      setStatus({ ...status, kycCompleted: true, kycDocument: kycFile });
      alert("KYC completed successfully!");
    }
  };

  // Handle Payment Method addition
  const handleAddPaymentMethod = () => {
    const payment = window.prompt("Enter payment method (simulated):");
    if (payment) {
      setStatus({ ...status, paymentMethodAdded: true, paymentMethod: payment });
      alert("Payment method added successfully!");
    }
  };

  // Calculate progress
  const stepsCompleted = [
    status.emailVerified,
    status.phoneVerified,
    status.kycCompleted,
    status.paymentMethodAdded,
  ].filter(Boolean).length;

  const progress = (stepsCompleted / 4) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to build trust with clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${status.emailVerified ? "text-green-500" : "text-muted-foreground"}`}
              />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">{status.email || "Not verified"}</p>
              </div>
            </div>
            {status.emailVerified ? (
              <Badge>Verified</Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={handleVerifyEmail}>
                Verify
              </Button>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${status.phoneVerified ? "text-green-500" : "text-muted-foreground"}`}
              />
              <div>
                <p className="font-semibold">Phone Number</p>
                <p className="text-sm text-muted-foreground">
                  {status.phoneVerified ? status.phone : "Not verified"}
                </p>
              </div>
            </div>
            {!status.phoneVerified && (
              <Button variant="outline" size="sm" onClick={handleVerifyPhone}>
                Verify
              </Button>
            )}
          </div>

          {/* Identity / KYC */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${status.kycCompleted ? "text-green-500" : "text-muted-foreground"}`}
              />
              <div>
                <p className="font-semibold">Identity Verification (KYC)</p>
                <p className="text-sm text-muted-foreground">
                  {status.kycCompleted ? status.kycDocument : "Upload government-issued ID"}
                </p>
              </div>
            </div>
            {!status.kycCompleted && (
              <Button variant="outline" size="sm" onClick={handleStartKYC}>
                Start KYC
              </Button>
            )}
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${status.paymentMethodAdded ? "text-green-500" : "text-muted-foreground"}`}
              />
              <div>
                <p className="font-semibold">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  {status.paymentMethodAdded ? status.paymentMethod : "Add a payment method to receive earnings"}
                </p>
              </div>
            </div>
            {!status.paymentMethodAdded && (
              <Button variant="outline" size="sm" onClick={handleAddPaymentMethod}>
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Verification Progress */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification Progress
          </h4>
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {stepsCompleted} of 4 steps completed
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
