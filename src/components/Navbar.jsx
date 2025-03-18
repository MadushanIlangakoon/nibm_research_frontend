import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            localStorage.removeItem("remindGeneralQuestionsTimestamp");
            navigate('/');
        } else {
            console.error("Logout error:", error);
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-gray-800 text-white flex justify-between items-center ">
            <div className="flex items-center pb-2">
                {/* Logo image */}
                <img src="/logo.svg" alt="CompyLearning Logo" className=" ml-18 h-18 w-50 -mt-2" />

                {/* Optionally, you can keep a text label alongside the logo */}
                {/*<span className="text-xl font-bold">LMS</span>*/}
            </div>
            <div className="flex items-center space-x-4 mr-10">
                {/* Notification Icon */}
                <button className="relative focus:outline-none">
                    <svg
                        className="h-6 w-6 text-white mr-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1"
                        />
                    </svg>
                    {/* Notification Badge */}
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-gray-800 bg-red-500 mr-10"></span>
                </button>
                {/* Logout Button */}
                {user && (
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-700 px-3 py-1 rounded"
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
