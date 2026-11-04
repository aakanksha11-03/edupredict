import { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const u = await login(email, password);
      nav(u.role === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <h1 className="display-title">See where your marks are heading, and what to do about it.</h1>
      <p className="lead-copy">
        Enter your attendance, internal marks, study hours and assignment results. EduPredict estimates
        your performance level and points out where to focus.
      </p>
      <Form onSubmit={submit} className="auth-form">
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Form.Group>
        <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        <span className="ms-3 small">No account? <Link to="/register">Create one</Link></span>
      </Form>
    </div>
  );
}
