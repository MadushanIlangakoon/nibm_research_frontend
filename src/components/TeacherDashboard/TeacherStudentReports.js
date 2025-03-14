// client/src/components/TeacherStudentReportsDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

// Import Chart.js components for the line chart.
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TeacherStudentReports = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [reportsData, setReportsData] = useState({ lectureReports: [], testAnswers: [] });
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const teacherId = user.teacherId || user.id;

    // Create a ref for the printable report content.
    const reportRef = useRef(null);

    // Configure react-to-print.
    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Student_Report_${studentName || studentId}_${new Date().toLocaleDateString()}`,
        pageStyle: `
      @page { margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; background: white; }
      }
    `,
    });

    // Fetch student reports
    useEffect(() => {
        const fetchReports = async () => {
            try {
                console.log('Fetching reports with:', { studentId, teacherId });
                const res = await axios.get('http://localhost:5000/api/teacher_student_reports', {
                    params: { student_id: studentId, teacher_id: teacherId },
                });
                console.log('Fetched reports:', res.data);
                setReportsData(res.data);
            } catch (err) {
                console.error('Error in axios request:', err);
                setError(err.response?.data?.error || 'Error fetching reports');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [studentId, teacherId]);

    // Fetch student info (name) using studentId.
    useEffect(() => {
        const fetchStudentName = async () => {
            try {
                console.log('Fetching student name for id:', studentId);
                const res = await axios.get(`http://localhost:5000/api/students/id/${studentId}`);
                console.log('Fetched student name:', res.data.name);
                setStudentName(res.data.name);
            } catch (err) {
                console.error('Error fetching student info:', err);
                // Fallback to studentId if name not available.
                setStudentName(`ID: ${studentId}`);
            }
        };
        fetchStudentName();
    }, [studentId]);


    if (loading)
        return <div className="p-8 text-center text-gray-600">Loading student report...</div>;
    if (error)
        return <div className="p-8 text-center text-red-500">{error}</div>;

    const { lectureReports, testAnswers } = reportsData;

    // Group test answers by lecture_id.
    const groupedTestAnswers = testAnswers.reduce((acc, answer) => {
        const key = answer.lecture_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(answer);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* Header with Back and Print buttons */}
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
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Teacher Report</h2>
                    <p className="text-gray-600">Student Report Detail for {studentName}</p>
                    <p className="text-gray-600">Generated on: {new Date().toLocaleString()}</p>
                </header>

                {/* Render each Lecture Report as a separate card */}
                {lectureReports.length === 0 ? (
                    <p className="text-gray-600">No lecture report data available for this student.</p>
                ) : (
                    lectureReports.map((report) => {
                        // Prepare chart data if prediction_time_series exists.
                        let chartData = null;
                        if (report.prediction_time_series && report.prediction_time_series.length > 0) {
                            chartData = {
                                labels: report.prediction_time_series.map((point) => point.time),
                                datasets: [
                                    {
                                        label: 'Prediction',
                                        data: report.prediction_time_series.map((point) => point.prediction),
                                        fill: false,
                                        borderColor: 'rgb(75, 192, 192)',
                                        tension: 0.1,
                                    },
                                ],
                            };
                        }
                        // Get test answers for this lecture.
                        const lectureTestAnswers = groupedTestAnswers[report.lecture.id] || [];

                        return (
                            <div
                                key={report.id}
                                className="mb-8 bg-white rounded-lg shadow-lg p-6 max-w-10/12 mx-auto"
                            >
                                {/* Header Row: Title/Description on left, Scheduled Time on right */}
                                <div
                                    className="flex justify-between items-center p-4 rounded mb-4"
                                    style={{ backgroundColor: 'rgba(14,186,41,0.5)' }}
                                >
                                    <div className="pl-10">
                                        <h4 className="text-2xl font-bold text-gray-800">{report.lecture.title}</h4>
                                        <p className="text-gray-700">{report.lecture.description}</p>
                                    </div>
                                    <div className="text-right pr-28">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Scheduled:</span>{' '}
                                            {new Date(report.lecture.scheduled_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats and Graph Row */}
                                <div className="grid grid-cols-1 xl:grid-cols-[40%_60%] gap-4">
                                    {/* Left Column: Text Stats */}
                                    <div className="text-gray-600 text-lg p-10 space-y-3 xl:ml-5 2xl:ml-20">
                                        <div className="flex flex-wrap items-center pt-8">
                                            <span className="font-medium">Joined at:</span>
                                            <span className="ml-1">{new Date(report.join_time).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center pt-5">
                                            <span className="font-medium">Left at:</span>
                                            <span
                                                className="ml-1">{report.end_time ? new Date(report.end_time).toLocaleString() : 'In progress'}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center pt-5">
                                            <span className="font-medium">Total Meeting Duration:</span>
                                            <span className="ml-1">{report.total_duration.toFixed(2)} sec</span>
                                        </div>
                                        <div className="flex flex-wrap items-center pt-5">
                                            <span className="font-medium">Participated Time:</span>
                                            <span className="ml-1">{report.active_time.toFixed(2)} sec</span>
                                        </div>
                                        <div className="flex flex-wrap items-center pt-5">
                                            <span className="font-medium">Average Gaze Duration:</span>
                                            <span className="ml-1">{report.lecture.average_gaze_duration.toFixed(2)} sec</span>
                                        </div>
                                        <div className="flex flex-wrap items-center pt-5">
                                            <span className="font-medium">Student Gaze Duration:</span>
                                            <span className="ml-1">{report.gaze_duration.toFixed(2)} sec</span>
                                        </div>
                                        <div className="pt-5">
                                            <span className="font-medium ">Avg Comprehension Prediction:</span>{' '}
                                            {report.avg_prediction.toFixed(2)}%
                                        </div>
                                    </div>
                                    {/* Right Column: Graph */}
                                    <div className="p-4 xl:ml-0 2xl:ml-15">
                                        {chartData && (
                                            <div className="w-full h-[500px]">
                                                <Line
                                                    data={chartData}
                                                    height={500}
                                                    width={800}
                                                    options={{
                                                        responsive: true,
                                                        scales: {y: {min: 0, max: 100}},
                                                        plugins: {
                                                            legend: {position: 'top'},
                                                            title: {display: true, text: 'Prediction over Time'},
                                                        },
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Test Answers Section for this Lecture */}
                                {lectureTestAnswers.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-xl font-semibold text-gray-800 mb-10">Lecture Test
                                            Answers</h5>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Question
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student Answer
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Correct Answer
                                                    </th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Correct?
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                {lectureTestAnswers.map((ans, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{ans.question}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{ans.student_answer}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{ans.correct_answer}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{ans.is_correct ? 'Yes' : 'No'}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TeacherStudentReports;
