import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, adminAPI } from "../../api/auth.js";
import { Alert } from "./Alert.jsx";
import Header from "../Header";
import "./AdminDashboard.css";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    engineers: 0,
    admins: 0,
  });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showRoleConfirm, setShowRoleConfirm] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    countryCode: "+1",
    phone: "",
    gender: "",
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const COUNTRY_CODES = [
    { code: "+1", country: "US", flag: "🇺🇸", digits: 10 },
    { code: "+44", country: "UK", flag: "🇬🇧", digits: 10 },
    { code: "+33", country: "France", flag: "🇫🇷", digits: 9 },
    { code: "+49", country: "Germany", flag: "🇩🇪", digits: 11 },
    { code: "+39", country: "Italy", flag: "🇮🇹", digits: 10 },
    { code: "+34", country: "Spain", flag: "🇪🇸", digits: 9 },
    { code: "+31", country: "Netherlands", flag: "🇳🇱", digits: 9 },
    { code: "+32", country: "Belgium", flag: "🇧🇪", digits: 9 },
    { code: "+41", country: "Switzerland", flag: "🇨🇭", digits: 9 },
    { code: "+43", country: "Austria", flag: "🇦🇹", digits: 10 },
    { code: "+45", country: "Denmark", flag: "🇩🇰", digits: 8 },
    { code: "+46", country: "Sweden", flag: "🇸🇪", digits: 9 },
    { code: "+47", country: "Norway", flag: "🇳🇴", digits: 8 },
    { code: "+358", country: "Finland", flag: "🇫🇮", digits: 9 },
    { code: "+48", country: "Poland", flag: "🇵🇱", digits: 9 },
    { code: "+30", country: "Greece", flag: "🇬🇷", digits: 10 },
    { code: "+90", country: "Turkey", flag: "🇹🇷", digits: 10 },
    { code: "+20", country: "Egypt", flag: "🇪🇬", digits: 10 },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", digits: 9 },
    { code: "+971", country: "UAE", flag: "🇦🇪", digits: 9 },
    { code: "+91", country: "India", flag: "🇮🇳", digits: 10 },
    { code: "+92", country: "Pakistan", flag: "🇵🇰", digits: 10 },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩", digits: 10 },
    { code: "+86", country: "China", flag: "🇨🇳", digits: 11 },
    { code: "+81", country: "Japan", flag: "🇯🇵", digits: 10 },
    { code: "+82", country: "South Korea", flag: "🇰🇷", digits: 10 },
    { code: "+60", country: "Malaysia", flag: "🇲🇾", digits: 9 },
    { code: "+65", country: "Singapore", flag: "🇸🇬", digits: 8 },
    { code: "+62", country: "Indonesia", flag: "🇮🇩", digits: 10 },
    { code: "+66", country: "Thailand", flag: "🇹🇭", digits: 9 },
    { code: "+84", country: "Vietnam", flag: "🇻🇳", digits: 9 },
    { code: "+61", country: "Australia", flag: "🇦🇺", digits: 9 },
    { code: "+64", country: "New Zealand", flag: "🇳🇿", digits: 9 },
    { code: "+55", country: "Brazil", flag: "🇧🇷", digits: 11 },
    { code: "+54", country: "Argentina", flag: "🇦🇷", digits: 10 },
    { code: "+56", country: "Chile", flag: "🇨🇱", digits: 9 },
    { code: "+57", country: "Colombia", flag: "🇨🇴", digits: 10 },
    { code: "+52", country: "Mexico", flag: "🇲🇽", digits: 10 },
    { code: "+1", country: "Canada", flag: "🇨🇦", digits: 10 },
  ];

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, pagination.page]);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.user.role !== "super_admin") {
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "all" && { role: roleFilter }),
      };

      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
      setPagination((prev) => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setAlert({ type: "success", message: "User role updated successfully" });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Role change error:", error);
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to update role",
      });
    }
    setShowRoleConfirm(null);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      setAlert({ type: "success", message: "User deleted successfully" });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Delete user error:", error);
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to delete user",
      });
    }
    setShowDeleteConfirm(null);
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await adminAPI.getUser(userId);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error("View user error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
      setAlert({ type: "error", message: "Failed to load user details" });
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !newUserForm.firstName ||
      !newUserForm.lastName ||
      !newUserForm.email ||
      !newUserForm.password
    ) {
      setAlert({ type: "error", message: "All fields are required" });
      return;
    }

    if (newUserForm.password !== newUserForm.confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match" });
      return;
    }

    if (newUserForm.password.length < 8) {
      setAlert({
        type: "error",
        message: "Password must be at least 8 characters",
      });
      return;
    }

    try {
      await adminAPI.createUser({
        firstName: newUserForm.firstName,
        lastName: newUserForm.lastName,
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role,
        phone: newUserForm.phone
          ? `${newUserForm.countryCode}${newUserForm.phone}`
          : null,
        gender: newUserForm.gender || null,
      });

      setAlert({ type: "success", message: "User created successfully" });
      setNewUserForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "customer",
        countryCode: "+1",
        phone: "",
        gender: "",
      });
      setShowAddUserModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Add user error:", error);
      setAlert({
        type: "error",
        message: error.response?.data?.error || "Failed to create user",
      });
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header with Navigation */}
      <Header />

      <div className="dashboard-container" style={{ marginTop: "80px" }}>
        {/* Page Title */}
        <div className="page-header">
          <h2>User Management</h2>
          <p>View, manage, and assign roles to all users in the system.</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <span>👥</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Users</p>
              <h3 className="stat-value">{stats.total.toLocaleString()}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <span>🛡️</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Admins</p>
              <h3 className="stat-value">{stats.admins}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cyan">
              <span>⚙️</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Engineers</p>
              <h3 className="stat-value">{stats.engineers}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <span>👤</span>
            </div>
            <div className="stat-content">
              <p className="stat-label">Customers</p>
              <h3 className="stat-value">{stats.customers.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="table-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="all">Filter by Role</option>
              <option value="customer">Customer</option>
              <option value="engineer">Engineer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              className="add-customer-btn"
              onClick={() => setShowAddUserModal(true)}
            >
              + Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="customer-info">
                        <span className="customer-email">{user.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="customer-info">
                        <button
                          className="customer-name"
                          onClick={() => handleViewUser(user.id)}
                        >
                          {user.firstName} {user.lastName}
                        </button>
                        <span className="customer-email">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          setShowRoleConfirm({
                            userId: user.id,
                            newRole: e.target.value,
                            userName: `${user.firstName} ${user.lastName}`,
                          })
                        }
                        className="role-select"
                        disabled={user.role === "super_admin"}
                      >
                        <option value="customer">Customer</option>
                        <option value="engineer">Engineer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{formatDate(user.lastLogin)}</td>
                    <td>
                      <div className="actions-menu">
                        <button
                          className="action-btn"
                          onClick={() =>
                            setShowDeleteConfirm({
                              userId: user.id,
                              userName: `${user.firstName} ${user.lastName}`,
                            })
                          }
                          disabled={user.role === "super_admin"}
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">
                  {selectedUser.phone || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value role-badge">
                  {selectedUser.role}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Signup Date:</span>
                <span className="detail-value">
                  {formatDate(selectedUser.createdAt)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Login:</span>
                <span className="detail-value">
                  {formatDate(selectedUser.lastLogin)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="modal confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{showDeleteConfirm.userName}</strong>?
              </p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm.userId)}
                className="btn-delete"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {showRoleConfirm && (
        <div className="modal-overlay" onClick={() => setShowRoleConfirm(null)}>
          <div
            className="modal confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Confirm Role Change</h3>
              <button
                onClick={() => setShowRoleConfirm(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Change <strong>{showRoleConfirm.userName}</strong>'s role to{" "}
                <strong>{showRoleConfirm.newRole}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowRoleConfirm(null)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleRoleChange(
                    showRoleConfirm.userId,
                    showRoleConfirm.newRole
                  )
                }
                className="btn-confirm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            className="modal add-user-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={newUserForm.firstName}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={newUserForm.lastName}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ position: "relative", flex: "0 0 120px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowCountryDropdown(!showCountryDropdown)
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "6px",
                          color: "#e2e8f0",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "14px",
                        }}
                      >
                        <span>
                          {
                            COUNTRY_CODES.find(
                              (c) => c.code === newUserForm.countryCode
                            )?.flag
                          }{" "}
                          {newUserForm.countryCode}
                        </span>
                        <span>▼</span>
                      </button>
                      {showCountryDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#0f1419",
                            border: "1px solid #334155",
                            borderRadius: "6px",
                            marginTop: "4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000,
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              background: "#1e293b",
                              border: "none",
                              borderBottom: "1px solid #334155",
                              color: "#e2e8f0",
                              fontSize: "12px",
                              boxSizing: "border-box",
                            }}
                          />
                          {COUNTRY_CODES.filter(
                            (c) =>
                              c.country
                                .toLowerCase()
                                .includes(countrySearch.toLowerCase()) ||
                              c.code.includes(countrySearch)
                          ).map((country) => (
                            <div
                              key={country.code}
                              onClick={() => {
                                setNewUserForm({
                                  ...newUserForm,
                                  countryCode: country.code,
                                });
                                setShowCountryDropdown(false);
                                setCountrySearch("");
                              }}
                              style={{
                                padding: "10px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid #1e293b",
                                fontSize: "12px",
                                color: "#e2e8f0",
                              }}
                              onMouseEnter={(e) =>
                                (e.target.style.background = "#1e293b")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.background = "transparent")
                              }
                            >
                              {country.flag} {country.code} {country.country}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={newUserForm.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const maxDigits =
                          COUNTRY_CODES.find(
                            (c) => c.code === newUserForm.countryCode
                          )?.digits || 10;
                        setNewUserForm({
                          ...newUserForm,
                          phone: digits.slice(0, maxDigits),
                        });
                      }}
                      placeholder="Phone number"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={newUserForm.gender}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, role: e.target.value })
                    }
                    required
                  >
                    <option value="customer">Customer</option>
                    <option value="engineer">Engineer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter password (min 8 characters)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    value={newUserForm.confirmPassword}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
