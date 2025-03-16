import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherSideBar from './TeacherSideBar';
import TeacherMainDashboard from './TeacherMainDashboard';
import TeacherCourses from './TeacherCourses';
import TeacherEnrollments from './TeacherEnrollments';
import TeacherLectures from './TeacherLectures';
import { supabase } from '../../supabaseClient';
import {Link, useNavigate} from 'react-router-dom';
import TeacherStudents from "./TeacherStudents";
import TeacherReports from "./TeacherReports";

const TeacherDashboard = () => {
    const { user, loading, role } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState("dashboard");
    const [message, setMessage] = useState('');

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        else if (hour < 18) return "Good Afternoon";
        else return "Good Evening";
    }


    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'student') {

                navigate('/student-dashboard');
            }
        }
    }, [user, loading, navigate, role]);

    const renderContent = () => {
        switch (activeView) {
            case "dashboard":
                return <TeacherMainDashboard user={user} />;
            case "courses":
                return (
                    <TeacherCourses
                        teacherId={user.id}
                        onBack={() => setActiveView("dashboard")}
                    />
                );
            case "enrollments":
                return (
                    <TeacherEnrollments
                        teacherId={user.id}
                        onBack={() => setActiveView("dashboard")}
                    />
                );
            case "lectures":
                return (
                    <TeacherLectures
                        teacherId={user.id}
                        onBack={() => setActiveView("dashboard")}
                    />
                );
            case "students":
                return (
                    <TeacherStudents
                        teacherId={user.id}
                        onBack={() => setActiveView("dashboard")}
                    />
                );
                case "reports":
                return (
                    <TeacherReports
                        teacherId={user.id}
                        onBack={() => setActiveView("dashboard")}
                    />
                );
            // Additional views can be added here.
            default:
                return null;
        }
    };

    // Wait until the user object has been loaded and the extra profile data is merged.
    if (loading || !user) return <div>Loading...</div>;
    // Check if the profile has been merged by ensuring the role is set.
    if (user.role === "authenticated") return <div>Loading teacher data...</div>;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
            {/* Sidebar */}
            <div className="w-64 sticky top-0 h-screen">
                <TeacherSideBar setActiveView={setActiveView} />
            </div>
            {/* Main Content */}
            <div className="flex-1 p-8">
                {renderContent()}
            </div>
            {message && <p className="text-red-500 mt-4">{message}</p>}
        </div>
    );
};

export default TeacherDashboard;
