import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth.js';
import { Alert } from './Alert.jsx';
import './AuthForm.css';

const COUNTRY_CODES = [

  { code: '+20', country: 'Egypt', flag: '🇪🇬', digits: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', digits: 10 },
  { code: '+33', country: 'France', flag: '🇫🇷', digits: 9 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', digits: 11 },
  { code: '+39', country: 'Italy', flag: '🇮🇹', digits: 10 },
  { code: '+34', country: 'Spain', flag: '🇪🇸', digits: 9 },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', digits: 9 },
  { code: '+32', country: 'Belgium', flag: '🇧🇪', digits: 9 },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭', digits: 9 },
  { code: '+43', country: 'Austria', flag: '🇦🇹', digits: 10 },
  { code: '+45', country: 'Denmark', flag: '🇩🇰', digits: 8 },
  { code: '+46', country: 'Sweden', flag: '🇸🇪', digits: 9 },
  { code: '+47', country: 'Norway', flag: '🇳🇴', digits: 8 },
  { code: '+358', country: 'Finland', flag: '🇫🇮', digits: 9 },
  { code: '+48', country: 'Poland', flag: '🇵🇱', digits: 9 },
  { code: '+30', country: 'Greece', flag: '🇬🇷', digits: 10 },
  { code: '+90', country: 'Turkey', flag: '🇹🇷', digits: 10 },
  { code: '+1', country: 'US', flag: '🇺🇸', digits: 10 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', digits: 9 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', digits: 9 },
  { code: '+91', country: 'India', flag: '🇮🇳', digits: 10 },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', digits: 10 },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', digits: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', digits: 11 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', digits: 10 },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', digits: 10 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', digits: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', digits: 8 },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', digits: 10 },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', digits: 9 },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', digits: 9 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', digits: 9 },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', digits: 9 },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', digits: 11 },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', digits: 10 },
  { code: '+56', country: 'Chile', flag: '🇨🇱', digits: 9 },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', digits: 10 },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', digits: 10 },
  { code: '+1', country: 'Canada', flag: '🇨🇦', digits: 10 },
];

export const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+1',
    phone: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'phone') {
      validatePhoneNumber(value, formData.countryCode);
    }
  };

  const handleCountrySearch = (e) => {
    const value = e.target.value;
    setCountrySearch(value);
  };

  const handleSelectCountry = (code) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code
    }));
    setCountrySearch('');
    setShowCountryDropdown(false);
  };

  // Filter countries based on search
  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.country.toLowerCase().startsWith(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  );

  const validatePhoneNumber = (phoneNumber, countryCode) => {
    const country = COUNTRY_CODES.find(c => c.code === countryCode);
    if (!country) return;

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (phoneNumber && digitsOnly.length !== country.digits) {
      setPhoneError(`${country.country} requires ${country.digits} digits`);
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    if (phoneError) {
      setAlert({
        type: 'error',
        message: 'Please fix phone number errors'
      });
      setLoading(false);
      return;
    }

    try {
      const fullPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : '';
      const response = await authAPI.signup({
        ...formData,
        phone: fullPhone
      });
      localStorage.setItem('token', response.data.token);
      setAlert({ type: 'success', message: 'Account created successfully!' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Signup failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo"></div>
          <h1>Create Your Account</h1>
          <p>Get started with our fan selection tool.</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-group">
                <div className="country-dropdown-wrapper" ref={dropdownRef}>
                  <button
                    type="button"
                    className="country-code-button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    {COUNTRY_CODES.find(c => c.code === formData.countryCode)?.flag} {formData.countryCode}
                  </button>
                  {showCountryDropdown && (
                    <div className="country-dropdown-menu">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={handleCountrySearch}
                        className="country-search-input"
                        autoFocus
                      />
                      <div className="country-list">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <button
                              key={`${country.code}-${country.country}`}
                              type="button"
                              className={`country-option ${formData.countryCode === country.code ? 'selected' : ''}`}
                              onClick={() => handleSelectCountry(country.code)}
                            >
                              <span className="country-flag">{country.flag}</span>
                              <span className="country-name">{country.country}</span>
                              <span className="country-code">{country.code}</span>
                            </button>
                          ))
                        ) : (
                          <div className="no-results">No countries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder={COUNTRY_CODES.find(c => c.code === formData.countryCode) ? `${COUNTRY_CODES.find(c => c.code === formData.countryCode).digits} digits` : 'Phone number'}
                  value={formData.phone}
                  onChange={handleChange}
                  className={`phone-input ${phoneError ? 'input-error' : ''}`}
                />
              </div>
              {phoneError && <small className="error-text">{phoneError}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
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
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password toggle-password-large"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
          <p className="terms">
            By creating an account, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
