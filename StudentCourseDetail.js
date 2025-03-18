// client/src/components/StudentCourseDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import {useAuth} from "../../context/AuthContext";

const StudentCourseDetail = () => {
    const { id } = useParams(); // course id
    const [course, setCourse] = useState(null);
    const navigate = useNavigate()
    const [ongoingLectures, setOngoingLectures] = useState([]);
    const [upcomingLectures, setUpcomingLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lecturesLoading, setLecturesLoading] = useState(true);
    const [error, setError] = useState('');
    const {user, role} = useAuth()

    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'teacher') {

                navigate('/teacher-dashboard');
            }
        }
    }, [user, loading, navigate, role]);

    // Fetch course details
    useEffect(() => {
        async function fetchCourse() {
            try {
                const res = await axios.get(`${window.baseUrl}/api/courses/${id}`);
                setCourse(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Error fetching course');
            } finally {
                setLoading(false);
            }
        }
        fetchCourse();
    }, [id]);

    // Function to fetch lectures for this course (ongoing and upcoming)
    const fetchLectures = useCallback(async () => {
        try {
            const ongoingRes = await axios.get(`${window.baseUrl}/api/lectures/ongoing`, {
                params: { course_id: id },
            });
            const upcomingRes = await axios.get(`${window.baseUrl}/api/lectures/upcoming`, {
                params: { course_id: id },
            });
            setOngoingLectures(ongoingRes.data);
            setUpcomingLectures(upcomingRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLecturesLoading(false);
        }
    }, [id]);

    // Fetch lectures when course id changes or on update
    useEffect(() => {
        if (id) {
            fetchLectures();
        }
    }, [id, fetchLectures]);

    // Realtime subscription for changes in the lectures table for this course.
    useEffect(() => {
        if (!id) return;
        const channel = supabase
            .channel(`realtime-lectures-${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lectures',
                    filter: `course_id=eq.${id}`,
                },
                (payload) => {
                    console.log('Realtime change received:', payload);
                    fetchLectures();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, fetchLectures]);

    // Helper to truncate text
    const truncateText = (text, wordLimit) => {
        const safeText = text || '';
        const words = safeText.split(' ');
        return words.length <= wordLimit ? safeText : words.slice(0, wordLimit).join(' ') + '...';
    };

    if (loading) return <div>Loading course details...</div>;
    if (error) return <div>{error}</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7">
                <h2 className="text-3xl font-bold text-gray-700 uppercase">{course.title}</h2>
                {/* Student view: no schedule button */}
            </div>
            <div className="text-gray-700 mb-4">
                <p className="mb-4">
                    <span className="font-semibold">Subject:</span> {course.subject}
                </p>
                <p className="mb-5 mt-4 max-w-5xl">
                    <span className="font-semibold">Description:</span> {course.description}
                </p>
            </div>

            {/* Lectures Sections */}
            <div className="flex flex-col md:flex-row gap-6 mt-10">
                {/* Ongoing Lectures */}
                <div className="flex-1 mt-24">
                    <div className="mb-6">
                        <h4 className="text-xl font-bold text-gray-700 mb-5">Ongoing Lectures</h4>
                        {lecturesLoading ? (
                            <p>Loading lectures...</p>
                        ) : ongoingLectures.length === 0 ? (
                            <p>No ongoing lectures.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-6">
                                {ongoingLectures.map((lecture) => (
                                    <div
                                        key={lecture.id}
                                        className="max-w-sm w-full min-h-56 p-4 mb-4 border border-gray-200 rounded-lg shadow hover:shadow-md transition bg-white cursor-pointer"
                                    >
                                        <div className="mb-4">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-10 w-10 text-green-500 mx-auto"
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
                                                    d="M12 12l9-5-9-5-9-5 9 5z"
                                                />
                                            </svg>
                                        </div>
                                        <h5 className="text-lg font-bold text-gray-800 text-center">
                                            {lecture.title}
                                        </h5>
                                        <p className="text-xs text-gray-500 text-center mt-1">
                                            {truncateText(lecture.description, 12)}
                                        </p>
                                        <p className="text-xs text-gray-600 text-center mt-2">
                                            Started at: {new Date(lecture.started_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Lectures */}
                <div className="flex-1 mt-24">
                    <h4 className="text-xl font-bold text-gray-700 mb-5">Upcoming Lectures</h4>
                    {lecturesLoading ? (
                        <p>Loading lectures...</p>
                    ) : upcomingLectures.length === 0 ? (
                        <p>No upcoming lectures.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            {upcomingLectures.map((lecture) => (
                                <div
                                    key={lecture.id}
                                    className="max-w-sm w-full min-h-56 p-4 mb-4 border border-gray-200 rounded-lg shadow hover:shadow-md transition bg-white cursor-pointer"
                                >
                                    <div className="mb-4">
                                        {/* Calendar icon for upcoming lectures */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-10 w-10 text-blue-500 mx-auto"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10m-11 4h12a2 2 0 002-2V7a2 2 0 00-2-2h-3m-4 0H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-3"
                                            />
                                        </svg>
                                    </div>
                                    <h5 className="text-lg font-bold text-gray-800 text-center">
                                        {lecture.title}
                                    </h5>
                                    <p className="text-xs text-gray-500 text-center mt-1">
                                        {truncateText(lecture.description, 12)}
                                    </p>
                                    <p className="text-xs text-gray-600 text-center mt-2">
                                        Scheduled at: {new Date(lecture.scheduled_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentCourseDetail;
