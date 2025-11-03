import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Homepage from "./pages/Freelancer/Homepage";
import JobsPage from "./pages/Freelancer/JobsPage";
import LoginPage from "./pages/login";
import LoginWithCode from "./pages/LoginWithCode";
import SignUpPage from "./pages/signup";
import ForgotPassword from "./pages/ForgotPassword";
import JobApplyPage from "./pages/Freelancer/JobApplyPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientHomepage from "./pages/Client/ClientHomepage";
import FreelancerProfilePage from "./pages/Client/FreelancerProfilePage";
import ClientProfilePage from "./pages/Client/ClientProfilePage";
import ClientApplicationsList from "./pages/Client/ClientApplicationsList";
import FreeLancerProfile from "./pages/Freelancer/FreeLancerProfile";
import MessagePage from "./pages/Freelancer/Message";
import ClientMessagePage from "./pages/Client/ClientMessagePage";
import FreelancerSearch from "./pages/Client/Freelancerspage";
import JobApplicationsPage from "./pages/Client/JobApplicationsPage";
import ApplicationsPage from "./pages/Freelancer/ApplicationsPage";
import NotFound from "./pages/NotFound";
import CreateContractPage from "./pages/Client/CreateContractPage";
import ContractsPage from "./pages/Freelancer/ContractsPage";
import ClientContractsPage from "./pages/Client/ClientContractsPage";
import OAuthCallback from "./pages/auth/OAuthCallback";
import LandingPage from "./pages/LandingPage";
import AdminCustomSupport from "./pages/cat/admin-customer-support";
import DesignCreative from "./pages/cat/designcreative";
import SalesMarketing from "./pages/cat/salesandmarketing";
import DevIt from "./pages/cat/dev-it";
import WritingTranslation from "./pages/cat/writing-translation";
import HrTraning from "./pages/cat/hr-training";
import Legal from "./pages/cat/legal";
import EngineeringArchitecture from "./pages/cat/engineering-architecture";
import FinanceAccounting from "./pages/cat/finance-accounting";
import SuccessStories from "./pages/success-stories";
import HowToHire from "./pages/howtohire";
import HowToFindWork from "./pages/howtofindwork";
import Enterprise from "./pages/enterprise/enterprise";
import Reviews from "./pages/reviews";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { RealTimeNotifications } from "./components/notifications/RealTimeNotifications";
import AgencyHomepage from "./pages/Agency/AgencyHomepage";
import AgencyProfilePage from "./pages/Agency/AgencyProfilePage";
import AgencyJobsPage from "./pages/Agency/AgencyJobsPage";
import AgencySearchFreelancersPage from "./pages/Agency/AgencySearchFreelancersPage";
import AgencyFreelancerProfilePage from "./pages/Agency/AgencyFreelancerProfilePage";
import AgencyJobSearchPage from "./pages/Agency/AgencyJobSearchPage";
import AgencyMessagePage from "./pages/Agency/AgencyMessagePage";
import GuestRoute from "./components/GuestRoute";
import AgencyContractsPage from "./pages/Agency/AgencyContractsPage";

