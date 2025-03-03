// client/src/components/StudentCourseDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';



const StudentCourseDetail = () => {
    const { id } = useParams(); // course id
    const [course, setCourse] = useState(null);
    const [ongoingLectures, setOngoingLectures] = useState([]);
    const [upcomingLectures, setUpcomingLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lecturesLoading, setLecturesLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch course details
// Fetch course details
    useEffect(() => {
        async function fetchCourse() {
            try {
                const res = await axios.get(`https://nibm-research-backend.onrender.com/api/courses/${id}`);
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
            const ongoingRes = await axios.get('https://nibm-research-backend.onrender.com/api/lectures/ongoing', {
                params: { course_id: id },
            });
            const upcomingRes = await axios.get('https://nibm-research-backend.onrender.com/api/lectures/upcoming', {
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
        const subscription = supabase
            .from(`lectures:course_id=eq.${id}`)
            .on('*', (payload) => {
                console.log('Realtime change received:', payload);
                fetchLectures();
            })
            .subscribe();

        return () => {
            supabase.removeSubscription(subscription);
        };
    }, [id, fetchLectures]);

    if (loading) return <div>Loading course details...</div>;
    if (error) return <div>{error}</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
            <p className="mb-2"><strong>Subject:</strong> {course.subject}</p>
            <p className="mb-4"><strong>Description:</strong> {course.description}</p>

            <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Ongoing Lectures</h3>
                {lecturesLoading ? (
                    <p>Loading lectures...</p>
                ) : ongoingLectures.length === 0 ? (
                    <p>No ongoing lectures.</p>
                ) : (
                    ongoingLectures.map((lecture) => (
                        <div key={lecture.id} className="border p-4 mb-2">
                            <h4 className="font-bold">{lecture.title}</h4>
                            <p>{lecture.description}</p>
                            <Link to={`${lecture.video_call_url}`} className="text-blue-500 hover:underline">
                                Join Lecture
                            </Link>
                        </div>
                    ))
                )}
            </div>

            <div>
                <h3 className="text-xl font-bold mb-2">Upcoming Lectures</h3>
                {lecturesLoading ? (
                    <p>Loading lectures...</p>
                ) : upcomingLectures.length === 0 ? (
                    <p>No upcoming lectures.</p>
                ) : (
                    upcomingLectures.map((lecture) => (
                        <div key={lecture.id} className="border p-4 mb-2">
                            <h4 className="font-bold">{lecture.title}</h4>
                            <p>{lecture.description}</p>
                            <p>Scheduled at: {new Date(lecture.scheduled_at).toLocaleString()}</p>
                            {/* Optionally allow joining if already started */}
                            {lecture.started_at ? (
                                <Link to={`${lecture.video_call_url}`} className="text-blue-500 hover:underline">
                                    Join Lecture student
                                </Link>
                            ) : (
                                <p>Lecture not started</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentCourseDetail;
