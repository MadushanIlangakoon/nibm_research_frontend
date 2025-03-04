import React, { useState, useEffect, useCallback } from 'react';
import StudentSearchCourses from './StudentSearchCourses';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import StudentLectureDetailModal from './StudentLectureDetailModal';

// Helper function: Truncate text
const truncateText = (text, wordLimit) => {
    const words = text.split(' ');
    return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
};

const MainDashboard = ({ user }) => {
    const [pendingEnrollments, setPendingEnrollments] = useState([]);
    const [approvedEnrollments, setApprovedEnrollments] = useState([]);
    const [ongoingLectures, setOngoingLectures] = useState([]);
    const [upcomingLectures, setUpcomingLectures] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [showLectureModal, setShowLectureModal] = useState(false);


    const studentId = user && (user.auth_id || user.id);

    // Fetch student's enrollments
    const fetchEnrollments = useCallback(async () => {
        if (!user || !studentId) return;
        try {
            const res = await axios.get('https://nibm-research-backend.onrender.com/api/enrollments/student', {
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

    // Fetch lectures for approved courses
    useEffect(() => {
        async function fetchLectures() {
            if (!approvedEnrollments.length) return;
            try {
                const courseIds = approvedEnrollments.map(enr => enr.courses.id);
                const ongoingPromises = courseIds.map(courseId =>
                    axios.get('https://nibm-research-backend.onrender.com/api/lectures/ongoing', { params: { course_id: courseId } })
                );
                const upcomingPromises = courseIds.map(courseId =>
                    axios.get('https://nibm-research-backend.onrender.com/api/lectures/upcoming', { params: { course_id: courseId } })
                );
                const ongoingResults = await Promise.all(ongoingPromises);
                const upcomingResults = await Promise.all(upcomingPromises);
                setOngoingLectures(ongoingResults.flatMap(res => res.data));
                setUpcomingLectures(upcomingResults.flatMap(res => res.data));
            } catch (error) {
                console.error('Error fetching lectures:', error);
            }
        }
        fetchLectures();
    }, [approvedEnrollments]);

    // Supabase realtime subscription for enrollments
    useEffect(() => {
        if (!user || !studentId) return;
        const enrollmentChannel = supabase
            .channel('enrollments-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'enrollments',
                    filter: `student_id=eq.${studentId}`,
                },
                (payload) => {
                    console.log('Realtime enrollment update:', payload);
                    fetchEnrollments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(enrollmentChannel);
        };
    }, [user, studentId, fetchEnrollments]);

    return (
        <>


            {/* Lectures Section */}
            <div className="mb-2 p-4 mt-12 ">
                <div className="flex items-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 text-blue-500 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                        />
                    </svg>
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-700">Your Lectures</h3>
                        <p className="text-sm text-gray-500">
                            Stay updated with live sessions and upcoming classes
                        </p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Ongoing Lectures */}
                    <div className="flex-1 p-4">
                        <h4 className="text-xl font-bold text-gray-700 mb-5">Ongoing Lectures</h4>
                        {ongoingLectures.length === 0 ? (
                            <p className="text-gray-500 text-sm">No ongoing lectures.</p>
                        ) : (
                            ongoingLectures.map(lecture => (
                                <div
                                    onClick={() => {
                                        setSelectedLecture(lecture);
                                        setShowLectureModal(true);
                                    }}
                                    key={lecture.id}
                                    className="flex items-center p-4 mb-4 border border-gray-200 rounded-lg shadow hover:shadow-md transition bg-white"
                                >
                                    <div className="flex-shrink-0 mr-4">
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
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 12l9-5-9-5-9 5 9 5z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-lg font-bold text-gray-800">{lecture.title}</h5>
                                        <p className="text-sm text-gray-600">
                                            <strong>{lecture.teacher_name}</strong>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {truncateText(lecture.description, 12)}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-2">
                                            Started at: {new Date(lecture.started_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Upcoming Lectures */}
                    <div className="flex-1 p-4">
                        <h4 className="text-xl font-bold text-gray-700 mb-5">Upcoming Lectures</h4>
                        {upcomingLectures.length === 0 ? (
                            <p className="text-gray-500 text-sm">No upcoming lectures.</p>
                        ) : (
                            upcomingLectures.map(lecture => (
                                <div
                                    key={lecture.id}
                                    className="flex items-center p-4 mb-4 border border-gray-200 rounded-lg shadow hover:shadow-md transition bg-white"
                                >
                                    <div className="flex-shrink-0 mr-4">
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
                                    <div className="flex-1">
                                        <h5 className="text-lg font-bold text-gray-800">{lecture.title}</h5>
                                        <p className="text-sm text-gray-600">
                                            <strong>{lecture.teacher_name}</strong>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {truncateText(lecture.description, 12)}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-2">
                                            Scheduled at: {new Date(lecture.scheduled_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Student Search Courses */}
            <div>
                <StudentSearchCourses />
            </div>

            {/* Pending Enrollments Section */}
            <div className="mb-8 pl-8">
                <div className="flex items-center mb-3">
                    <svg
                        className="w-6 h-6 text-blue-500 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 ml-2 mb-3">
                        Pending Course Enrollments
                    </h3>
                </div>
                {pendingEnrollments.length === 0 ? (
                    <p className="text-gray-500 text-sm ml-8 mb-3">No pending enrollment requests.</p>
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
            </div>

            {/* My Courses Section */}
            <div className="mb-12 pl-8 pt-4">
                <div className="flex items-center mb-4">
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
                    <h3 className="text-xl font-semibold text-gray-700 ml-3">My Courses</h3>
                </div>
                {approvedEnrollments.length === 0 ? (
                    <p className="text-gray-500">No approved courses.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {approvedEnrollments.map(enrollment => (
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
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            {showLectureModal && selectedLecture && (
                <StudentLectureDetailModal
                    lecture={selectedLecture}
                    onClose={() => setShowLectureModal(false)}
                />
            )}

        </>

    );
};

export default MainDashboard;
