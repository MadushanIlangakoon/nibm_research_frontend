import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Helper: Truncate text to a given word limit.
const truncateText = (text, wordLimit) => {
    const words = text.split(' ');
    return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
};

const Lectures = ({ studentId, user, onBack }) => {
    const [approvedEnrollments, setApprovedEnrollments] = useState([]);
    const [ongoingLectures, setOngoingLectures] = useState([]);
    const [upcomingLectures, setUpcomingLectures] = useState([]);
    const [pastLectures, setPastLectures] = useState([]);
    const [message, setMessage] = useState('');

    // Fetch approved enrollments first (so we know which courses the student is in)
    const fetchEnrollments = useCallback(async () => {
        if (!user || !studentId) return;
        try {
            const res = await axios.get('https://nibm-research-backend.onrender.com/api/enrollments/student', {
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

    // Fetch lectures for approved courses
    useEffect(() => {
        async function fetchLectures() {
            if (!approvedEnrollments.length) return;
            try {
                // Extract course IDs from approved enrollments
                const courseIds = approvedEnrollments.map((enr) => enr.courses.id);
                // Create promises for ongoing, upcoming, and past lectures
                const ongoingPromises = courseIds.map((courseId) =>
                    axios.get('https://nibm-research-backend.onrender.com/api/lectures/ongoing', { params: { course_id: courseId } })
                );
                const upcomingPromises = courseIds.map((courseId) =>
                    axios.get('https://nibm-research-backend.onrender.com/api/lectures/upcoming', { params: { course_id: courseId } })
                );
                const pastPromises = courseIds.map((courseId) =>
                    axios.get('https://nibm-research-backend.onrender.com/api/lectures/past', { params: { course_id: courseId } })
                );
                const ongoingResults = await Promise.all(ongoingPromises);
                const upcomingResults = await Promise.all(upcomingPromises);
                const pastResults = await Promise.all(pastPromises);

                setOngoingLectures(ongoingResults.flatMap((res) => res.data));
                setUpcomingLectures(upcomingResults.flatMap((res) => res.data));
                setPastLectures(pastResults.flatMap((res) => res.data));
            } catch (error) {
                console.error('Error fetching lectures:', error);
            }
        }
        fetchLectures();
    }, [approvedEnrollments]);

    return (
        <div>
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
                &larr; Back
            </button>
            <h2 className="text-2xl font-bold mb-4">Lectures</h2>

            {/* Ongoing Lectures */}
            <h3 className="text-xl font-semibold mb-2">Ongoing Lectures</h3>
            {ongoingLectures.length === 0 ? (
                <p className="text-gray-500">No ongoing lectures.</p>
            ) : (
                <div className="space-y-4">
                    {ongoingLectures.map((lecture) => (
                        <div
                            key={lecture.id}
                            className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-md transition"
                        >
                            <div className="mr-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 text-green-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 20l9-5-9-5-9 5 9 5z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-800">{lecture.title}</h4>
                                <p className="text-sm text-gray-600"><strong>{lecture.teacher_name}</strong></p>
                                <p className="text-xs text-gray-500">{truncateText(lecture.description, 12)}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Started: {new Date(lecture.started_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upcoming Lectures */}
            <h3 className="text-xl font-semibold mt-8 mb-2">Upcoming Lectures</h3>
            {upcomingLectures.length === 0 ? (
                <p className="text-gray-500">No upcoming lectures.</p>
            ) : (
                <div className="space-y-4">
                    {upcomingLectures.map((lecture) => (
                        <div
                            key={lecture.id}
                            className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-md transition"
                        >
                            <div className="mr-4">
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-800">{lecture.title}</h4>
                                <p className="text-sm text-gray-600"><strong>{lecture.teacher_name}</strong></p>
                                <p className="text-xs text-gray-500">{truncateText(lecture.description, 12)}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Scheduled: {new Date(lecture.scheduled_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Past Lectures */}
            <h3 className="text-xl font-semibold mt-8 mb-2">Past Lectures</h3>
            {pastLectures.length === 0 ? (
                <p className="text-gray-500">No past lectures.</p>
            ) : (
                <div className="space-y-4">
                    {pastLectures.map((lecture) => (
                        <div
                            key={lecture.id}
                            className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-md transition"
                        >
                            <div className="mr-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-800">{lecture.title}</h4>
                                <p className="text-sm text-gray-600"><strong>{lecture.teacher_name}</strong></p>
                                <p className="text-xs text-gray-500">{truncateText(lecture.description, 12)}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Ended: {new Date(lecture.ended_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {message && <p className="text-red-500 mt-4">{message}</p>}
        </div>
    );
};

export default Lectures;
