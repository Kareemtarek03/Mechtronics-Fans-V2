import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FormProvider } from "./context/FormContext";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import GraphDetailPage from "./pages/GraphDetailPage";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { ForgotPassword3Step } from "./components/auth/ForgotPassword3Step";
import { AdminDashboard } from "./components/auth/AdminDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <FormProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword3Step />} />
          
          {/* Protected Admin Route */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Fan Selection Routes */}
          <Route 
            path="/fan-selection" 
            element={
              <ProtectedRoute>
                <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                  <Header />
                  <HomePage />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/results" 
            element={
              <ProtectedRoute>
                <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                  <Header />
                  <ResultsPage />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/graph-detail" 
            element={
              <ProtectedRoute>
                <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                  <Header />
                  <GraphDetailPage />
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fans" 
            element={
              <ProtectedRoute>
                <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                  <Header />
                  <div style={{ padding: "40px", textAlign: "center" }}>Fans page coming soon...</div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/datasheets" 
            element={
              <ProtectedRoute>
                <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
                  <Header />
                  <div style={{ padding: "40px", textAlign: "center" }}>Datasheets page coming soon...</div>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </FormProvider>
  );
}

export default App;
