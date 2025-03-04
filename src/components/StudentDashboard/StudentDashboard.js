import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import MainDashboard from './MainDashboard';
import Courses from './Courses';
import Enrollments from './Enrollments';
import Lectures from './Lectures';
import Teachers from './Teachers';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import StudentProfileModal from "./StudentProfileModal";

const SIX_HOURS = 6 * 60 * 60 * 1000;

const StudentDashboard = () => {
    const { user, loading } = useAuth();
    const [activeView, setActiveView] = useState("dashboard");
    const [message, setMessage] = useState('');
    const [showGeneralQuestionModal, setShowGeneralQuestionModal] = useState(false);
    const [remindTimestamp, setRemindTimestamp] = useState(() => {
        const stored = localStorage.getItem("remindGeneralQuestionsTimestamp");
        return stored ? parseInt(stored, 10) : null;
    });

    const studentId = user && (user.auth_id || user.id);

    useEffect(() => {
        if (!user || !studentId) return;
        const checkReminder = async () => {
            const { data, error } = await supabase
                .from('students')
                .select('did_general_questions')
                .eq('auth_id', studentId)
                .single();
            if (error) {
                console.error("Error fetching student data:", error);
                return;
            }
            if (!data.did_general_questions) {
                const storedTimestamp = localStorage.getItem("remindGeneralQuestionsTimestamp");
                const now = Date.now();
                if (!storedTimestamp || now - parseInt(storedTimestamp, 10) >= SIX_HOURS) {
                    setShowGeneralQuestionModal(true);
                }
            }
        };
        checkReminder();
    }, [user, studentId]);

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        else if (hour < 18) return "Good Afternoon";
        else return "Good Evening";
    }

    const renderContent = () => {
        if (activeView === "dashboard") {
            return (
                <>
                    <div className="p-5">
                        <h3 className="text-3xl font-bold text-gray-700">
                            {getGreeting()}, {user?.name || "User Name"}
                        </h3>
                    </div>
                    <div className="bg-gray-300 h-1 mt-2"></div>
                    <MainDashboard user={user} />
                </>
            );
        } else if (activeView === "profile") {
            return (
                <StudentProfileModal
                    student={user}  // Assuming your user context holds the student profile data.
                    onClose={() => setActiveView("dashboard")}
                    onProfileUpdated={(updatedProfile) => {
                        // Optionally update your user context with updatedProfile here.
                        setActiveView("dashboard");
                    }}
                />
            );
        } else if (activeView === "courses") {
            return (
                <Courses
                    studentId={studentId}
                    user={user}
                    onBack={() => setActiveView("dashboard")}
                />
            );
        } else if (activeView === "enrollments") {
            return (
                <Enrollments
                    studentId={studentId}
                    user={user}
                    onBack={() => setActiveView("dashboard")}
                />
            );
        } else if (activeView === "lectures") {
            return (
                <Lectures
                    studentId={studentId}
                    user={user}
                    onBack={() => setActiveView("dashboard")}
                />
            );
        } else if (activeView === "teachers") {
            return (
                <Teachers
                    onBack={() => setActiveView("dashboard")}
                />
            );
        }
        return null;
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Please login to access the dashboard.</div>;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
            <div className="w-64 sticky top-0 h-screen">
                <Sidebar setActiveView={setActiveView} />
            </div>
            <div className="flex-1 p-8">
                {renderContent()}
            </div>

            {message && <p className="text-red-500 mt-4">{message}</p>}
            {/* Modal for General Questions */}
            {showGeneralQuestionModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-11/12 max-w-md shadow-lg">
                        <h3 className="text-xl font-bold mb-4">General Questions</h3>
                        <p className="mb-4">
                            You have not completed the general questions yet. Would you like to do them now?
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    const now = Date.now();
                                    localStorage.setItem("remindGeneralQuestionsTimestamp", now.toString());
                                    setRemindTimestamp(now);
                                    setShowGeneralQuestionModal(false);
                                }}
                                className="mr-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                            >
                                Remind Me Later
                            </button>
                            <Link
                                to="/general-questions"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                                onClick={() => {
                                    const now = Date.now();
                                    localStorage.setItem("remindGeneralQuestionsTimestamp", now.toString());
                                    setRemindTimestamp(now);
                                    setShowGeneralQuestionModal(false);
                                }}
                            >
                                Do It Now
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
