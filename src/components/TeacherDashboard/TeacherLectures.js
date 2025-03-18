// client/src/components/TeacherLectures.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const TeacherLectures = ({ teacherId, onBack }) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [ongoingLectures, setOngoingLectures] = useState([]);
    const [upcomingLectures, setUpcomingLectures] = useState([]);
    const [pastLectures, setPastLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Helper: Truncate text to a given word limit.
    const truncateText = (text, wordLimit = 25) => {
        if (!text) return '';
        const words = text.split(' ');
        return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
    };

    // Fetch teacher's courses from Supabase
    const fetchTeacherCourses = useCallback(async () => {
        if (!teacherId) return;
        try {
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('id, title')
                .eq('teacher_id', teacherId);
            if (coursesError) {
                console.error('Error fetching teacher courses:', coursesError);
                setMessage('Error fetching courses');
            } else {
                setCourses(coursesData || []);
            }
        } catch (err) {
            console.error(err);
            setMessage('Error fetching courses');
        }
    }, [teacherId]);

    // Fetch lectures for all teacher courses and group them.
    const fetchLectures = useCallback(async () => {
        if (!courses || courses.length === 0) return;
        try {
            let ongoing = [];
            let upcoming = [];
            let past = [];

            for (let course of courses) {
                // For ongoing lectures:
                const ongoingRes = await axios.get(`${window.baseUrl}/api/lectures/ongoing`, {
                    params: { course_id: course.id },
                });
                // For upcoming lectures:
                const upcomingRes = await axios.get(`${window.baseUrl}/api/lectures/upcoming`, {
                    params: { course_id: course.id },
                });
                // For past lectures:
                const pastRes = await axios.get(`${window.baseUrl}/api/lectures/past`, {
                    params: { course_id: course.id },
                });
                // Merge course title into each lecture object.
                ongoing = ongoing.concat(
                    (ongoingRes.data || []).map((lec) => ({ ...lec, courseTitle: course.title }))
                );
                upcoming = upcoming.concat(
                    (upcomingRes.data || []).map((lec) => ({ ...lec, courseTitle: course.title }))
                );
                past = past.concat(
                    (pastRes.data || []).map((lec) => ({ ...lec, courseTitle: course.title }))
                );
            }

            setOngoingLectures(ongoing);
            setUpcomingLectures(upcoming);
            setPastLectures(past);
        } catch (error) {
            console.error('Error fetching lectures:', error);
            setMessage(error.response?.data?.error || 'Error fetching lectures');
        } finally {
            setLoading(false);
        }
    }, [courses]);

    useEffect(() => {
        if (teacherId) {
            fetchTeacherCourses();
        }
    }, [teacherId, fetchTeacherCourses]);

    useEffect(() => {
        if (courses.length > 0) {
            fetchLectures();
        }
    }, [courses, fetchLectures]);

    if (loading) return <div>Loading lectures...</div>;
    if (message) return <div className="text-red-500">{message}</div>;

    return (
        <div className="p-4">
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
                &larr; Back
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Lectures</h2>

            {/* Ongoing Lectures */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Ongoing Lectures</h3>
                {ongoingLectures.length === 0 ? (
                    <p className="text-gray-500">No ongoing lectures.</p>
                ) : (
                    <div className="space-y-4">
                        {ongoingLectures.map((lecture) => (
                            <div
                                key={lecture.id}
                                className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-md transition"
                                onClick={() => navigate(`/teacher-lecture/${lecture.id}`)}
                            >
                                <div className="mr-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-10 w-10 text-green-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">{lecture.title}</h4>
                                    <p className="text-sm text-gray-600">
                                        <strong>Course:</strong> {lecture.courseTitle}
                                    </p>
                                    <p className="text-xs text-gray-500">{truncateText(lecture.description, 25)}</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Started: {new Date(lecture.started_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Lectures */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Upcoming Lectures</h3>
                {upcomingLectures.length === 0 ? (
                    <p className="text-gray-500">No upcoming lectures.</p>
                ) : (
                    <div className="space-y-4">
                        {upcomingLectures.map((lecture) => (
                            <div
                                key={lecture.id}
                                className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-md transition"
                                onClick={() => navigate(`/teacher-lecture/${lecture.id}`)}
                            >
                                <div className="mr-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-10 w-10 text-blue-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">{lecture.title}</h4>
                                    <p className="text-sm text-gray-600">
                                        <strong>Course:</strong> {lecture.courseTitle}
                                    </p>
                                    <p className="text-xs text-gray-500">{truncateText(lecture.description, 25)}</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Scheduled: {new Date(lecture.scheduled_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Lectures */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Past Lectures</h3>
                {pastLectures.length === 0 ? (
                    <p className="text-gray-500">No past lectures.</p>
                ) : (
                    <div className="space-y-4">
                        {pastLectures.map((lecture) => (
                            <div
                                key={lecture.id}
                                className="flex items-center p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-md transition"
                                onClick={() => navigate(`/teacher-lecture/${lecture.id}`)}
                            >
                                <div className="mr-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-10 w-10 text-gray-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">{lecture.title}</h4>
                                    <p className="text-sm text-gray-600">
                                        <strong>Course:</strong> {lecture.courseTitle}
                                    </p>
                                    <p className="text-xs text-gray-500">{truncateText(lecture.description, 25)}</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Ended: {new Date(lecture.ended_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {message && <p className="text-red-500 mt-4">{message}</p>}
        </div>
    );
};

export default TeacherLectures;
