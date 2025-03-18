import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import reportWebVitals from './reportWebVitals';
import process from 'process';
window.process = process;

const baseUrl = process.env.REACT_APP_NODE_SERVER_API_URL;
window.baseUrl = baseUrl;


const mlUrl = process.env.REACT_APP_ML_SERVER_API_URL;
window.mlUrl = mlUrl;

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <AuthProvider>
        <App />
    </AuthProvider>
);

reportWebVitals();
