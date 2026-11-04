import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import ResultView from "../components/ResultView";
import { fmtDate } from "../constants";

export default function AssessmentDetail() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/assessments/${id}`).then((r) => setA(r.data.assessment)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!a) return <Spinner animation="border" role="status" aria-label="Loading" />;
  return (
    <>
      <p className="mb-1 small"><Link to={-1}>Back</Link></p>
      <h1 className="h2">{a.term_label}</h1>
      <p className="text-muted">Saved {fmtDate(a.created_at)}</p>
      <ResultView result={a.result} inputs={a.inputs} />
    </>
  );
}
