import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import ProgressChart from "../components/ProgressChart";
import ResultView from "../components/ResultView";
import { COLORS, fmtDate } from "../constants";

export default function StudentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/teacher/students/${id}`).then((r) => {
      setData(r.data); setSel(r.data.assessments.length - 1);
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Spinner animation="border" role="status" aria-label="Loading" />;
  const { student, assessments } = data;
  const current = assessments[sel];

  return (
    <>
      <p className="mb-1 small"><Link to="/teacher">All students</Link></p>
      <h1 className="h2">{student.name}</h1>
      <p className="text-muted">{student.email}</p>
      {assessments.length === 0 ? <p>This student hasn't added an assessment yet.</p> : (
        <>
          <ProgressChart assessments={assessments} />
          <div className="d-flex flex-wrap gap-2 my-4" role="tablist" aria-label="Assessments">
            {assessments.map((a, i) => (
              <button key={a.id} role="tab" aria-selected={i === sel} onClick={() => setSel(i)}
                className={`pill ${i === sel ? "active" : ""}`}>
                {a.term_label} <span style={{ color: i === sel ? "#fff" : COLORS[a.category] }}>● {a.category}</span>
                <small className="d-block">{fmtDate(a.created_at)}</small>
              </button>
            ))}
          </div>
          <ResultView result={current.result} inputs={current.inputs} />
        </>
      )}
    </>
  );
}
