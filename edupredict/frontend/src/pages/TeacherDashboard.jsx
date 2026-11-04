import { useEffect, useState } from "react";
import { Alert, Badge, Form, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errorMessage } from "../api";
import { CATEGORIES, COLORS, fmtDate } from "../constants";

const TREND = { improving: "success", declining: "danger", steady: "secondary" };

export default function TeacherDashboard() {
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { api.get("/teacher/summary").then((r) => setSummary(r.data.summary)).catch((e) => setError(errorMessage(e))); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      api.get("/teacher/students", { params: { q, category: cat || undefined } })
        .then((r) => setStudents(r.data.students)).catch((e) => setError(errorMessage(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!summary || !students) return <Spinner animation="border" role="status" aria-label="Loading" />;

  return (
    <>
      <h1 className="h2">Student overview</h1>
      <p className="text-muted">
        {summary.assessed_students} of {summary.total_students} students have an assessment.{" "}
        <strong className={summary.at_risk ? "text-danger" : ""}>{summary.at_risk} currently predicted At Risk.</strong>
      </p>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <h2 className="h6">Class distribution (latest prediction per student)</h2>
          <div style={{ height: 220 }} role="img" aria-label="Bar chart of students per performance category">
            <ResponsiveContainer>
              <BarChart data={summary.distribution} margin={{ left: -20 }}>
                <XAxis dataKey="category" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="Students" radius={[3, 3, 0, 0]}>
                  {summary.distribution.map((d) => <Cell key={d.category} fill={COLORS[d.category]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-lg-6">
          <h2 className="h6">Class averages</h2>
          <Table size="sm" borderless className="mb-0">
            <tbody>
              {[["attendance", "Attendance", "%"], ["internal_marks", "Internal marks", "%"], ["assignment_score", "Assignments", "%"], ["study_hours", "Study hours", " h/week"]].map(([k, l, u]) => (
                <tr key={k}><td>{l}</td><td className="tabular">{summary.averages[k]}{u}</td></tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
        <Form.Control style={{ maxWidth: 280 }} placeholder="Search by name or email" aria-label="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
        <Form.Select style={{ maxWidth: 200 }} aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </Form.Select>
      </div>

      {students.length === 0 ? <p>No students match these filters.</p> : (
        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead><tr><th>Student</th><th>Latest prediction</th><th>Trend</th><th>Assessments</th><th>Last updated</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/teacher/students/${s.id}`}>{s.name}</Link><div className="small text-muted">{s.email}</div></td>
                  <td>{s.latest ? <strong style={{ color: COLORS[s.latest.category] }}>{s.latest.category}</strong> : <span className="text-muted">Not assessed</span>}</td>
                  <td>{s.trend ? <Badge bg={TREND[s.trend]}>{s.trend}</Badge> : "—"}</td>
                  <td>{s.assessment_count}</td>
                  <td>{s.latest ? fmtDate(s.latest.created_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
