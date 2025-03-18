import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StudentSearchCourses = () => {
    const { user, loading } = useAuth();
    const [query, setQuery] = useState('');
    const [courses, setCourses] = useState([]);
    const [message, setMessage] = useState('');
    const [enrollments, setEnrollments] = useState([]);

    // Fetch student's enrollments on mount and after enrollment requests.
    useEffect(() => {
        if (!user) return;
        const timer = setTimeout(() => {
            axios
                .get(`${window.baseUrl}/api/enrollments/student`, {
                    params: { student_id: user.id },
                })
                .then((res) => {
                    setEnrollments(res.data);
                })
                .catch((error) => {
                    // console.error('Error fetching enrollments:', error);
                });
        }, 300); // delay 300ms to ensure user data is loaded

        return () => clearTimeout(timer);
    }, [user]);

    // Debounce the search query and fetch courses as the user types.
    useEffect(() => {
        if (!query) {
            setCourses([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            axios
                .get(`${window.baseUrl}/api/courses/search`, {
                    params: { q: query },
                })
                .then((res) => {
                    setCourses(res.data);
                    setMessage('');
                })
                .catch((error) => {
                    setMessage(error.response?.data?.error || 'Error searching courses');
                });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const requestEnrollment = async (courseId) => {
        try {
            await axios.post(`${window.baseUrl}/api/enrollments`, {
                course_id: courseId,
                student_id: user.id,
            });
            setMessage('Enrollment request sent!');
            // Refresh enrollments after a successful request.
            axios
                .get(`${window.baseUrl}/api/enrollments/student`, {
                    params: { student_id: user.id },
                })
                .then((res) => {
                    setEnrollments(res.data);
                });
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error requesting enrollment');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Please login to search for courses.</div>;

    // Helper function to check enrollment status for a given course.
    const getEnrollmentStatus = (courseId) => {
        const enrollment = enrollments.find((enr) => enr.courses.id === courseId);
        if (!enrollment) return null;
        return enrollment.status; // 'pending' or 'approved'
    };

    // Helper to truncate text to a given word limit.
    const truncateText = (text, wordLimit) => {
        const words = text.split(' ');
        return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
    };

    return (
        <div className="p-6 mb-8 mt-5">
            <div className="mx-auto">
                <input
                    type="text"
                    placeholder="Enter course title or subject"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {message && <p className="text-red-500 mb-4">{message}</p>}
                <div className="space-y-4">
                    {courses.length === 0 ? (
                        <p className="text-gray-500"></p>
                    ) : (
                        courses.map((course) => {
                            const enrollmentStatus = getEnrollmentStatus(course.id);
                            return (
                                <div
                                    key={course.id}
                                    className="flex items-center p-5 border border-gray-200 rounded-lg shadow hover:shadow-lg transition duration-150 bg-white"
                                >
                                    {/* SVG Icon */}
                                    <div className="flex-shrink-0 mr-4">
                                        <svg
                                            className="w-12 h-12 text-blue-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 14l9-5-9-5-9 5 9 5z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z"
                                            />
                                        </svg>
                                    </div>
                                    {/* Course details */}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
                                        <div className="flex items-center text-sm text-gray-600 mt-1">
                                            <svg
                                                className="w-4 h-4 text-blue-500 mr-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
                                            </svg>
                                            <span>
                        Subject: <span className="font-medium">{course.subject}</span>
                      </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600 mt-1">
                                            <svg
                                                className="w-4 h-4 text-green-500 mr-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            <span>
                        Teacher: <span className="font-medium">{course.teacher_name || "Unknown Teacher"}</span>
                      </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {truncateText(course.description, 30)}
                                        </p>
                                    </div>
                                    {/* Enrollment button/status */}
                                    <div className="ml-4">
                                        {enrollmentStatus ? (
                                            <div className="border border-blue-500 text-blue-500 font-semibold px-4 py-2 rounded-md">
                                                {enrollmentStatus === 'pending' ? 'Pending Enrollment' : 'Enrolled'}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => requestEnrollment(course.id)}
                                                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition"
                                            >
                                                Request Enrollment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentSearchCourses;
