// client/src/components/TeacherCourses.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TeacherCourses = ({ teacherId, onBack }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchCourses() {
            if (!teacherId) return;
            try {
                const res = await axios.get(`${window.baseUrl}/api/courses/by-teacher`, {
                    params: { teacher_id: teacherId },
                });
                setCourses(res.data);
            } catch (error) {
                setMessage(error.response?.data?.error || 'Error fetching courses');
            } finally {
                setLoading(false);
            }
        }
        fetchCourses();
    }, [teacherId]);

    if (loading) return <div>Loading courses...</div>;

    return (
        <div className="p-4">
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
                &larr; Back
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Courses</h2>
            {message && <p className="text-red-500 mb-4">{message}</p>}
            {courses.length === 0 ? (
                <p className="text-gray-600">No courses found. Create one!</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {courses.map((course, index) => (
                        <div
                            key={course.id ? course.id : `${course.title}-${index}`}
                            className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1 cursor-pointer"
                            onClick={() => navigate(`/teacher-course/${course.id}`)}
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
                                        strokeWidth="2"
                                        d="M12 14l9-5-9-5-9 5 9 5z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 text-center">
                                {course.title}
                            </h4>
                            <p className="text-sm text-gray-500 text-center mt-2">
                                <span className="font-medium">{course.subject}</span>
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-4 mb-8">
                                {course.description ? course.description.split(" ").slice(0, 30).join(" ") + "..." : ''}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherCourses;