function App() {
  const rtEnabled = (import.meta as any).env?.VITE_CENTRIFUGO_ENABLED === 'true';
  return (
    <AuthProvider>
       <NotificationProvider> 
        {rtEnabled && <RealTimeNotifications />} 
        <Routes>

          <Route path="/" element={<LandingPage />} />
          <Route path="/cat/admin-customer-support" element={<AdminCustomSupport />} />
          <Route path="/cat/design-creative" element={<DesignCreative />} />
          <Route path="/cat/sales-marketing" element={<SalesMarketing />} />
          <Route path="/cat/dev-it" element={<DevIt />} />
          <Route path="/cat/writing-translation" element={<WritingTranslation />} />
          <Route path="/cat/hr-training" element={<HrTraning />} />
          <Route path="/cat/legal" element={<Legal />} />
          <Route path="/cat/engineering-architecture" element={<EngineeringArchitecture />} />
          <Route path="/cat/finance-accounting" element={<FinanceAccounting />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/how-to-hire" element={<HowToHire />} />
          <Route path="/how-to-find-work" element={<HowToFindWork />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/login" element={<GuestRoute element={<LoginPage />} />} />
          <Route path="/login/code" element={<GuestRoute element={<LoginWithCode />} />} />
          <Route path="/signup" element={<GuestRoute element={<SignUpPage />} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/messages" element={<MessagePage />} />
          <Route path="/clientmessages" element={<ClientMessagePage />} />
          <Route path="/freelancers" element={<FreelancerSearch onHireFreelancer={() => {}} />} />
          <Route path="/jobs" element={<JobsPage />} /> {/* Public jobs page */}

          {/* Freelancer-only routes */}
          <Route path="/freelancerhomepage" element={<ProtectedRoute element={<Homepage />} allowedRoles={["freelancer"]} />} />
          <Route path="/freelancer/homepage" element={<ProtectedRoute element={<Homepage />} allowedRoles={["freelancer"]} />} />
          <Route path="/freelancer/jobs" element={<ProtectedRoute element={<JobsPage />} allowedRoles={["freelancer"]} />} />
          <Route path="/freelancer/jobs/:id" element={<ProtectedRoute element={<JobApplyPage />} allowedRoles={["freelancer"]} />} />
          <Route path="/freelancer/profile" element={<ProtectedRoute element={<FreeLancerProfile />} allowedRoles={["freelancer"]} />} />
          <Route path="/freelancer/applications" element={<ProtectedRoute element={<ApplicationsPage />} allowedRoles={["freelancer"]} />} />
          <Route path="/freelancer/contracts" element={<ProtectedRoute element={<ContractsPage />} allowedRoles={["freelancer"]} />} />

          <Route
            path="/apply/:jobId"
            element={<ProtectedRoute element={<JobApplyPage />} allowedRoles={["freelancer"]} />}
          />

          <Route path="/freelancerprofile" element={<ProtectedRoute element={<FreeLancerProfile />} allowedRoles={["freelancer"]} />} />
          <Route path="/applications" element={<ProtectedRoute element={<ApplicationsPage />} allowedRoles={["freelancer"]} />} />
          <Route
            path="/contracts"
            element={<ProtectedRoute element={<ContractsPage />} allowedRoles={["freelancer"]} />}
          />

          {/* Client-only routes */}
          <Route
            path="/clienthomepage"
            element={<ProtectedRoute element={<ClientHomepage />} allowedRoles={["client"]} />}
          />
          <Route
            path="/client/applications"
            element={<ProtectedRoute element={<ClientApplicationsList />} allowedRoles={["client"]} />}
          />
          <Route
            path="/clientprofile"
            element={<ProtectedRoute element={<ClientProfilePage />} allowedRoles={["client"]} />}
          />
          <Route
            path="/client/freelancers/:id"
            element={<FreelancerProfilePage />}
          />
          <Route
            path="/job-applications/:jobId"
            element={<ProtectedRoute element={<JobApplicationsPage />} allowedRoles={["client"]} />}
          />
          <Route
            path="/contracts/create"
            element={<ProtectedRoute element={<CreateContractPage />} allowedRoles={["client"]} />}
          />
          <Route
            path="/client-contracts"
            element={<ProtectedRoute element={<ClientContractsPage />} allowedRoles={["client"]} />}
          />
          
          {/* Agency-only routes */}
          <Route
            path="/agencyhomepage"
            element={<ProtectedRoute element={<AgencyHomepage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/profile"
            element={<ProtectedRoute element={<AgencyProfilePage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/my-jobs"
            element={<ProtectedRoute element={<AgencyJobsPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/jobs"
            element={<ProtectedRoute element={<AgencyJobSearchPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/freelancers"
            element={<ProtectedRoute element={<AgencySearchFreelancersPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/freelancers/:id"
            element={<ProtectedRoute element={<AgencyFreelancerProfilePage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/contracts"
            element={<ProtectedRoute element={<AgencyContractsPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/jobs/new"
            element={<ProtectedRoute element={<AgencyJobsPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/jobs/:id"
            element={<ProtectedRoute element={<AgencyJobSearchPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agency/jobs/:id/applications"
            element={<ProtectedRoute element={<AgencyJobsPage />} allowedRoles={["agency"]} />}
          />
          <Route
            path="/agencymessages"
            element={<ProtectedRoute element={<AgencyMessagePage />} allowedRoles={["agency"]} />}
          />
          
           <Route
        path="/jobs"
        element={<ProtectedRoute element={<JobsPage />} allowedRoles={["freelancer"]} />}
      />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;


