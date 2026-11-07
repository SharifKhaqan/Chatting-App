import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Get authentication status from Redux
  const { isAuthenticated } = useSelector((state) => state.auth);

  // If user is not logged in, redirect to Login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, show the requested page
  return children;
};

export default ProtectedRoute;