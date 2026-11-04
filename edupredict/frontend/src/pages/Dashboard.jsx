import { useEffect, useState } from "react";
import { Alert, Button, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import ProgressChart from "../components/ProgressChart";
import { PerformanceRuler } from "../components/ResultView";
import { COLORS, fmtDate } from "../constants";

export default function Dashboard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/assessments").then((r) => setRows(r.data.assessments)).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this assessment? This can't be undone.")) return;
    try { await api.delete(`/assessments/${id}`); load(); } catch (e) { setError(errorMessage(e)); }
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!rows) return <Spinner animation="border" role="status" aria-label="Loading" />;

  if (rows.length === 0)
    return (
      <div className="py-4" style={{ maxWidth: 560 }}>
        <h1 className="h2">No assessments yet</h1>
        <p>Enter your attendance, marks, study hours and assignment results to get your first prediction and study plan.</p>
        <Button as={Link} to="/assess">Add your first assessment</Button>
      </div>
    );

  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const delta = prev ? latest.risk_index - prev.risk_index : null;

  return (
    <>
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-4">
        <div>
          <p className="mb-1 text-muted">Latest prediction, {latest.term_label}</p>
          <h1 className="verdict-word mb-0" style={{ color: COLORS[latest.category] }}>{latest.category}</h1>
          {delta !== null && (
            <p className="mb-0 small">
              {Math.abs(delta) < 0.15 ? "About the same as last time." : delta > 0 ? "Up from your previous assessment." : "Down from your previous assessment."}
            </p>
          )}
        </div>
        <Button as={Link} to="/assess">New assessment</Button>
      </div>
      <div style={{ maxWidth: 520 }} className="mb-4"><PerformanceRuler riskIndex={latest.risk_index} /></div>
      <Link to={`/assessments/${latest.id}`}>View factors, subject analysis and study suggestions</Link>

      <hr className="my-4" />
      <ProgressChart assessments={rows} />

      <h2 className="h5 mt-5">All assessments</h2>
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead><tr><th>Term</th><th>Date</th><th>Attendance</th><th>Internal</th><th>Assignments</th><th>Study h/wk</th><th>Prediction</th><th /></tr></thead>
          <tbody>
            {[...rows].reverse().map((a) => (
              <tr key={a.id}>
                <td><Link to={`/assessments/${a.id}`}>{a.term_label}</Link></td>
                <td>{fmtDate(a.created_at)}</td>
                <td>{a.inputs.attendance}%</td><td>{a.inputs.internal_marks}%</td>
                <td>{a.inputs.assignment_score}%</td><td>{a.inputs.study_hours}</td>
                <td><strong style={{ color: COLORS[a.category] }}>{a.category}</strong></td>
                <td className="text-end"><Button size="sm" variant="link" className="text-danger" onClick={() => remove(a.id)}>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
