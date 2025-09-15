// /src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../api/authStorage";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

export default ProtectedRoute;
