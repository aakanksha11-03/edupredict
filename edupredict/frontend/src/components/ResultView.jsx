import { Alert } from "react-bootstrap";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, COLORS, STATUS_COLORS } from "../constants";

/** The signature element: a four-step ruler with a marker at the predicted level. */
export function PerformanceRuler({ riskIndex }) {
  const pos = `${(riskIndex / 3) * 100}%`;
  return (
    <div className="ruler" role="img" aria-label={`Predicted level ${riskIndex.toFixed(1)} on a scale from At Risk to Excellent`}>
      <div className="ruler-track">
        {CATEGORIES.map((c) => <span key={c} style={{ background: COLORS[c] }} />)}
        <i className="ruler-marker" style={{ left: pos }} />
      </div>
      <div className="ruler-labels">
        {CATEGORIES.map((c) => <span key={c}>{c}</span>)}
      </div>
    </div>
  );
}

export default function ResultView({ result, inputs }) {
  const { category, confidence, probabilities, factors, subjects, suggestions, risk_index, disclaimer, model } = result;
  const holding = factors.filter((f) => f.kind === "negative");
  const helping = factors.filter((f) => f.kind === "positive");
  const maxImpact = Math.max(0.1, ...factors.map((f) => Math.abs(f.impact)));

  return (
    <div className="result">
      <section className="verdict">
        <p className="mb-1 text-muted">Predicted performance</p>
        <h2 className="verdict-word" style={{ color: COLORS[category] }}>{category}</h2>
        <p className="mb-3">
          The model is {Math.round(confidence * 100)}% confident in this category
          {model ? ` (${model})` : ""}. Nearby categories are possible, shown below.
        </p>
        <PerformanceRuler riskIndex={risk_index} />
        <div className="probs mt-3">
          {CATEGORIES.map((c) => (
            <div key={c} className="prob-row">
              <span>{c}</span>
              <div className="prob-bar"><div style={{ width: `${probabilities[c] * 100}%`, background: COLORS[c] }} /></div>
              <span className="tabular">{Math.round(probabilities[c] * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      <div className="row g-4 mt-1">
        <section className="col-lg-6">
          <h3 className="h5">What is affecting this result</h3>
          <p className="small text-muted">
            Each bar shows how much the predicted level would shift if that factor were at a
            healthy target (or at a weak level, for factors already doing well).
          </p>
          {holding.length === 0 && <p>No factor is clearly holding this prediction back.</p>}
          {holding.length > 0 && <h4 className="h6 mt-3">Holding you back</h4>}
          {holding.map((f) => <FactorRow key={f.feature} f={f} max={maxImpact} color="#B8322B" />)}
          {helping.length > 0 && <h4 className="h6 mt-3">Working in your favour</h4>}
          {helping.map((f) => <FactorRow key={f.feature} f={f} max={maxImpact} color="#2B7A45" />)}
        </section>

        <section className="col-lg-6">
          <h3 className="h5">Subject strengths and weaknesses</h3>
          {subjects.length === 0 ? (
            <p className="text-muted">No subject marks were entered for this assessment. Add them next time to see strengths and weaknesses.</p>
          ) : (
            <>
              <div style={{ height: 40 + subjects.length * 38 }} role="img" aria-label="Bar chart of marks per subject">
                <ResponsiveContainer>
                  <BarChart data={subjects} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={110} fontSize={12} />
                    <Tooltip formatter={(v) => [`${v}%`, "Marks"]} />
                    <ReferenceLine x={50} stroke="#7A869A" strokeDasharray="3 3" />
                    <ReferenceLine x={75} stroke="#7A869A" strokeDasharray="3 3" />
                    <Bar dataKey="marks" radius={[0, 3, 3, 0]}>
                      {subjects.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.status]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="small text-muted mb-0">
                Green: strength (75%+). Grey: moderate. Red: needs attention (under 50%).
              </p>
            </>
          )}
        </section>
      </div>

      <section className="mt-4">
        <h3 className="h5">Study suggestions</h3>
        <ol className="suggestions">
          {suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </section>

      <Alert variant="light" className="small border mt-4 mb-0">{disclaimer}</Alert>
    </div>
  );
}

function FactorRow({ f, max, color }) {
  return (
    <div className="factor">
      <div className="d-flex justify-content-between">
        <strong>{f.label}</strong>
        <span className="tabular small">{f.impact > 0 ? "+" : ""}{f.impact.toFixed(2)} levels</span>
      </div>
      <div className="factor-bar"><div style={{ width: `${(Math.abs(f.impact) / max) * 100}%`, background: color }} /></div>
      <div className="small text-muted">{f.detail}</div>
    </div>
  );
}
