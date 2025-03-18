// client/src/components/TeacherReports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeacherReports = () => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [message, setMessage] = useState('');


    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'student') {

                navigate('/student-dashboard');
            }
        }
    }, [user, loading, navigate, role]);

    // Helper: Truncate text to a given word limit.
    const truncateText = (text, wordLimit = 30) => {
        if (!text) return '';
        const words = text.split(' ');
        return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '...';
    };

    // Fetch teacher courses from Supabase.
    const fetchTeacherCourses = useCallback(async () => {
        if (!user || !user.id) return [];
        const teacherId = user.teacherId || user.id;
        const { data, error } = await supabase
            .from('courses')
            .select('id, title, subject, description')
            .eq('teacher_id', teacherId);
        if (error) {
            console.error('Error fetching teacher courses:', error);
            return [];
        }
        return data || [];
    }, [user]);

    // Fetch enrollments with approved status for given course IDs.
    const fetchEnrolledStudentIds = useCallback(async (courseIds) => {
        if (!courseIds || courseIds.length === 0) return [];
        const { data, error } = await supabase
            .from('enrollments')
            .select('student_id')
            .in('course_id', courseIds)
            .eq('status', 'approved');
        if (error) {
            console.error('Error fetching enrollments:', error);
            return [];
        }
        const studentIds = data.map(enrollment => enrollment.student_id);
        return [...new Set(studentIds)];
    }, []);

    // Fetch student details for given student IDs.
    const fetchStudentDetails = useCallback(async (studentIds) => {
        if (!studentIds || studentIds.length === 0) return [];
        const { data, error } = await supabase
            .from('students')
            .select('id, auth_id, name, stream, photo, gender')
            .in('id', studentIds);
        if (error) {
            console.error('Error fetching student details:', error);
            return [];
        }
        return data;
    }, []);

    // Combined function to fetch teacher reports.
    const fetchReports = useCallback(async () => {
        setLoadingCourses(true);
        setLoadingStudents(true);
        try {
            const coursesData = await fetchTeacherCourses();
            setCourses(coursesData);
            setLoadingCourses(false);

            const courseIds = coursesData.map(course => course.id);
            if (courseIds.length === 0) {
                setMessage('No courses found for you.');
                setStudentList([]);
                setLoadingStudents(false);
                return;
            }
            const studentIds = await fetchEnrolledStudentIds(courseIds);
            if (studentIds.length === 0) {
                setMessage('No students enrolled in your courses.');
                setStudentList([]);
                setLoadingStudents(false);
                return;
            }
            const students = await fetchStudentDetails(studentIds);
            setStudentList(students);
            setLoadingStudents(false);
        } catch (error) {
            console.error('Error fetching teacher reports:', error);
            setMessage('Error fetching teacher reports.');
            setLoadingCourses(false);
            setLoadingStudents(false);
        }
    }, [fetchTeacherCourses, fetchEnrolledStudentIds, fetchStudentDetails]);

    useEffect(() => {
        if (user) {
            fetchReports();
        }
    }, [user, fetchReports]);

    return (
        <div className="p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Teacher Reports</h2>
            {message && <p className="text-red-500 mb-4">{message}</p>}

            {/* Enrolled Students Section */}
            <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Enrolled Students</h3>
                {loadingStudents ? (
                    <p>Loading student enrollments...</p>
                ) : studentList.length === 0 ? (
                    <p className="text-gray-600">No students found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {studentList.map((student) => (
                            <div
                                key={student.id}
                                className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1 cursor-pointer"
                                onClick={() => navigate(`/teacher-reports/student/${student.id}`)}
                            >
                                <div className="flex justify-center mb-3">
                                    <img
                                        src={
                                            student.photo ||
                                            (student.gender && student.gender.toLowerCase() === 'female'
                                                ? '/TeacherFemalePlaceholder.webp'
                                                : '/TeacherMalePlaceholder.webp')
                                        }
                                        alt={student.name || 'Student'}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                </div>
                                <h4 className="text-xl font-semibold text-gray-800 text-center">
                                    {student.name}
                                </h4>
                                <p className="text-sm text-gray-500 text-center mt-2">
                                    {student.stream || 'Unknown Stream'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Courses Section */}
            <div className="mt-10">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Courses</h3>
                {loadingCourses ? (
                    <p>Loading courses...</p>
                ) : courses.length === 0 ? (
                    <p className="text-gray-600">No courses found. Create one!</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {courses.map((course, index) => (
                            <div
                                key={course.id ? course.id : `${course.title}-${index}`}
                                className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1 cursor-pointer"
                                onClick={() => navigate(`/teacher-reports/course/${course.id}`)}
                            >
                                <div className="flex justify-center mb-3">
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
                                <h4 className="text-xl font-semibold text-gray-800 text-center">
                                    {course.title}
                                </h4>
                                <p className="text-sm text-gray-500 text-center mt-2">
                                    <span className="font-medium">{course.subject}</span>
                                </p>
                                <p className="text-xs text-gray-500 text-center mt-4 mb-8">
                                    {course.description ? truncateText(course.description, 30) : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherReports;
