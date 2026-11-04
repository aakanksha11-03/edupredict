import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewAssessment from "./pages/NewAssessment";
import AssessmentDetail from "./pages/AssessmentDetail";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDetail from "./pages/StudentDetail";
import ModelInfo from "./pages/ModelInfo";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "teacher" ? "/teacher" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <>
      <NavBar />
      <main className="container py-4 page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute role="student"><Dashboard /></ProtectedRoute>} />
          <Route path="/assess" element={<ProtectedRoute role="student"><NewAssessment /></ProtectedRoute>} />
          <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentDetail /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/students/:id" element={<ProtectedRoute role="teacher"><StudentDetail /></ProtectedRoute>} />
          <Route path="/model" element={<ProtectedRoute><ModelInfo /></ProtectedRoute>} />
          <Route path="*" element={<div className="py-5"><h1 className="h3">Page not found</h1><p>Check the address or go back to your dashboard.</p></div>} />
        </Routes>
      </main>
      <footer className="container pb-4 small text-muted">
        EduPredict gives estimates based on past patterns, not guarantees of future results.
      </footer>
    </>
  );
}
