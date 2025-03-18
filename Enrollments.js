import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Helper: Truncate text to a given word limit
const truncateText = (text, wordLimit) => {
    const words = text.split(' ');
    return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
};

const Enrollments = ({ studentId, user, onBack }) => {
    const [pendingEnrollments, setPendingEnrollments] = useState([]);
    const [approvedEnrollments, setApprovedEnrollments] = useState([]);
    const [message, setMessage] = useState('');


    const fetchEnrollments = useCallback(async () => {
        if (!user || !studentId) return;
        try {
            const res = await axios.get(`${window.baseUrl}/api/enrollments/student`, {
                params: { student_id: studentId },
            });
            const pending = res.data.filter(enrollment => enrollment.status === 'pending');
            const approved = res.data.filter(enrollment => enrollment.status === 'approved');
            setPendingEnrollments(pending);
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
            <h2 className="text-2xl font-bold mb-4">Enrollments</h2>

            <h3 className="text-xl font-semibold mb-2">Pending Enrollments</h3>
            {pendingEnrollments.length === 0 ? (
                <p className="text-gray-500">No pending enrollment requests.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {pendingEnrollments.map(enrollment => (
                        <div
                            key={enrollment.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1"
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-md font-bold text-gray-800 text-center mb-1">
                                {enrollment.courses.title}
                            </h4>
                            <p className="text-xs text-gray-600 text-center">
                <span className="font-medium">
                  {enrollment.courses.teacher_name || "Unknown Teacher"}
                </span> - {enrollment.courses.subject}
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-1">
                                {truncateText(enrollment.courses.description, 30)}
                            </p>
                            <div className="mt-2 text-center">
                <span className="text-xs text-blue-500 font-medium uppercase">
                  {enrollment.status}
                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h3 className="text-xl font-semibold mt-8 mb-2">Approved Enrollments</h3>
            {approvedEnrollments.length === 0 ? (
                <p className="text-gray-500">No approved enrollments.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {approvedEnrollments.map(enrollment => (
                        <div
                            key={enrollment.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1"
                        >
                            <div className="flex justify-center mb-2">
                                <svg
                                    className="w-8 h-8 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-md font-bold text-gray-800 text-center mb-1">
                                {enrollment.courses.title}
                            </h4>
                            <p className="text-xs text-gray-600 text-center">
                <span className="font-medium">
                  {enrollment.courses.teacher_name || "Unknown Teacher"}
                </span> - {enrollment.courses.subject}
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-1">
                                {truncateText(enrollment.courses.description, 30)}
                            </p>
                            <div className="mt-2 text-center">
                <span className="text-xs text-green-500 font-medium uppercase">
                  {enrollment.status}
                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {message && <p className="text-red-500 mt-4">{message}</p>}
        </div>
    );
};

export default Enrollments;
