import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/api/axios";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { Plus, X, Upload, User } from "lucide-react";
import OTPVerification from "@/components/OTPVerification";

interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface PaymentOption {
  id: string;
  type: string;
  rate?: string;
}

interface FormData {
  // Basic info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: "freelancer" | "client" | "agency";
  
  // Additional fields
  country: string;
  bio: string;
  profileImage: File | null;
  
  // Freelancer specific
  experiences: Experience[];
  paymentOptions: PaymentOption[];
  
  // Client specific
  companyName: string;
  companyWebsite: string;
}

const countries = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Australia",
  "India", "Japan", "South Korea", "Brazil", "Mexico", "Spain", "Italy",
  "Netherlands", "Sweden", "Norway", "Denmark", "Finland", "Switzerland",
  "Austria", "Belgium", "Ireland", "Portugal", "Poland", "Czech Republic",
  "Hungary", "Romania", "Bulgaria", "Croatia", "Slovenia", "Slovakia",
  "Estonia", "Latvia", "Lithuania", "Greece", "Cyprus", "Malta", "Luxembourg"
];

const paymentTypes = [
  "Hourly Rate",
  "Fixed Price",
  "Project-based",
  "Retainer",
  "Milestone-based"
];

export const EnhancedRegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "freelancer",
    country: "",
    bio: "",
    profileImage: null,
    experiences: [],
    paymentOptions: [],
    companyName: "",
    companyWebsite: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthConfig, setOauthConfig] = useState({ googleEnabled: false, facebookEnabled: false, appleEnabled: false });
  const [showOTP, setShowOTP] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  // Fetch OAuth configuration on mount (must be before any conditional return to preserve hooks order)
  React.useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/auth/oauth-urls');
        const cfg = res.data?.data?.configured;
        if (cfg) {
          setOauthConfig({
            googleEnabled: !!cfg.google,
            facebookEnabled: !!cfg.facebook,
            appleEnabled: !!cfg.apple,
          });
        }
      } catch {}
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setFieldErrors(prev => ({ ...prev, [id]: "" }));
  };

  const handleUserTypeChange = (value: "freelancer" | "client" | "agency") => {
    setFormData(prev => ({ ...prev, userType: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
    }
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      title: "",
      company: "",
      duration: "",
      description: "",
    };
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, newExperience]
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id)
    }));
  };

  const addPaymentOption = () => {
    const newPayment: PaymentOption = {
      id: Date.now().toString(),
      type: "",
      rate: "",
    };
    setFormData(prev => ({
      ...prev,
      paymentOptions: [...prev.paymentOptions, newPayment]
    }));
  };

  const updatePaymentOption = (id: string, field: keyof PaymentOption, value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentOptions: prev.paymentOptions.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    }));
  };

  const removePaymentOption = (id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentOptions: prev.paymentOptions.filter(payment => payment.id !== id)
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = "First name is required";
      if (!formData.lastName.trim()) errors.lastName = "Last name is required";
      if (!formData.email.trim()) errors.email = "Email is required";
      if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    }

    if (step === 2) {
      if (!formData.country) errors.country = "Country is required";
      if (formData.userType === "client") {
        if (!formData.companyName.trim()) errors.companyName = "Company name is required";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setFieldErrors({});

    try {
      const submitData = new FormData();
      
      // Basic fields
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('userType', formData.userType);
      submitData.append('country', formData.country);
      submitData.append('bio', formData.bio);
      
      // Profile image
      if (formData.profileImage) {
        submitData.append('profileImage', formData.profileImage);
      }
      
      // User type specific fields
      if (formData.userType === 'freelancer') {
        submitData.append('experiences', JSON.stringify(formData.experiences));
        submitData.append('paymentOptions', JSON.stringify(formData.paymentOptions));
      } else {
        submitData.append('companyName', formData.companyName);
        submitData.append('companyWebsite', formData.companyWebsite);
      }

      const response = await axiosInstance.post('/auth/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.requiresVerification) {
        setRegisteredEmail(response.data.email || formData.email);
        setShowOTP(true);
        return;
      }

      // Fallback: if backend ever returns a token (not expected now)
      const { user, token, sessionId, expiresAt } = response.data;
      const sessionData = { sessionId, expiresAt };
      login(user, token, sessionData);
      if (user.userType === "freelancer") navigate("/freelancerhomepage");
      else if (user.userType === "client") navigate("/clienthomepage");
      else if (user.userType === "agency") navigate("/agencyhomepage");
      else navigate("/");

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Registration failed";
      setFieldErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (showOTP && registeredEmail) {
    return (
      <OTPVerification
        email={registeredEmail}
        type="email"
        onBack={() => setShowOTP(false)}
        onVerificationSuccess={() => {
          // On successful verification, navigate to login for first signin
          navigate('/login');
        }}
      />
    );
  }

  // OAuth handlers
  const handleGoogleLogin = () => {
    setOauthLoading(true);
    const base = axiosInstance.defaults.baseURL || '';
    window.location.href = `${base}/auth/google`;
  };

  const handleFacebookLogin = () => {
    setOauthLoading(true);
    const base = axiosInstance.defaults.baseURL || '';
    window.location.href = `${base}/auth/facebook`;
  };

  const handleAppleLogin = () => {
    setOauthLoading(true);
    const base = axiosInstance.defaults.baseURL || '';
    window.location.href = `${base}/auth/apple`;
  };

  

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Create Your Account</h2>
        <p className="text-gray-600">Step 1 of {totalSteps}: Basic Information</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            required
          />
          {fieldErrors.firstName && (
            <div className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</div>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            required
          />
          {fieldErrors.lastName && (
            <div className="text-red-500 text-sm mt-1">{fieldErrors.lastName}</div>
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="email">Email Address</FieldLabel>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email address"
          required
        />
        {fieldErrors.email && (
          <div className="text-red-500 text-sm mt-1">{fieldErrors.email}</div>
        )}
      </Field>

      <Field>
        <FieldLabel className="text-sm">I am a</FieldLabel>
        <RadioGroup
          defaultValue="freelancer"
          className="flex gap-4"
          onValueChange={handleUserTypeChange}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="freelancer" id="r1" />
            <Label htmlFor="r1" className="text-sm font-normal cursor-pointer">Freelancer</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="client" id="r2" />
            <Label htmlFor="r2" className="text-sm font-normal cursor-pointer">Client</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="agency" id="r3" />
            <Label htmlFor="r3" className="text-sm font-normal cursor-pointer">Agency</Label>
          </div>
        </RadioGroup>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
          />
          {fieldErrors.password && (
            <div className="text-red-500 text-sm mt-1">{fieldErrors.password}</div>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
          />
          {fieldErrors.confirmPassword && (
            <div className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</div>
          )}
        </Field>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Profile Information</h2>
        <p className="text-gray-600">Step 2 of {totalSteps}: Location & Details</p>
      </div>

      <Field>
        <FieldLabel htmlFor="country">Country</FieldLabel>
        <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.country && (
          <div className="text-red-500 text-sm mt-1">{fieldErrors.country}</div>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="bio">Bio (Optional)</FieldLabel>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </Field>

      <Field>
        <FieldLabel>Profile Photo (Optional)</FieldLabel>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {formData.profileImage ? (
              <img
                src={URL.createObjectURL(formData.profileImage)}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </Field>

      {formData.userType === "client" && (
        <>
          <Field>
            <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter your company name"
              required
            />
            {fieldErrors.companyName && (
              <div className="text-red-500 text-sm mt-1">{fieldErrors.companyName}</div>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="companyWebsite">Company Website (Optional)</FieldLabel>
            <Input
              id="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              placeholder="https://yourcompany.com"
            />
          </Field>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Professional Details</h2>
        <p className="text-gray-600">Step 3 of {totalSteps}: Experience & Payment</p>
      </div>

      {formData.userType === "freelancer" && (
        <>
          <div>
            <div className="flex items-center justify-between mb-4">
              <FieldLabel>Work Experience (Optional)</FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExperience}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Experience</span>
              </Button>
            </div>

            {formData.experiences.map((experience, index) => (
              <div key={experience.id} className="border rounded-lg p-4 mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Experience {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(experience.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Job Title"
                    value={experience.title}
                    onChange={(e) => updateExperience(experience.id, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="Company"
                    value={experience.company}
                    onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                  />
                </div>

                <Input
                  placeholder="Duration (e.g., 2020-2023)"
                  value={experience.duration}
                  onChange={(e) => updateExperience(experience.id, 'duration', e.target.value)}
                />

                <Textarea
                  placeholder="Description of your role and achievements"
                  value={experience.description}
                  onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <FieldLabel>Payment Options (Optional)</FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPaymentOption}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment Option</span>
              </Button>
            </div>

            {formData.paymentOptions.map((payment, index) => (
              <div key={payment.id} className="border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Payment Option {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaymentOption(payment.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    value={payment.type}
                    onValueChange={(value) => updatePaymentOption(payment.id, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Rate (e.g., $50/hour, $5000/project)"
                    value={payment.rate || ''}
                    onChange={(e) => updatePaymentOption(payment.id, 'rate', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {formData.userType === "client" && (
        <div className="text-center py-8">
          <p className="text-gray-600">You're all set! Click "Create Account" to complete your registration.</p>
        </div>
      )}

      {formData.userType === "agency" && (
        <div className="text-center py-8">
          <p className="text-gray-600">You're registering as an agency! You'll be able to post jobs and hire freelancers.</p>
          <p className="text-sm text-gray-500 mt-2">Complete your agency profile after registration.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Join WorkLab</CardTitle>
            <CardDescription className="text-center">
              Create your account and start your journey
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* OAuth buttons at top */}
            <div className="mb-6">
              <OAuthButtons
                onGoogleLogin={handleGoogleLogin}
                onFacebookLogin={handleFacebookLogin}
                onAppleLogin={handleAppleLogin}
                loading={oauthLoading}
                disabled={loading}
                googleEnabled={oauthConfig.googleEnabled}
                facebookEnabled={false}
                appleEnabled={false}
              />
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
                <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {fieldErrors.general && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
                  {fieldErrors.general}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-300 bg-green-50 p-3 text-green-700 text-sm">
                  {success}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedRegisterForm;

