// client/src/components/TeacherCourseReports.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLectureStatistics from './TeacherLectureStatistics';
import { useReactToPrint } from 'react-to-print';
import {useAuth} from "../../context/AuthContext";

const TeacherCourseReports = ({ onBack }) => {
    const { courseId } = useParams();
    const {user,role} = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Ref for printable report content.
    const reportRef = useRef(null);

    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'student') {

                navigate('/student-dashboard');
            }
        }
    }, [user, loading, navigate, role]);

    // Configure react-to-print using contentRef.
    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Course_Report_${course ? course.title : courseId}_${new Date().toLocaleDateString()}`,
        pageStyle: `
            @page { margin: 20mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; background: white; }
            }
        `,
    });



    // Fetch course details.
    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                console.log('Fetching course details for courseId:', courseId);
                const res = await axios.get(`${window.baseUrl}/api/courses/${courseId}`);
                console.log('Course details fetched:', res.data);
                setCourse(res.data);
            } catch (err) {
                console.error('Error fetching course details:', err);
                setError(err.response?.data?.error || 'Error fetching course details');
            }
        };
        if (courseId) {
            fetchCourseDetails();
        } else {
            console.error('No courseId provided in URL.');
            setError('No courseId provided');
        }
    }, [courseId]);

    // Fetch lectures and filter ended lectures.
    useEffect(() => {
        const fetchLectures = async () => {
            try {
                console.log('Fetching lectures for courseId:', courseId);
                const res = await axios.get(`${window.baseUrl}/api/teacher_course_reports/course_reports`, {
                    params: { course_id: courseId },
                });
                console.log('Lectures fetched:', res.data);
                const endedLectures = res.data.filter(lecture => lecture.ended_at !== null);
                console.log('Filtered ended lectures:', endedLectures);
                setLectures(endedLectures);
            } catch (err) {
                console.error('Error fetching lectures:', err);
                setError(err.response?.data?.error || 'Error fetching lectures');
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchLectures();
        }
    }, [courseId]);

    if (loading) return <div>Loading lectures...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                    &larr; Back
                </button>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Download as PDF
                </button>
            </div>

            {/* Printable Report Content */}
            <div ref={reportRef} className="bg-white shadow rounded p-8" tabIndex={-1}>
                <header className="mb-8 border-b pb-4">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Course Report: {course.title}
                    </h2>
                    <p className="text-gray-600">
                        Generated on: {new Date().toLocaleString()}
                    </p>
                </header>

                {lectures.length === 0 ? (
                    <p className="text-gray-600">No ended lectures found for this course.</p>
                ) : (
                    <div className="space-y-8">
                        {lectures.map((lecture) => (
                            <div
                                key={lecture.id}
                                className="mb-8 bg-white rounded-lg shadow-lg p-6 max-w-10/12 mx-auto"
                            >
                                {/* Lecture Header with light green background */}
                                <div
                                    className="flex justify-between items-center p-4 rounded mb-4"
                                    style={{ backgroundColor: 'rgba(14,186,41,0.5)' }}
                                >
                                    <div className="pl-10">
                                        <h4 className="text-2xl font-bold text-gray-800">
                                            {lecture.title}
                                        </h4>
                                        <p className="text-gray-700">{lecture.description}</p>
                                    </div>
                                    <div className="text-right pr-28">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Scheduled:</span>{' '}
                                            {lecture.scheduled_at ? new Date(lecture.scheduled_at).toLocaleString() : 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">Started:</span>{' '}
                                            {lecture.started_at ? new Date(lecture.started_at).toLocaleString() : 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">Ended:</span>{' '}
                                            {lecture.ended_at ? new Date(lecture.ended_at).toLocaleString() : 'In progress'}
                                        </p>
                                    </div>
                                </div>

                                {/* Lecture Details & Statistics */}
                                <div className="">
                                    <div>
                                        <TeacherLectureStatistics lectureId={lecture.id}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourseReports;
