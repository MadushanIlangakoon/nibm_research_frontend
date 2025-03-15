// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import StudentDashboard from './components/StudentDashboard/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard/TeacherDashboard';
import TeacherCourseDetail from './components/TeacherDashboard/TeacherCourseDetail';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import StudentSearchCourses from './components/StudentDashboard/StudentSearchCourses';
import TeacherEnrollmentRequests from './components/TeacherDashboard/TeacherEnrollmentRequests';
import LecturePage from './components/TeacherDashboard/LecturePage';
import StudentCourseDetail from "./components/StudentDashboard/StudentCourseDetail";
import GeneralQuestionsInfo from "./components/StudentDashboard/GeneralQuestionInfo";
import Questionnaire from "./components/StudentDashboard/Questionnaire";
import TestQuestionnaire from "./components/TeacherDashboard/TestQuestionnaire";
import TeacherReports from "./components/TeacherDashboard/TeacherReports";
import TeacherStudentReports from "./components/TeacherDashboard/TeacherStudentReports";
import TeacherCourseReports from "./components/TeacherDashboard/TeacherCourseReports";

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
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher-dashboard/teacher-course/:id" element={<TeacherCourseDetail />} />
                <Route path="/teacher-course/:id" element={<TeacherCourseDetail />} />

                <Route path="/student-search" element={<StudentSearchCourses />} />
                <Route path="/teacher-reports" element={<TeacherReports />} />
                <Route path="/teacher-reports/student/:studentId" element={<TeacherStudentReports />} />
                <Route path="/teacher-reports/course/:courseId" element={<TeacherCourseReports />} />

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
