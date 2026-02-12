import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Debts from "./pages/Debts";
import Credits from "./pages/Credits";
import Testament from "./pages/Testament";
import Contacts from "./pages/Contacts";

// Redirect to dashboard if logged in, otherwise login
const RootRedirect = () => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Auth />} />

          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/borclar" element={
            <ProtectedRoute>
              <MainLayout>
                <Debts />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/alacaklar" element={
            <ProtectedRoute>
              <MainLayout>
                <Credits />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/vasiyet" element={
            <ProtectedRoute>
              <MainLayout>
                <Testament />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/kisiler" element={
            <ProtectedRoute>
              <MainLayout>
                <Contacts />
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
