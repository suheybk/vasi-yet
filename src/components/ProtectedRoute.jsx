import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePremium } from "../context/PremiumContext";

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();
    const { isFeatureLocked } = usePremium();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (isFeatureLocked(location.pathname)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedRoute;
