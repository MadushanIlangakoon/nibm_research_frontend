import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import TeacherProfileModal from "./TeacherProfileModal";

const TeacherSideBar = ({ setActiveView }) => {
    const { user } = useAuth();
    const [teacherName, setTeacherName] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const breakpoint = 1024;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= breakpoint) {
                setCollapsed(false);
            } else {
                setCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch teacher's name from Supabase.
    useEffect(() => {
        async function fetchTeacher() {
            if (user && user.id) {
                const { data, error } = await supabase
                    .from('teachers')
                    .select('name')
                    .eq('auth_id', user.auth_id)
                    .single();
                if (error) {
                    console.error('Error fetching teacher name:', error);
                } else if (data) {
                    setTeacherName(data.name);
                }
            }
        }
        fetchTeacher();
    }, [user]);

    // Determine profile image.
    const profileImage = user.photo
        ? user.photo
        : user && user.gender && user.gender.toLowerCase() === 'female'
            ? '/TeacherFemalePlaceholder.webp'
            : '/TeacherMalePlaceholder.webp';

    return (
        <div
            className={`h-screen sticky top-0 -mt-18  bg-gray-800 text-white p-4 transition-all duration-300 relative ${
                collapsed ? 'w-16' : 'w-64'
            }`}
            onMouseEnter={() => {
                if (window.innerWidth < breakpoint) setCollapsed(false);
            }}
            onMouseLeave={() => {
                if (window.innerWidth < breakpoint) setCollapsed(true);
            }}
        >
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-8 mt-28">
                <img
                    className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover"
                    src={profileImage}
                    alt="Profile"
                />
                {/* Always show an icon button for viewing profile */}
                {collapsed ? (
                    <button
                        onClick={() => setShowProfileModal(true)}
                        title="View Profile"
                        className="mt-2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.87 6.196 9 9 0 015.12 17.804z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                ) : (
                    <>
                        <p className="mt-4 text-lg font-bold">{teacherName || "Teacher Name"}</p>
                        <p className="text-sm">{user?.email || "teacher@example.com"}</p>
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="mt-2 text-blue-400 hover:underline z-50"
                        >
                            View Profile
                        </button>
                    </>
                )}
                {showProfileModal && (
                    <TeacherProfileModal
                        teacher={user}  // assuming user contains teacher info
                        onClose={() => setShowProfileModal(false)}
                        onProfileUpdated={(updatedProfile) => {
                            // handle updated profile, maybe refresh user info
                            setShowProfileModal(false);
                        }}
                    />
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1">
                <ul className="space-y-6 mt-7">
                    {/* Courses */}
                    <li className="pt-5 border-t border-gray-700">
                        <button
                            onClick={() => setActiveView("courses")}
                            className="flex items-center hover:text-blue-300 w-full"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12l9-5-9-5-9 5 9 5z" />
                            </svg>
                            {!collapsed && <span>Courses</span>}
                        </button>
                    </li>
                    {/* Enrollments */}
                    <li className="pt-5 border-t border-gray-700">
                        <button
                            onClick={() => setActiveView("enrollments")}
                            className="flex items-center hover:text-blue-300 w-full"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 mr-3 mt-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7V5a2 2 0 00-2-2h-3.5a2 2 0 00-2 2H11a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                            </svg>
                            {!collapsed && <span>Enrollments</span>}
                        </button>
                    </li>
                    {/* Lectures */}
                    <li className="pt-5 border-t border-gray-700">
                        <button
                            onClick={() => setActiveView("lectures")}
                            className="flex items-center hover:text-blue-300 w-full"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                            </svg>
                            {!collapsed && <span>Lectures</span>}
                        </button>
                    </li>
                    {/* Students */}
                    <li className="pt-5 border-t border-gray-700">
                        <button
                            onClick={() => setActiveView("students")}
                            className="flex items-center hover:text-blue-300 w-full"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {!collapsed && <span>Students</span>}
                        </button>
                    </li>
                    {/* Reports */}
                    <li className="pt-5 border-t border-b pb-5 border-gray-700">
                        <button
                            onClick={() => setActiveView("reports")}
                            className="flex items-center hover:text-blue-300 w-full"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6m4 6v-4m4 4v-2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19h14a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            {!collapsed && <span>Reports</span>}
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default TeacherSideBar;
