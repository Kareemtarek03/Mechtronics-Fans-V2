import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth.js';
import { Alert } from './Alert.jsx';
import './AuthForm.css';

export const ForgotPassword3Step = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetId, setResetId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Submit email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      if (!email) {
        setAlert({ type: 'error', message: 'Email is required' });
        setLoading(false);
        return;
      }

      await authAPI.forgotPassword({ email });
      
      setAlert({
        type: 'success',
        message: 'Verification code sent to your email'
      });
      setStep(2);
    } catch (error) {
      const errorMessage = error.response?.data?.error;
      setAlert({
        type: 'error',
        message: errorMessage || 'Failed to send verification code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      if (!code) {
        setAlert({ type: 'error', message: 'Verification code is required' });
        setLoading(false);
        return;
      }

      const response = await authAPI.verifyCode({ email, code });
      
      setResetId(response.data.resetId);
      setAlert({
        type: 'success',
        message: 'Code verified successfully'
      });
      setStep(3);
    } catch (error) {
      const errorMessage = error.response?.data?.error;
      setAlert({
        type: 'error',
        message: errorMessage || 'Invalid or expired code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      if (!newPassword || !confirmPassword) {
        setAlert({ type: 'error', message: 'Both password fields are required' });
        setLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        setAlert({ type: 'error', message: 'Password must be at least 8 characters' });
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setAlert({ type: 'error', message: 'Passwords do not match' });
        setLoading(false);
        return;
      }

      await authAPI.resetPassword({
        resetId,
        newPassword,
        confirmPassword
      });

      setAlert({
        type: 'success',
        message: 'Password reset successfully! Redirecting to login...'
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.error;
      setAlert({
        type: 'error',
        message: errorMessage || 'Failed to reset password. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setAlert(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">🔐</div>
          <h1>Reset Your Password</h1>
          <p>
            {step === 1 && 'Enter your email address to receive a verification code'}
            {step === 2 && 'Enter the verification code sent to your email'}
            {step === 3 && 'Create a new, secure password for your account'}
          </p>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  id="email"
                  placeholder="e.g., your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Code Verification */}
        {step === 2 && (
          <form onSubmit={handleCodeSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  required
                />
              </div>
              <small style={{ color: '#94a3b8', marginTop: '5px' }}>
                Check your email for the verification code
              </small>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* Step 3: Password Reset */}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="password-requirements">
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                Password must contain:
              </p>
              <ul style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '20px' }}>
                <li>Minimum 8 characters</li>
              </ul>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="back-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}
            >
              ← Back
            </button>
          )}
          {step === 1 && (
            <Link to="/login" className="back-link">← Back to Login</Link>
          )}
        </div>
      </div>
    </div>
  );
};
