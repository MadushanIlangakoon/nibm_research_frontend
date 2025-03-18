import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherLectureStatistics = ({ lectureId }) => {
    const [detailedStats, setDetailedStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log('Fetching detailed lecture statistics for lectureId:', lectureId);
                const res = await axios.get(`${window.baseUrl}/api/teacher_course_reports/lecture_statistics`, {
                    params: { lecture_id: lectureId }
                });
                console.log('Detailed lecture statistics fetched:', res.data);
                setDetailedStats(res.data);
            } catch (err) {
                console.error('Error fetching lecture statistics:', err);
                setError(err.response?.data?.error || 'Error fetching lecture statistics');
            } finally {
                setLoading(false);
            }
        };

        if (lectureId) {
            fetchStats();
        }
    }, [lectureId]);

    if (loading) return <div>Loading statistics...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!detailedStats)
        return <div className="text-gray-600">No statistics available for this lecture.</div>;

    const { lecture, joined, not_joined } = detailedStats;

    // Prepare chart data if there are joined students.
    const chartData = {
        labels:
            joined && joined.length > 0
                ? joined.map((s) => (s.student ? s.student.name : `ID: ${s.student_id}`))
                : [],
        datasets: [
            {
                label: 'Gaze Duration (sec)',
                data: joined && joined.length > 0 ? joined.map((s) => s.gaze_duration) : [],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
                label: 'Avg Comprehension (%)',
                data: joined && joined.length > 0 ? joined.map((s) => s.avg_prediction) : [],
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Student Performance' },
        },
        scales: {
            y: { beginAtZero: true },
        },
    };

    return (
        <div className="mt-2 p-2 border-t border-gray-300">
            <h4 className="text-lg font-bold text-gray-700 mb-4">Lecture Statistics</h4>
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Structured Statistics */}
                <div className="space-y-4">
                    {lecture && lecture.average_gaze_duration !== null && (
                        <div className="p-4 bg-gray-50 rounded shadow">
                            <p className="text-sm text-gray-600">
                                <strong>Lecture Avg Gaze Duration:</strong> {lecture.average_gaze_duration.toFixed(2)} seconds
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded shadow">
                        <h5 className="text-md font-semibold text-gray-700 mb-2">Joined Students</h5>
                        {joined && joined.length > 0 ? (
                            <div className="space-y-3">
                                {joined.map((s) => (
                                    <div key={s.id} className="p-2 border rounded bg-white shadow">
                                        <p className="text-sm text-gray-700">
                                            <strong>Student:</strong> {s.student ? s.student.name : `ID: ${s.student_id}`}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                                            <div>
                                                <p><strong>Total Duration:</strong> {s.total_duration} sec</p>
                                            </div>
                                            <div>
                                                <p><strong>Active Time:</strong> {s.active_time.toFixed(2)} sec</p>
                                            </div>
                                            <div>
                                                <p><strong>Avg Prediction:</strong> {s.avg_prediction.toFixed(2)}%</p>
                                            </div>
                                            <div>
                                                <p><strong>Highest Prediction:</strong> {s.highest_prediction}%</p>
                                            </div>
                                            <div>
                                                <p><strong>Lowest Prediction:</strong> {s.lowest_prediction}%</p>
                                            </div>
                                            <div>
                                                <p><strong>Gaze Duration:</strong> {s.gaze_duration.toFixed(2)} sec</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No students joined this lecture.</p>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded shadow">
                        <h5 className="text-md font-semibold text-gray-700 mb-2">Students Not Joined</h5>
                        {not_joined && not_joined.length > 0 ? (
                            <ul className="list-disc ml-4 text-sm text-gray-600">
                                {not_joined.map((student) => (
                                    <li key={student.id}>{student.name || `ID: ${student.id}`}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">All expected students joined.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Chart */}
                <div className="p-2" style={{ pageBreakInside: 'avoid', height: '400px' }}>
                    {joined && joined.length > 0 ? (
                        <Bar data={chartData} options={chartOptions} />
                    ) : (
                        <p className="text-gray-600">No student data available for chart.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherLectureStatistics;
