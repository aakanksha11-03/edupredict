import { useEffect, useState } from "react";
import { Alert, Badge, Spinner, Table } from "react-bootstrap";
import api, { errorMessage } from "../api";
import { CATEGORIES } from "../constants";

const LABELS = { attendance: "Attendance", internal_marks: "Internal marks", study_hours: "Study hours", assignment_score: "Assignments", previous_score: "Previous term" };

export default function ModelInfo() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/model/info").then((r) => setInfo(r.data.info)).catch((e) => setError(errorMessage(e))); }, []);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!info) return <Spinner animation="border" role="status" aria-label="Loading" />;
  const best = info.models[info.best_model];
  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="h2">About the prediction model</h1>
      <p>
        EduPredict compares three scikit-learn classifiers and uses the one that scores best in
        cross-validation. Predictions are estimates drawn from patterns in past student data. They
        are not guarantees, and they can be wrong for any individual student.
      </p>
      <Alert variant={info.data_source === "synthetic" ? "warning" : "info"}>{info.note} ({info.n_samples.toLocaleString()} records)</Alert>

      <h2 className="h5 mt-4">Model comparison</h2>
      <div className="table-responsive">
        <Table className="align-middle">
          <thead><tr><th>Model</th><th>Cross-validated F1</th><th>Test accuracy</th><th>Test F1</th></tr></thead>
          <tbody>
            {Object.entries(info.models).map(([name, m]) => (
              <tr key={name}>
                <td>{name} {name === info.best_model && <Badge bg="dark">in use</Badge>}</td>
                <td className="tabular">{pct(m.cv_f1_macro_mean)} ± {pct(m.cv_f1_macro_std)}</td>
                <td className="tabular">{pct(m.test_accuracy)}</td>
                <td className="tabular">{pct(m.test_f1_macro)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <h2 className="h5 mt-4">What the model relies on most</h2>
      {Object.entries(best.feature_importance).sort((a, b) => b[1] - a[1]).map(([f, v]) => (
        <div className="prob-row" key={f}>
          <span>{LABELS[f]}</span>
          <div className="prob-bar"><div style={{ width: `${v * 100 / Math.max(...Object.values(best.feature_importance)) }%`, background: "#2748D9" }} /></div>
          <span className="tabular">{pct(v)}</span>
        </div>
      ))}

      <h2 className="h5 mt-4">Where it makes mistakes</h2>
      <p className="small text-muted">Rows are the true category, columns are what the model predicted (held-out test data).</p>
      <div className="table-responsive">
        <Table size="sm" bordered className="text-center confusion">
          <thead><tr><th /><th colSpan={4}>Predicted</th></tr><tr><th>Actual</th>{CATEGORIES.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {best.confusion_matrix.map((row, i) => {
              const total = row.reduce((a, b) => a + b, 0) || 1;
              return (
                <tr key={i}><th>{CATEGORIES[i]}</th>
                  {row.map((n, j) => <td key={j} style={{ background: `rgba(39,72,217,${(n / total) * (i === j ? 0.5 : 1) * 0.6})` }}>{n}</td>)}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <p className="small text-muted">Most errors fall between neighbouring categories, such as Good versus Excellent.</p>
    </div>
  );
}
