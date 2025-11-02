import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/auth.js';
import { Alert } from './Alert.jsx';
import './AuthForm.css';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      console.log('🔐 Attempting login with:', formData.email);
      const response = await authAPI.login(formData);
      console.log('✅ Login response:', response.data);

      // Store token and user data
      const token = response.data.token;
      const userRole = response.data.user.role;
      
      console.log('✅ Login response received:', response.data);
      console.log('👤 User role from response:', userRole);
      console.log('👤 User role type:', typeof userRole);
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('firstName', response.data.user.firstName);
      localStorage.setItem('lastName', response.data.user.lastName);
      localStorage.setItem('email', response.data.user.email);

      // Verify storage
      console.log('💾 Token stored:', localStorage.getItem('token'));
      console.log('💾 Role stored:', localStorage.getItem('userRole'));
      console.log('👤 Is super_admin?', userRole === 'super_admin');

      // Redirect based on role BEFORE showing alert
      if (userRole === 'super_admin') {
        console.log('🚀 Redirecting to admin dashboard...');
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.log('🚀 Redirecting to fan selection... (role:', userRole, ')');
        navigate('/fan-selection', { replace: true });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Login failed. Please try again.';

      if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Make sure backend is running on port 5000.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setAlert({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome</h1>
          <p>Select the best fans for your project.</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="large-placeholder"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>
            <div className="password-input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="large-placeholder"
                required
              />
              <button
                type="button"
                className="toggle-password toggle-password-large"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};
