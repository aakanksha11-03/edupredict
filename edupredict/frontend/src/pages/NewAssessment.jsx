import { useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api, { errorMessage, fieldErrors } from "../api";
import { FIELD_LABELS } from "../constants";

const HINTS = {
  attendance: "Share of classes attended this term",
  internal_marks: "Average of your internal tests",
  study_hours: "Self-study outside class, per week",
  assignment_score: "Average score on submitted assignments",
  previous_score: "Optional. Leave blank if this is your first term",
};
const RANGES = { attendance: [0, 100], internal_marks: [0, 100], study_hours: [0, 80], assignment_score: [0, 100], previous_score: [0, 100] };

export default function NewAssessment() {
  const nav = useNavigate();
  const [vals, setVals] = useState({ term_label: "", attendance: "", internal_marks: "", study_hours: "", assignment_score: "", previous_score: "" });
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const setSubject = (i, k, v) => setSubjects(subjects.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setFields({});
    const body = { ...vals, subjects: subjects.filter((s) => s.name || s.marks !== "") };
    try {
      const { data } = await api.post("/assessments", body);
      nav(`/assessments/${data.assessment.id}`);
    } catch (err) {
      setError(errorMessage(err)); setFields(fieldErrors(err));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setBusy(false); }
  };

  return (
    <Form onSubmit={submit} noValidate style={{ maxWidth: 760 }}>
      <h1 className="h2">New assessment</h1>
      <p className="text-muted">Enter your latest figures. Your results are saved so you can track progress across terms.</p>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group className="mb-4" controlId="term_label">
        <Form.Label>Term or test name</Form.Label>
        <Form.Control placeholder="For example, Mid-term 1" value={vals.term_label}
          onChange={(e) => setVals({ ...vals, term_label: e.target.value })} maxLength={60} />
        <Form.Text>Optional. Used to label your progress charts.</Form.Text>
      </Form.Group>

      <Row className="g-3">
        {Object.keys(RANGES).map((k) => (
          <Col md={6} key={k}>
            <Form.Group controlId={k}>
              <Form.Label>{FIELD_LABELS[k]}</Form.Label>
              <Form.Control type="number" inputMode="decimal" step="any" min={RANGES[k][0]} max={RANGES[k][1]}
                value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} isInvalid={!!fields[k]} />
              <Form.Control.Feedback type="invalid">{fields[k]}</Form.Control.Feedback>
              <Form.Text>{HINTS[k]}</Form.Text>
            </Form.Group>
          </Col>
        ))}
      </Row>

      <h2 className="h5 mt-5">Subject marks <span className="text-muted fw-normal">(optional)</span></h2>
      <p className="small text-muted">Add subjects to see which are strengths and which need work.</p>
      {fields.subjects && <Alert variant="danger">{fields.subjects}</Alert>}
      {subjects.map((s, i) => (
        <Row className="g-2 mb-2 align-items-start" key={i}>
          <Col xs={7}>
            <Form.Control aria-label={`Subject ${i + 1} name`} placeholder="Subject name" value={s.name}
              onChange={(e) => setSubject(i, "name", e.target.value)} isInvalid={!!fields[`subjects[${i}]`]} />
            <Form.Control.Feedback type="invalid">{fields[`subjects[${i}]`]}</Form.Control.Feedback>
          </Col>
          <Col xs={3}>
            <Form.Control aria-label={`Subject ${i + 1} marks`} type="number" min={0} max={100} step="any" placeholder="Marks %"
              value={s.marks} onChange={(e) => setSubject(i, "marks", e.target.value)} />
          </Col>
          <Col xs={2}>
            <Button variant="outline-secondary" className="w-100" onClick={() => setSubjects(subjects.filter((_, j) => j !== i))}
              aria-label={`Remove subject ${i + 1}`}>Remove</Button>
          </Col>
        </Row>
      ))}
      <Button variant="outline-primary" size="sm" disabled={subjects.length >= 15}
        onClick={() => setSubjects([...subjects, { name: "", marks: "" }])}>Add a subject</Button>

      <div className="mt-5">
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Calculating…" : "Get my prediction"}</Button>
      </div>
    </Form>
  );
}
