import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch student profile from the "students" table.
    const fetchStudentProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('auth_id', userId);
            if (error) {
                // console.error("Error fetching student profile:", error);
                return null;
            }
            if (data && data.length > 0) return data[0];
            return null;
        } catch (err) {
            // console.error("Exception fetching student profile:", err);
            return null;
        }
    };

    // Fetch teacher profile from the "teachers" table.
    const fetchTeacherProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select('*')
                .eq('auth_id', userId);
            if (error) {
                // console.error("Error fetching teacher profile:", error);
                return null;
            }
            if (data && data.length > 0) return data[0];
            return null;
        } catch (err) {
            // console.error("Exception fetching teacher profile:", err);
            return null;
        }
    };

    // A unified function to fetch the profile, adding a role field.
    const fetchProfileWithTimeout = async (userId, timeout = 5000) => {
        return Promise.race([
            (async () => {
                const studentProfile = await fetchStudentProfile(userId);
                if (studentProfile) {
                    // console.log("Fetched student profile:", studentProfile);
                    return { ...studentProfile, role: 'student' };
                }
                const teacherProfile = await fetchTeacherProfile(userId);
                if (teacherProfile) {
                    // console.log("Fetched teacher profile:", teacherProfile);
                    return { ...teacherProfile, role: 'teacher' };
                }
                return null;
            })(),
            new Promise((resolve) =>
                setTimeout(() => {
                    // console.warn("Profile fetch timed out");
                    resolve(null);
                }, timeout)
            )
        ]);
    };

    useEffect(() => {
        const getSessionAndProfile = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
                // Set basic auth user immediately
                setUser(session.user);
                // Then fetch the additional profile data and merge it
                fetchProfileWithTimeout(session.user.id).then((profile) => {
                    if (profile) {
                        // console.log("Profile fetched and merged:", profile);
                        setUser((prevUser) => {
                            const mergedUser = { ...prevUser, ...profile };
                            // console.log("Merged user object:", mergedUser);
                            return mergedUser;
                        });
                    } else {
                        // console.warn("No profile found; defaulting to student");
                        setUser((prevUser) => ({ ...prevUser, role: 'student', did_general_questions: false }));
                    }
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        getSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    fetchProfileWithTimeout(session.user.id).then((profile) => {
                        if (profile) {
                            setUser((prevUser) => ({ ...prevUser, ...profile }));
                        } else {
                            setUser((prevUser) => ({ ...prevUser, role: 'student', did_general_questions: false }));
                        }
                    });
                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, role: user?.role }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
