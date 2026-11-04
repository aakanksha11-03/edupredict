export const CATEGORIES = ["At Risk", "Average", "Good", "Excellent"];
export const COLORS = {
  "At Risk": "#B8322B",
  Average: "#B7791F",
  Good: "#1C7C86",
  Excellent: "#2B7A45",
};
export const STATUS_COLORS = { strength: "#2B7A45", moderate: "#7A869A", weakness: "#B8322B" };
export const FIELD_LABELS = {
  attendance: "Attendance (%)",
  internal_marks: "Internal marks (%)",
  study_hours: "Study hours per week",
  assignment_score: "Assignment performance (%)",
  previous_score: "Previous term score (%)",
};
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
