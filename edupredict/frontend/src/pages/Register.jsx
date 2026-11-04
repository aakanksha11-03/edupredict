import { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage, fieldErrors } from "../api";

// Defined outside Register so it never remounts on state changes
function Field({ id, label, type = "text", value, onChange, error, ...rest }) {
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <Form.Control type={type} required value={value} onChange={onChange} isInvalid={!!error} {...rest} />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", invite_code: "" });
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setFields({});
    try {
      const u = await register(form);
      nav(u.role === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      setError(errorMessage(err)); setFields(fieldErrors(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <h1 className="h2 mb-4">Create your account</h1>
      <Form onSubmit={submit} className="auth-form" noValidate>
        {error && <Alert variant="danger">{error}</Alert>}
        <Field id="name" label="Full name" autoComplete="name" value={form.name} onChange={set("name")} error={fields.name} />
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={fields.email} />
        <Field id="password" label="Password (8+ characters)" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={fields.password} />
        <Form.Group className="mb-3" controlId="role">
          <Form.Label>I am a</Form.Label>
          <Form.Select value={form.role} onChange={set("role")}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </Form.Select>
        </Form.Group>
        {form.role === "teacher" && (
          <Field id="invite_code" label="Teacher invite code" value={form.invite_code} onChange={set("invite_code")} error={fields.invite_code} />
        )}
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
        <span className="ms-3 small">Have an account? <Link to="/login">Sign in</Link></span>
      </Form>
    </div>
  );
}
