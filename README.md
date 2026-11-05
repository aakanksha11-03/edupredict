# 🎓 EduPredict – Student Performance Prediction & Academic Improvement System

**EduPredict** is an AI-powered academic performance prediction system designed to help students and teachers monitor academic progress, identify performance risks, and make data-driven decisions for improvement.

The system uses Machine Learning algorithms to predict student performance categories based on attendance, internal marks, study hours, assignment scores, and previous academic performance.

It also provides personalized study recommendations, performance analytics, and interactive dashboards to support better academic outcomes.

---

## 🚀 Key Features

### 👨‍🎓 Student Features
- **Student Dashboard:** View academic performance and progress.
- **Performance Prediction:** Predict academic performance using Machine Learning.
- **Performance Categories:** Classify students into four categories:
  - At Risk
  - Average
  - Good
  - Excellent
- **Assessment History:** Track previous assessments and predictions.
- **Performance Analytics:** Visualize academic progress through interactive charts.
- **Subject-wise Analysis:** Identify academic strengths and weaknesses.
- **Personalized Suggestions:** Receive recommendations to improve academic performance.
- **Prediction Confidence:** View model confidence and probability scores for each category.
- **What-if Analysis:** Understand how improving individual academic factors may affect predicted performance.

### 👩‍🏫 Teacher Features
- **Teacher Dashboard:** Monitor overall class performance.
- **Student Management:** View and search student records.
- **Performance Distribution:** Analyze students across different performance categories.
- **Student Progress Tracking:** Identify improving, steady, and declining performance trends.
- **Individual Student Analysis:** View assessment history and improvement suggestions.

### 🤖 Machine Learning Features
- Decision Tree Classifier
- Random Forest Classifier
- Logistic Regression
- Model comparison and selection
- Feature importance analysis
- Confusion matrix visualization
- Model evaluation using accuracy and F1-score

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, HTML5, CSS3 |
| UI Framework | Bootstrap 5, React-Bootstrap |
| Charts | Recharts |
| Backend | Python, Flask |
| Database | SQLite |
| Machine Learning | Scikit-learn |
| Data Processing | Pandas, NumPy |
| Authentication | JWT (JSON Web Token) |
| API Communication | Axios |
| Development Tools | VS Code, Git, GitHub |

---

## 🧠 How the System Works

1. **Student Input:** Students enter their academic information, including attendance, internal marks, study hours, and assignment scores.
2. **Data Processing:** The backend validates and processes the submitted information.
3. **Machine Learning Prediction:** The trained ML model analyzes the academic data.
4. **Performance Classification:** The system predicts the student's likely performance category.
5. **Result Analysis:** Students receive prediction confidence, category probabilities, and factors affecting performance.
6. **Personalized Recommendations:** The system provides suggestions to help students improve.
7. **Progress Monitoring:** Assessment results are saved and displayed through dashboards and charts.

---

## 📊 Machine Learning Algorithms

EduPredict compares three classification algorithms:

| Algorithm | Purpose |
|---|---|
| Decision Tree | Predicts performance using decision rules |
| Random Forest | Combines multiple decision trees for prediction |
| Logistic Regression | Classifies students into performance categories |

The system evaluates the models using cross-validation and selects the best-performing model based on macro F1-score.

**Note:** The bundled model uses simulated student data for demonstration. Its evaluation metrics should not be interpreted as real-world student performance accuracy.

---

## 📂 Project Structure

```text
EduPredict/
│
├── edupredict/
│   │
│   ├── backend/
│   │   ├── app.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── models.py
│   │   ├── validators.py
│   │   ├── extensions.py
│   │   │
│   │   ├── routes/
│   │   │   └── api.py
│   │   │
│   │   ├── ml/
│   │   │   ├── train.py
│   │   │   ├── predictor.py
│   │   │   ├── constants.py
│   │   │   ├── generate_data.py
│   │   │   └── artifacts/
│   │   │
│   │   ├── tests/
│   │   └── requirements.txt
│   │
│   ├── frontend/
│   │   ├── index.html
│   │   ├── package.json
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── App.jsx
│   │       ├── AuthContext.jsx
│   │       ├── api.js
│   │       └── styles.css
│   │
│   └── README.md
│
└── package-lock.json
```

---

## ⚙️ Installation and Setup

Follow these steps to run EduPredict locally.

### Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js and npm
- Visual Studio Code
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

```bash
cd YOUR_REPOSITORY_NAME
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd edupredict/backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Initialize demo data (optional):

```bash
flask --app app seed-demo
```

Start the Flask server:

```bash
python app.py
```

Backend will run at:

```text
http://127.0.0.1:5000
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd edupredict/frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

Open the URL in your browser to access EduPredict.

---

## 🔐 Demo Login Credentials

After successfully executing the demo seed command, use the following credentials.

### Teacher Account

| Field | Details |
|---|---|
| Email | teacher@edupredict.test |
| Password | Teacher@123 |
| Role | Teacher |

### Student Account

| Field | Details |
|---|---|
| Email | student1@edupredict.test |
| Password | Student@123 |
| Role | Student |

Additional demo student accounts are available from student2 to student8 using the same password: `Student@123`.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User authentication |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/predict` | Generate performance prediction |
| POST | `/api/assessments` | Save student assessment |
| GET | `/api/assessments` | Get assessment history |
| GET | `/api/assessments/<id>` | Get assessment details |
| DELETE | `/api/assessments/<id>` | Delete an assessment |
| GET | `/api/teacher/summary` | Get class performance summary |
| GET | `/api/teacher/students` | Get student records |
| GET | `/api/model/info` | Get ML model information |
| GET | `/api/health` | Check backend health |

---

## 🔮 Future Enhancements

- Integration with real institutional student datasets.
- Advanced AI-based personalized learning recommendations.
- Automated attendance integration.
- Email and notification alerts for students.
- More advanced explainable AI techniques.
- Deployment on cloud platforms.
- Improved model fairness and evaluation using real-world data.

---

## 🎯 Project Objectives

- Predict student academic performance using Machine Learning.
- Identify students who may need additional academic support.
- Help teachers monitor student progress efficiently.
- Provide personalized recommendations for academic improvement.
- Demonstrate the integration of React, Flask, SQLite, and Machine Learning.

---

## ⚠️ Responsible Use

EduPredict is an academic support
