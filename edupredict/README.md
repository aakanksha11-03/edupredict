# EduPredict — Student Performance Prediction and Academic Improvement System

EduPredict uses historical student data and machine learning to estimate a student's likely
performance category (**At Risk, Average, Good, Excellent**), explain what is affecting it, and
suggest where to improve. Predictions are **estimates, not guarantees**.

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) + Bootstrap 5 / React-Bootstrap, Recharts |
| Backend | Python Flask, SQLAlchemy (SQLite), JWT auth |
| ML | scikit-learn: Decision Tree, Random Forest, Logistic Regression |

## Features

**Students**
- Enter attendance, internal marks, weekly study hours, assignment performance (and optional previous-term score and subject marks)
- Predicted category with model confidence and probability for every category
- **Factors affecting performance**: a what-if analysis shows how far the predicted level would move if each factor reached a healthy target
- **Subject-wise strengths and weaknesses** (75%+ strength, under 50% weakness)
- Personalised study suggestions
- Charts of scores and predicted level over time; full assessment history

**Teachers** (registered with an invite code)
- Class overview: distribution by category, class averages, number At Risk
- Searchable and filterable student list with trend (improving / steady / declining)
- Drill into any student's history, factors and suggestions

**Everyone**: an "About the model" page with the three-model comparison, feature importance and confusion matrix.

## Quick start

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m ml.train            # optional: trains and saves the best model (auto-runs on first start if missing)
flask --app app seed-demo     # optional: demo teacher + 8 students with history
python app.py                 # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api to the backend)
```

Demo accounts (after `seed-demo`):
- Teacher: `teacher@edupredict.test` / `Teacher@123`
- Students: `student1@edupredict.test` … `student8@edupredict.test` / `Student@123`

Teacher sign-up requires the invite code `TEACH-2025` (change with `TEACHER_INVITE_CODE`).

### 3. Tests
```bash
cd backend && python -m pytest -q
```

## Using real data (important)

The bundled model is trained on **simulated data** so the app works immediately. Its accuracy
numbers describe the simulation, not real students. Before relying on it, train on your
institution's records (with consent and appropriate privacy handling):

```bash
python -m ml.train --data students.csv
```
CSV columns: `attendance, internal_marks, study_hours, assignment_score, previous_score` plus either
`final_score` (0–100, labelled using thresholds in `ml/constants.py`) or `category`.
Training uses a stratified 80/20 split, 5-fold cross-validation, and keeps the model with the
best macro-F1.

## How explanations work

`ml/predictor.py` re-runs the model with one factor changed at a time. If a factor is below its
target (e.g. attendance under 85%), it measures how much the expected performance level rises when
that factor is set to the target; if it is already at or above target, it measures how much the level
would drop if it were weak. These are **associations learned from data, not proven causes**.
Targets and thresholds live in `ml/constants.py`.

## API summary

| Method & path | Purpose | Access |
|---|---|---|
| POST `/api/auth/register`, `/api/auth/login` | Create account / sign in | public |
| GET `/api/auth/me` | Current user | any |
| POST `/api/predict` | Prediction without saving | any |
| POST `/api/assessments` | Predict and save | student |
| GET `/api/assessments`, `/api/assessments/<id>` | History / one result | student (own), teacher (any, by id) |
| DELETE `/api/assessments/<id>` | Delete own assessment | student |
| GET `/api/teacher/summary`, `/students`, `/students/<id>` | Class overview and drill-down | teacher |
| GET `/api/model/info` | Model metrics | any |
| GET `/api/health` | Health check | public |

## Project layout
```
backend/   app.py  auth.py  models.py  validators.py  routes/api.py  ml/{constants,generate_data,train,predictor}.py  tests/
frontend/  src/{App,AuthContext,api}.js(x)  components/  pages/  styles.css
```

## Production notes
- Set `SECRET_KEY` (32+ random bytes), `DATABASE_URI`, `CORS_ORIGINS`, `TEACHER_INVITE_CODE` as environment variables.
- Serve the backend with `gunicorn app:app`; build the frontend with `npm run build` and serve `dist/` behind the same domain (or a reverse proxy that forwards `/api`).
- Tokens are kept in `localStorage` for simplicity; consider httpOnly cookies and rate limiting on login for a public deployment.
- Student records are personal data: restrict access, and follow your institution's privacy rules.

## Responsible use
Use predictions to start supportive conversations, not to label or rank students. Review model
fairness on your own data before wide use, and never use a prediction as the sole basis for a decision.
