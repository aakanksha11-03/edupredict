import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES } from "../constants";

const SERIES = [
  ["internal_marks", "Internal marks", "#2748D9"],
  ["assignment_score", "Assignments", "#1C7C86"],
  ["attendance", "Attendance", "#B7791F"],
];

export default function ProgressChart({ assessments }) {
  if (!assessments.length) return null;
  const data = assessments.map((a) => ({
    term: a.term_label, level: a.risk_index, ...a.inputs,
  }));
  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <h3 className="h6">Scores over time</h3>
        <div style={{ height: 260 }} role="img" aria-label="Line chart of internal marks, assignments and attendance by term">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: -15, right: 10, top: 5 }}>
              <CartesianGrid stroke="#dde3ec" strokeDasharray="3 3" />
              <XAxis dataKey="term" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Legend />
              {SERIES.map(([k, name, color]) => (
                <Line key={k} dataKey={k} name={name} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="col-lg-5">
        <h3 className="h6">Predicted performance level</h3>
        <div style={{ height: 260 }} role="img" aria-label="Line chart of predicted performance level by term">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 20, right: 10, top: 5 }}>
              <CartesianGrid stroke="#dde3ec" strokeDasharray="3 3" />
              <XAxis dataKey="term" fontSize={12} />
              <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} fontSize={11} tickFormatter={(v) => CATEGORIES[v]} />
              <Tooltip formatter={(v) => [Number(v).toFixed(2), "Level (0–3)"]} />
              <Line dataKey="level" stroke="#16213A" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
