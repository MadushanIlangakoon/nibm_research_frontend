// client/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

const Sidebar = () => {
    const { user } = useAuth();
    const [teacherName, setTeacherName] = useState('');

    // Fetch teacher's name from Supabase based on the authenticated user's id.
    useEffect(() => {
        async function fetchTeacher() {
            if (user && user.id) {
                const { data, error } = await supabase
                    .from('teachers')
                    .select('name')
                    .eq('auth_id', user.id)
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

    // Determine the profile image. Priority: use Supabase avatar URL if exists, otherwise choose a placeholder.
    const profileImage = user?.user_metadata?.avatar_url
        ? user.user_metadata.avatar_url
        : (user && user.gender && user.gender.toLowerCase() === 'female'
            ? '/TeacherFemalePlaceholder.webp'
            : '/TeacherMalePlaceholder.webp');

    return (
        <div className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-8">
                <img
                    className="w-20 h-20 rounded-full object-cover"
                    src={profileImage}
                    alt="Profile"
                />
                <p className="mt-4 text-lg font-bold">
                    {teacherName || "User Name"}
                </p>
                <p className="text-sm">
                    {user?.email || "user@example.com"}
                </p>
                <Link to="/profile" className="mt-2 text-blue-400 hover:underline">
                    View Profile
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1">
                <ul className="space-y-6 mt-7">
                    {/* Courses */}
                    <li className="pt-2 border-t border-gray-700">
                        <Link to="/courses" className="flex items-center hover:text-blue-300">
                            {/* Book/education icon */}
                            <svg className="w-5 h-5 mr-3 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M12 20l9-5-9-5-9 5 9 5z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M12 12l9-5-9-5-9 5 9 5z"/>
                            </svg>
                            <span className="mt-3">Courses</span>
                        </Link>
                    </li>
                    {/* Enrollments */}
                    <li className="pt-2 border-t border-gray-700">
                        <Link to="/enrollments" className="flex items-center hover:text-blue-300">
                            {/* Clipboard icon */}
                            <svg className="w-5 h-5 mr-3 mt-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-3-3v6"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M20 7V5a2 2 0 00-2-2h-3.5a2 2 0 00-2 2H11a2 2 0 00-2-2H5a2 2 0 00-2 2v2"/>
                            </svg>
                            <span className="mt-3">Enrollments</span>
                        </Link>
                    </li>
                    {/* Lectures */}
                    <li className="pt-2 border-t border-gray-700">
                        <Link to="/lectures" className="flex items-center hover:text-blue-300">
                            {/* Video Camera icon */}
                            <svg className="w-5 h-5 mr-3 mt-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"/>
                            </svg>
                            <span className="mt-3">Lectures</span>
                        </Link>
                    </li>
                    {/* Teachers */}
                    <li className="pt-2 border-t border-gray-700">
                        <Link to="/teachers" className="flex items-center hover:text-blue-300">
                            {/* User Group icon */}
                            <svg className="w-5 h-5 mr-3 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m13-7a4 4 0 11-8 0 4 4 0 018 0zM7 4a4 4 0 100 8 4 4 0 000-8z"/>
                            </svg>
                            <span className="mt-3">Students</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
