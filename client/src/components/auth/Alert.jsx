import React from 'react';
import './Alert.css';

export const Alert = ({ type, message, onClose }) => {
  React.useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        <span className="alert-icon">
          {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </span>
        <span className="alert-message">{message}</span>
      </div>
      <button className="alert-close" onClick={onClose}>×</button>
    </div>
  );
};
