import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Helper: Truncate text to a given word limit
const truncateText = (text, wordLimit) => {
    const words = text.split(' ');
    return words.length <= wordLimit
        ? text
        : words.slice(0, wordLimit).join(' ') + '...';
};

const Courses = ({ studentId, user, onBack }) => {
    const [approvedEnrollments, setApprovedEnrollments] = useState([]);
    const [message, setMessage] = useState('');


    // Fetch approved enrollments (courses)
    const fetchEnrollments = useCallback(async () => {
        if (!user || !studentId) return;
        try {
            const res = await axios.get(`${window.baseUrl}/api/enrollments/student`, {
                params: { student_id: studentId },
            });
            const approved = res.data.filter(
                (enrollment) => enrollment.status === 'approved'
            );
            setApprovedEnrollments(approved);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error fetching enrollments');
        }
    }, [user, studentId]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    return (
        <div>
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
                &larr; Back
            </button>
            <h2 className="text-2xl font-bold mb-4">My Courses</h2>
            {approvedEnrollments.length === 0 ? (
                <p className="text-gray-500">No approved courses.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {approvedEnrollments.map((enrollment) => (
                        <Link
                            key={enrollment.id}
                            to={`/student-course/${enrollment.courses.id}`}
                            className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1"
                        >
                            <div className="flex justify-center mb-2">
                                <svg
                                    className="w-8 h-8 text-blue-500"
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
                                        d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.083 12.083 0 015.84 10.578L12 14z"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-md font-bold text-gray-800 text-center mb-1">
                                {enrollment.courses.title}
                            </h4>
                            <p className="text-xs text-gray-600 text-center">
                <span className="font-medium">
                  {enrollment.courses.teacher_name || 'Unknown Teacher'}
                </span>{' '}
                                - {enrollment.courses.subject}
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-1">
                                {truncateText(enrollment.courses.description, 30)}
                            </p>
                            <div className="mt-2 text-center">
                <span className="text-xs text-green-500 font-medium uppercase">
                  {enrollment.status}
                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {message && <p className="text-red-500 mt-4">{message}</p>}
        </div>
    );
};

export default Courses;
