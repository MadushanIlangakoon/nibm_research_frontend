// client/src/components/TeacherCourseDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeacherLectureForm from './TeacherLectureForm';
import { useAuth } from '../../context/AuthContext';
import TestQuestionDialog from "./TestQuestionDialog";
import { supabase } from '../../supabaseClient';

const TeacherCourseDetail = () => {
    const { id } = useParams(); // course id from route parameter
    const { user, role } = useAuth();
    const [course, setCourse] = useState(null);
    const [ongoingLectures, setOngoingLectures] = useState([]);
    const [upcomingLectures, setUpcomingLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lecturesLoading, setLecturesLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [showLectureDialog, setShowLectureDialog] = useState(false);
    const [showTestQuestionDialog, setShowTestQuestionDialog] = useState(false);
    const [showLectureFormModal, setShowLectureFormModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'student') {

                navigate('/student-dashboard');
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
            .channel(`public:lectures:course_id=eq.${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7">
                    <h2 className="text-3xl  font-bold text-gray-700 uppercase">{course.title}</h2>
                    <button
                        onClick={() => setShowLectureFormModal(true)}
                        className="mt-4 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
                    >
                        Schedule a Lecture
                    </button>
                </div>
                <div className="text-gray-700 mb-4">
                    <p className="mb-4">
                        <span className="font-semibold">Subject:</span> {course.subject}
                    </p>
                    <p className="mb-5 mt-4 max-w-5xl">
                        <span className="font-semibold ">Description:</span> {course.description}
                    </p>
                </div>


            {/* Ongoing and Upcoming Lectures Sections */}
            <div className="flex flex-col md:flex-row gap-6 mt-18">
                <div className="flex-1">
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
                                        onClick={() => {
                                            setSelectedLecture(lecture);
                                            setShowLectureDialog(true);
                                        }}
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
                                                    d="M12 20l9-5-9-5-9-5 9 5z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 12l9-5-9-5-9-5 9 5z"
                                                />
                                            </svg>
                                        </div>
                                        <h5 className="text-lg font-bold text-gray-800 text-center">{lecture.title}</h5>
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

                <div className="flex-1">
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
                                    onClick={() => {
                                        setSelectedLecture(lecture);
                                        setShowLectureDialog(true);
                                    }}
                                >
                                    <div className="mb-4">
                                        {/* Calendar Icon for upcoming lectures */}
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
                                    <h5 className="text-lg font-bold text-gray-800 text-center">{lecture.title}</h5>
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


            {/* Modal for lecture actions (ongoing/upcoming lectures) */}
            {showLectureDialog && selectedLecture && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-2">{selectedLecture.title}</h3>
                        <p className="mb-2">{selectedLecture.description}</p>
                        {selectedLecture.started_at ? (
                            <>
                                <p className="mb-4">
                                    Scheduled at: {new Date(selectedLecture.scheduled_at).toLocaleString()}
                                </p>
                                <p className="mb-4">Do you want to join this lecture?</p>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowLectureDialog(false)}
                                        className="mr-2 px-4 py-2 bg-gray-300 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => navigate(`/lecture/${selectedLecture.id}`)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded"
                                    >
                                        Join the Room
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                            <p className="mb-4">
                                Scheduled at: {new Date(selectedLecture.scheduled_at).toLocaleString()}
                                </p>
                                <div className="flex justify-between mt-4 space-x-4">
                                    <button
                                        onClick={() => setShowTestQuestionDialog(true)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                    >
                                        Add Test Questions
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await axios.post(`${window.baseUrl}/api/lectures/update`, {
                                                    lecture_id: selectedLecture.id,
                                                    started_at: new Date().toISOString(),
                                                });
                                                // Refresh lectures if needed
                                                fetchLectures();
                                                setShowLectureDialog(false);
                                            } catch (err) {
                                                console.error("Error starting lecture:", err);
                                            }
                                        }}
                                        className="bg-green-500 text-white px-4 py-2 rounded"
                                    >
                                        Start Lecture
                                    </button>

                                        <button
                                            onClick={() => setShowLectureDialog(false)}
                                            className="px-4 py-2 border rounded"
                                        >
                                            Close
                                        </button>

                                </div>
                            </>
                        )}

                    </div>
                </div>
            )}

            {/* Modal for scheduling a lecture */}
            {showLectureFormModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-2">Schedule a Lecture</h3>
                        <TeacherLectureForm
                            course_id={course.id}
                            user={user}
                            onClose={() => setShowLectureFormModal(false)}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowLectureFormModal(false)}
                                className="px-4 py-2 border rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Question Dialog (if opened separately) */}
            {showTestQuestionDialog && (
                <TestQuestionDialog
                    lectureId={selectedLecture ? selectedLecture.id : null}
                    onClose={() => setShowTestQuestionDialog(false)}
                    onQuestionAdded={(newQuestion) => {
                        console.log("New test question added:", newQuestion);
                    }}
                />
            )}
        </div>
    );
};

export default TeacherCourseDetail;
