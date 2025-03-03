import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const TeacherEnrollmentRequests = () => {
    const { user, loading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState('');
    const [teacherId, setTeacherId] = useState(null);
    const [courseIds, setCourseIds] = useState([]); // courses belonging to teacher

    // Helper: Truncate text to 25 words
    const truncateText = (text, wordLimit = 25) => {
        if (!text) return '';
        const words = text.split(' ');
        return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
    };

    // Function to fetch enrollment requests and merge student names
    const fetchRequests = useCallback(async () => {
        if (user && user.id && teacherId) {
            try {
                const res = await axios.get('http://localhost:5000/api/enrollments/requests', {
                    params: { teacher_id: teacherId },
                });
                console.log("Fetched enrollments:", res.data);
                let requestsData = res.data;
                // Get unique student IDs from the requests
                const studentIds = [...new Set(requestsData.map((req) => req.student_id))];
                // Fetch the students' names from the "students" table
                const { data: studentsData, error: studentsError } = await supabase
                    .from('students')
                    .select('auth_id, name')
                    .in('auth_id', studentIds);
                if (studentsError) {
                    console.error('Error fetching student names:', studentsError);
                }
                // Build a map from student ID to student name
                const studentMap = {};
                if (studentsData) {
                    studentsData.forEach((student) => {
                        studentMap[student.auth_id] = student.name;
                    });
                }
                // Merge the student name into each request object.
                const mergedRequests = requestsData.map((req) => ({
                    ...req,
                    student: req.student || { name: studentMap[req.student_id] || 'Unknown Student' },
                }));
                setRequests([...mergedRequests]);
            } catch (error) {
                setMessage(error.response?.data?.error || 'Error fetching enrollment requests');
            }
        }
    }, [user, teacherId]);

    // Fetch teacher courses (to build enrollment filter) and teacherId
    const fetchTeacherCourses = useCallback(async () => {
        if (user && user.id) {
            // Lookup teacher's id from Supabase
            const { data: teacherRow, error: teacherError } = await supabase
                .from('teachers')
                .select('id')
                .eq('auth_id', user.id)
                .single();
            if (teacherError || !teacherRow) {
                setMessage('Unable to find teacher info.');
                return;
            }
            setTeacherId(teacherRow.id);

            // Now fetch teacher's courses to build a list of course IDs
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('id')
                .eq('teacher_id', teacherRow.id);
            if (coursesError) {
                console.error('Error fetching teacher courses:', coursesError);
                return;
            }
            if (coursesData && coursesData.length > 0) {
                const ids = coursesData.map(course => course.id);
                setCourseIds(ids);
                console.log('Teacher course IDs:', ids);
            } else {
                setCourseIds([]);
            }
        }
    }, [user]);

    // Fetch teacher courses and enrollment requests on mount
    useEffect(() => {
        fetchTeacherCourses().then(() => {
            fetchRequests();
        });
    }, [fetchTeacherCourses, fetchRequests]);

    // Setup Supabase realtime subscription for enrollments
    useEffect(() => {
        // Wait until we have courseIds
        if (!teacherId || courseIds.length === 0) return;

        // Build a filter string: e.g. course_id=in.(1,2,3)
        const filterStr = `course_id=in.(${courseIds.join(',')})`;
        console.log('Setting realtime enrollment subscription with filter:', filterStr);

        const channel = supabase
            .channel(`enrollments-channel-${teacherId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'enrollments',
                    filter: filterStr,
                },
                (payload) => {
                    console.log('Realtime enrollment INSERT received:', payload);
                    fetchRequests();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'enrollments',
                    filter: filterStr,
                },
                (payload) => {
                    console.log('Realtime enrollment UPDATE received:', payload);
                    fetchRequests();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'enrollments',
                    filter: filterStr,
                },
                (payload) => {
                    console.log('Realtime enrollment DELETE received:', payload);
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [teacherId, courseIds, fetchRequests]);

    // Group requests by status
    const pendingRequests = requests.filter((req) => req.status === 'pending');
    const approvedRequests = requests.filter((req) => req.status === 'approved');

    const updateStatus = async (enrollment_id, status) => {
        try {
            await axios.post('http://localhost:5000/api/enrollments/update', { enrollment_id, status });
            fetchRequests();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error updating enrollment status');
        }
    };

    if (loading) return <div>Loading enrollment requests...</div>;
    if (!user) return <div>Please login to view enrollment requests.</div>;

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Enrollment Requests</h3>
            {message && <p className="text-red-500 mb-4">{message}</p>}

            {/* Pending Enrollment Requests */}
            <div className="mb-8">
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Pending Enrollment Requests</h4>
                {pendingRequests.length === 0 ? (
                    <p className="text-gray-500">No pending enrollment requests.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {pendingRequests.map((req) => (
                            <div
                                key={req.id}
                                className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1"
                            >
                                <div className="flex justify-center mb-3">
                                    {/* User Icon */}
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
                                            d="M16 14a4 4 0 10-8 0m8 0v1a3 3 0 01-6 0v-1m6 0H8"
                                        />
                                    </svg>
                                </div>
                                <h4 className="text-md font-bold text-gray-800 text-center mb-1">
                                    {req.course?.title || 'Unknown'}
                                </h4>
                                <p className="text-xs text-gray-600 text-center">
                                    <span className="font-medium">{req.course?.subject || 'Unknown'}</span>
                                </p>
                                <p className="text-xs text-gray-500 text-center mt-1">
                                    {truncateText(req.course?.description, 30)}
                                </p>
                                <div className="mt-2 text-center">
                                    <span className="text-xs text-green-500 font-medium uppercase">{req.status}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-4 mb-4">
                                    <strong>Student:</strong> {req.student?.name || 'Unknown Student'}
                                </p>
                                <div className="flex space-x-4 mx-auto mb-5">
                                    <button
                                        onClick={() => updateStatus(req.id, 'approved')}
                                        className="w-24 bg-green-500 bg-opacity-70 border-2 border-green-400 text-white text-md font-semibold rounded-lg shadow-xl hover:shadow-2xl hover:bg-green-600 hover:bg-opacity-80 transition-all duration-300"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateStatus(req.id, 'rejected')}
                                        className="w-24 px-2 py-2 bg-red-500 bg-opacity-70 border-2 border-red-400 text-white text-md font-semibold rounded-lg shadow-xl hover:shadow-2xl hover:bg-red-600 hover:bg-opacity-80 transition-all duration-300"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approved Enrollment Requests */}
            <div>
                <h4 className="text-xl font-semibold text-gray-700 mb-4">Approved Enrollment Requests</h4>
                {approvedRequests.length === 0 ? (
                    <p className="text-gray-500">No approved enrollment requests.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {approvedRequests.map((req) => (
                            <div
                                key={req.id}
                                className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1"
                            >
                                <div className="flex justify-center mb-3">
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
                                            d="M16 14a4 4 0 10-8 0m8 0v1a3 3 0 01-6 0v-1m6 0H8"
                                        />
                                    </svg>
                                </div>
                                <h4 className="text-md font-bold text-gray-800 text-center mb-1">
                                    {req.course?.title || 'Unknown'}
                                </h4>
                                <p className="text-xs text-gray-600 text-center">
                                    <span className="font-medium">{req.course?.subject || 'Unknown'}</span>
                                </p>
                                <p className="text-xs text-gray-500 text-center mt-1">
                                    {truncateText(req.course?.description, 30)}
                                </p>
                                <div className="mt-2 text-center">
                                    <span className="text-xs text-green-500 font-medium uppercase">{req.status}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-4 mb-4">
                                    <strong>Student:</strong> {req.student?.name || 'Unknown Student'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherEnrollmentRequests;
