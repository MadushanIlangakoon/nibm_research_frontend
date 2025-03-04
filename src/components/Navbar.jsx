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
            // Clear any LMS-specific local storage keys
            localStorage.removeItem("remindGeneralQuestionsTimestamp");
            navigate('/');
        } else {
            console.error("Logout error:", error);
        }
    };

    return (
        <nav className="bg-gray-800 text-white flex justify-between items-center p-4 ">
            <div className="text-lg font-bold">LMS</div>
            <div>
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
