import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherSideBar from './TeacherSideBar';
import TeacherMainDashboard from './TeacherMainDashboard';
import TeacherCourses from './TeacherCourses';
import TeacherEnrollments from './TeacherEnrollments';
import TeacherLectures from './TeacherLectures';
import { supabase } from '../../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import TeacherStudents from "./TeacherStudents";
import TeacherReports from "./TeacherReports";

const TeacherDashboard = () => {
    const { user, loading, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeView, setActiveView] = useState("dashboard");
    const [message, setMessage] = useState('');

    // On mount, check if location.state has an activeView, then clear it.
    useEffect(() => {
        if (location.state && location.state.activeView) {
            console.log("Setting activeView from location.state:", location.state.activeView);
            setActiveView(location.state.activeView);
            // Clear the state so it doesn't persist on refresh:
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

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

    if (loading || !user) return <div>Loading...</div>;
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
