import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navigation from './components/Navigation/Navigation';
import Login from './components/Login/Login';
import Unauthorized from './components/Unauthorized/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Main application components
import QuestionsApp from './components/QuestionsApp/QuestionsApp';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <div className="app-container">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes - accessible to both admin and guest */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <QuestionsApp />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/questions" 
                element={
                  <ProtectedRoute>
                    <QuestionsApp />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin-only routes */}
              <Route 
                path="/admin/create" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <div className="admin-page">
                      <h2>Create Questions</h2>
                      <p>This is an admin-only page for creating new questions.</p>
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/manage" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <div className="admin-page">
                      <h2>Manage Questions</h2>
                      <p>This is an admin-only page for managing existing questions.</p>
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;