// client/src/components/TeacherStudents.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeacherStudents = ({ onBack }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Fetch teacher's courses (IDs) from Supabase using teacherId.
    const fetchTeacherCourses = useCallback(async () => {
        if (!user || !user.id) return [];
        const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('id')
            .eq('teacher_id', user.teacherId || user.id); // if teacherId is merged, use that; otherwise fallback
        if (coursesError) {
            console.error('Error fetching teacher courses:', coursesError);
            return [];
        }
        return coursesData ? coursesData.map(course => course.id) : [];
    }, [user]);

    // Fetch enrollments with approved status for given course IDs.
    const fetchEnrolledStudentIds = useCallback(async (courseIds) => {
        if (!courseIds || courseIds.length === 0) return [];
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('student_id')
            .in('course_id', courseIds)
            .eq('status', 'approved');
        if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError);
            return [];
        }
        const studentIds = enrollmentsData.map(enrollment => enrollment.student_id);
        return [...new Set(studentIds)]; // unique IDs
    }, []);

    // Fetch student details (photo, name, stream) for given student IDs.
    const fetchStudentDetails = useCallback(async (studentIds) => {
        if (!studentIds || studentIds.length === 0) return [];
        const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select('auth_id, id, name, stream, photo, gender')
            .in('id', studentIds);
        if (studentsError) {
            console.error('Error fetching student details:', studentsError);
            return [];
        }
        return studentsData;
    }, []);

    // Combined function to fetch teacher students.
    const fetchTeacherStudents = useCallback(async () => {
        setLoading(true);
        try {
            const courseIds = await fetchTeacherCourses();
            if (courseIds.length === 0) {
                setMessage('No courses found for you.');
                setStudentList([]);
                return;
            }
            const studentIds = await fetchEnrolledStudentIds(courseIds);
            if (studentIds.length === 0) {
                setMessage('No students enrolled in your courses.');
                setStudentList([]);
                return;
            }
            const students = await fetchStudentDetails(studentIds);
            setStudentList(students);
        } catch (error) {
            console.error('Error fetching teacher students:', error);
            setMessage('Error fetching teacher students.');
        } finally {
            setLoading(false);
        }
    }, [fetchTeacherCourses, fetchEnrolledStudentIds, fetchStudentDetails]);

    useEffect(() => {
        if (user) {
            fetchTeacherStudents();
        }
    }, [user, fetchTeacherStudents]);

    if (loading) return <div>Loading student enrollments...</div>;

    return (
        <div className="p-4">
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
                &larr; Back
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Enrolled Students</h2>
            {message && <p className="text-red-500 mb-4">{message}</p>}
            {studentList.length === 0 ? (
                <p className="text-gray-600">No students found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {studentList.map((student) => (
                        <div
                            key={student.id}
                            className="flex flex-col bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition transform hover:-translate-y-1 cursor-pointer"
                            onClick={() => {
                                // Optionally, navigate to a detailed student profile page
                                // navigate(`/teacher/student/${student.auth_id}`);
                            }}
                        >
                            <div className="flex justify-center mb-3">
                                <img
                                    src={
                                        student.photo ||
                                        (student.gender && student.gender.toLowerCase() === 'female'
                                            ? '/girl_placeholder.webp'
                                            : '/boy_placeholder.webp')
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
    );
};

export default TeacherStudents;
