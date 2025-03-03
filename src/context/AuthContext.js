import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to fetch the student profile from the "students" table.
    const fetchStudentProfile = async (userId) => {
        // console.log("Fetching student profile for userId:", userId);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('auth_id', userId);
            // console.log("Query result for student profile:", { data, error });
            if (error) {
                // console.error("Error fetching student profile:", error);
                return null;
            }
            if (data && data.length > 0) {
                // console.log("Student profile retrieved:", data[0]);
                return data[0];
            }
            // console.log("No student profile found for userId:", userId);
            return null;
        } catch (err) {
            // console.error("Exception fetching student profile:", err);
            return null;
        }
    };

    // A timeout wrapper to force fallback if the query takes too long.
    const fetchStudentProfileWithTimeout = async (userId, timeout = 5000) => {
        return Promise.race([
            fetchStudentProfile(userId),
            new Promise((resolve) => setTimeout(() => {
                // console.warn("Student profile fetch timed out");
                resolve(null);
            }, timeout))
        ]);
    };

    useEffect(() => {
        const getSessionAndProfile = async () => {
            // console.log("Getting session...");
            const {
                data: { session },
            } = await supabase.auth.getSession();
            // console.log("Session received:", session);
            if (session?.user) {
                // Set basic auth user immediately so UI loads quickly.
                setUser(session.user);
                // Then fetch extra profile data asynchronously.
                fetchStudentProfileWithTimeout(session.user.id).then(profile => {
                    if (profile) {
                        // console.log("Merging student profile with auth user:", profile);
                        // Preserve the original UUID in user.id by merging extra profile without overwriting it.
                        setUser(prevUser => ({ ...prevUser, ...profile }));
                    } else {
                        // console.log("No student profile found or timed out; using auth user with default did_general_questions=false");
                        setUser(prevUser => ({ ...prevUser, did_general_questions: false }));
                    }
                });
            } else {
                // console.log("No session found; setting user to null");
                setUser(null);
            }
            setLoading(false);
        };

        getSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // console.log("Auth state changed:", event, session);
                if (session?.user) {
                    setUser(session.user);
                    fetchStudentProfileWithTimeout(session.user.id).then(profile => {
                        if (profile) {
                            // console.log("Merging student profile on auth state change:", profile);
                            setUser(prevUser => ({ ...prevUser, ...profile }));
                        } else {
                            // console.log("No student profile found on auth state change; using auth user with default did_general_questions=false");
                            setUser(prevUser => ({ ...prevUser, did_general_questions: false }));
                        }
                    });
                } else {
                    // console.log("Auth state change: user signed out");
                    setUser(null);
                }
            }
        );

        return () => {
            // console.log("Cleaning up authListener");
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
