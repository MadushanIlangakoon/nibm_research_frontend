// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherCourseDetail from './components/TeacherCourseDetail';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import StudentSearchCourses from './components/StudentSearchCourses';
import TeacherEnrollmentRequests from './components/TeacherEnrollmentRequests';
import LecturePage from './components/LecturePage';
import StudentCourseDetail from "./components/StudentCourseDetail";
import GeneralQuestionsInfo from "./components/GeneralQuestionInfo";
import Questionnaire from "./components/Questionnaire";
import TestQuestionnaire from "./components/TestQuestionnaire";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                {/* Nest teacher course route under teacher dashboard */}
                <Route path="/teacher-dashboard" element={<TeacherDashboard />}>
                    <Route path="teacher-course/:id" element={<TeacherCourseDetail />} />
                </Route>
                <Route path="/student-search" element={<StudentSearchCourses />} />


                <Route path="/lecture/:lectureId" element={<LecturePage />} />
                <Route path="/teacher-enrollments" element={<TeacherEnrollmentRequests />} />
                <Route path="/general-questions" element={<GeneralQuestionsInfo />} />
                <Route path="/student-course/:id" element={<StudentCourseDetail />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/meeting/:roomID" element={<LecturePage />} />
                <Route path="/questionnaire" element={<Questionnaire />} />
                <Route path="/test_questionnaire/:lectureId" element={<TestQuestionnaire />} />
            </Routes>
        </Router>
    );
}

export default App;
