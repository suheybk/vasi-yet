import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Dashboard from "./pages/Dashboard";
import Debts from "./pages/Debts";
import Credits from "./pages/Credits";
import Testament from "./pages/Testament";
import Contacts from "./pages/Contacts";
import Assets from "./pages/Assets";
import Trusts from "./pages/Trusts";
import ReligiousObligations from "./pages/ReligiousObligations";
import ForgivenessRequests from "./pages/ForgivenessRequests";
import CharityWills from "./pages/CharityWills";
import Profile from "./pages/Profile";
import { Toaster } from "react-hot-toast";

// Redirect based on auth + onboarding status
const RootRedirect = () => {
  const { currentUser, isOnboarded } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (!isOnboarded) return <Navigate to="/onboarding" />;
  return <Navigate to="/dashboard" />;
};

// Wrapper that also checks onboarding
const OnboardedRoute = ({ children }) => {
  const { currentUser, isOnboarded } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (!isOnboarded) return <Navigate to="/onboarding" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e3a8a',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 20px',
            },
            success: {
              iconTheme: { primary: '#d4af37', secondary: '#fff' },
            },
            error: {
              style: { background: '#dc2626' },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/gizlilik" element={<PrivacyPolicy />} />

          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={
            <OnboardedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/borclar" element={
            <OnboardedRoute>
              <MainLayout>
                <Debts />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/alacaklar" element={
            <OnboardedRoute>
              <MainLayout>
                <Credits />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/vasiyet" element={
            <OnboardedRoute>
              <MainLayout>
                <Testament />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/kisiler" element={
            <OnboardedRoute>
              <MainLayout>
                <Contacts />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/varliklar" element={
            <OnboardedRoute>
              <MainLayout>
                <Assets />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/emanetler" element={
            <OnboardedRoute>
              <MainLayout>
                <Trusts />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/dini-yukumlulukler" element={
            <OnboardedRoute>
              <MainLayout>
                <ReligiousObligations />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/helallik" element={
            <OnboardedRoute>
              <MainLayout>
                <ForgivenessRequests />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/hayir-vasiyetleri" element={
            <OnboardedRoute>
              <MainLayout>
                <CharityWills />
              </MainLayout>
            </OnboardedRoute>
          } />

          <Route path="/profil" element={
            <OnboardedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </OnboardedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
