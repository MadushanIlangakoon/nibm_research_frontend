import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Outlet, useNavigate, useOutlet } from 'react-router-dom';
import TeacherEnrollmentRequests from "./TeacherEnrollmentRequests";
import TeacherSideBar from "./TeacherSideBar";

const TeacherDashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const outlet = useOutlet(); // Check if a nested route is active
    const [courseForm, setCourseForm] = useState({
        subject: '',
        title: '',
        description: '',
    });
    const [message, setMessage] = useState('');
    const [courses, setCourses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [teacherName, setTeacherName] = useState('');
    const [teacherId, setTeacherId] = useState(null); // new state for teacher id

    // Define fetchCourses so it can be used both on mount and by realtime subscription
    const fetchCourses = useCallback(async () => {
        if (user && user.id) {
            // First, fetch teacher details from supabase
            const { data: teacherRow, error: teacherError } = await supabase
                .from('teachers')
                .select('id, name')
                .eq('auth_id', user.id)
                .single();
            if (teacherError || !teacherRow) {
                console.error("Teacher lookup error:", teacherError);
                return;
            }
            setTeacherName(teacherRow.name || user.name || "User Name");
            setTeacherId(teacherRow.id); // save teacher id for realtime subscription

            // Then, fetch courses via your API
            try {
                const res = await axios.get('https://nibm-research-backend.onrender.com/api/courses/by-teacher', {
                    params: { teacher_id: teacherRow.id },
                });
                setCourses(res.data);
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        }
    }, [user]);

    // Fetch courses on mount
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Setup Supabase realtime subscription for courses for this teacher
    useEffect(() => {
        if (!teacherId) return;

        const coursesChannel = supabase
            .channel(`courses-channel-${teacherId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'courses', filter: `teacher_id=eq.${teacherId}` },
                (payload) => {
                    console.log('Realtime course INSERT received:', payload);
                    fetchCourses();
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'courses', filter: `teacher_id=eq.${teacherId}` },
                (payload) => {
                    console.log('Realtime course UPDATE received:', payload);
                    fetchCourses();
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'courses', filter: `teacher_id=eq.${teacherId}` },
                (payload) => {
                    console.log('Realtime course DELETE received:', payload);
                    fetchCourses();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(coursesChannel);
        };
    }, [teacherId, fetchCourses]);


    // Helper: Truncate text to word limit
    const truncateText = (text, wordLimit) => {
        const safeText = text || '';
        const words = safeText.split(' ');
        return words.length <= wordLimit ? safeText : words.slice(0, wordLimit).join(' ') + '...';
    };

    const createCourse = async (e) => {
        e.preventDefault();
        try {
            const { data: teacherRow, error: teacherError } = await supabase
                .from('teachers')
                .select('id, name')
                .eq('auth_id', user.id)
                .single();

            if (teacherError || !teacherRow) {
                throw new Error('Unable to find teacher row for this user.');
            }

            // Post new course to your backend
            const res = await axios.post('https://nibm-research-backend.onrender.com/api/courses/create-course', {
                teacher_id: teacherRow.id,
                teacher_name: teacherRow.teacherName, // include teacher name
                subject: courseForm.subject,
                title: courseForm.title,
                description: courseForm.description,
            });

            setMessage('Course created successfully');
            // Instead of manually appending, re-fetch courses (the realtime subscription should also catch this)
            await fetchCourses();
            setCourseForm({ subject: '', title: '', description: '' });
            setShowForm(false);
        } catch (error) {
            console.error("Axios error:", error);
            setMessage(error.response?.data?.error || 'Error creating course');
        }
    };

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        else if (hour < 18) return "Good Afternoon";
        else return "Good Evening";
    }

    if (loading) return <div>Loading...</div>;
    if (!user || !user.id) {
        return <div>Please login to access the dashboard.</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 sticky top-0 h-screen">
                <aside className="w-64 bg-white shadow-md">
                    <TeacherSideBar />
                </aside>
            </div>
            {/* Main Content */}
            <main className="flex-1 ml-12 mt-5">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    {getGreeting()}, {teacherName}
                </h2>

                {/* If a nested route is active, render only the Outlet */}
                {outlet ? (
                    <Outlet />
                ) : (
                    <>
                        {/* Create Course Section */}
                        <div className="mb-8">
                            {!showForm ? (
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                                    >
                                        Create a New Course
                                    </button>
                                </div>
                            ) : (
                                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
                                    <div className="flex items-center justify-center mb-6">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-10 w-10 text-blue-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 14l9-5-9-5-9 5 9 5z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z"
                                            />
                                        </svg>
                                        <h2 className="text-3xl font-bold text-gray-800 ml-3">Create Course</h2>
                                    </div>
                                    <form onSubmit={createCourse} className="space-y-6">
                                        <div>
                                            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
                                            <input
                                                id="subject"
                                                type="text"
                                                placeholder="Enter subject"
                                                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                value={courseForm.subject}
                                                onChange={(e) => setCourseForm({ ...courseForm, subject: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</label>
                                            <input
                                                id="title"
                                                type="text"
                                                placeholder="Enter title"
                                                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                value={courseForm.title}
                                                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Description</label>
                                            <textarea
                                                id="description"
                                                placeholder="Enter description"
                                                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                value={courseForm.description}
                                                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <button
                                                type="submit"
                                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                                            >
                                                Create Course
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg shadow-lg transition-all duration-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {message && <p className="text-green-600 text-center mb-4">{message}</p>}

                        {/* Your Courses Section */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Courses</h3>
                            {courses.length === 0 ? (
                                <p className="text-gray-600">No courses found. Create one!</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ">
                                    {courses.map((course, index) => (
                                        <div
                                            key={course.id ? course.id : `${course.title}-${index}`}
                                            className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1 cursor-pointer"
                                            onClick={() => navigate(`teacher-course/${course.id}`)}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-10 w-10 text-blue-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 14l9-5-9-5-9 5 9 5z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z"
                                                    />
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-700 text-center">{course.title}</h4>
                                            <p className="text-sm text-gray-500 text-center mt-2">
                                                <span className="font-medium">{course.subject}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 text-center mt-4 mb-8">
                                                {truncateText(course.description || '', 30)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <TeacherEnrollmentRequests />
                    </>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
