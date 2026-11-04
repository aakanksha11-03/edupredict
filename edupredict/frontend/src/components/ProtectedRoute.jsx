import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner animation="border" role="status" aria-label="Loading" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
