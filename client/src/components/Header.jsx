import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaChartBar, FaDatabase, FaCog } from "react-icons/fa";
import { authAPI } from "../api/auth";
import logo from "../assets/ME Logo.svg";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const userRole = localStorage.getItem("userRole");
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        console.log("✅ User data fetched:", response.data.user);
        setUserData(response.data.user);
      } catch (error) {
        console.error("❌ Failed to fetch user data:", error);
        // Fallback to localStorage or default
        const fallbackData = {
          firstName: localStorage.getItem("firstName") || "User",
          lastName: localStorage.getItem("lastName") || "Name",
          email: localStorage.getItem("email") || "user@example.com",
        };
        console.log("📦 Using fallback data:", fallbackData);
        setUserData(fallbackData);
      }
    };

    fetchUserData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Determine nav items based on user role and current page
  let navItems = userRole === "admin"
    ? [
      { name: "Home", path: "/dashboard", icon: FaHome },
      { name: "Results", path: "/results", icon: FaChartBar },
      { name: "Projects", path: "/projects", icon: FaDatabase },
      { name: "Fan Data", path: "/fans", icon: FaDatabase },
      { name: "Motor Data", path: "/motors", icon: FaCog },
    ]
    : [
      { name: "Home", path: "/dashboard", icon: FaHome },
      { name: "Results", path: "/results", icon: FaChartBar },
      { name: "Projects", path: "/projects", icon: FaDatabase },
    ];

  // Hide "Home" and "Results" on admin dashboard page
  if (location.pathname === "/admin/dashboard") {
    navItems = navItems.filter(
      (item) => item.path !== "/dashboard" && item.path !== "/results"
    );
  }

  return (
    <header
      className="header"
      style={{
        background: "linear-gradient(135deg, #0D1D5A 0%, #265DE7 100%)",
        padding: "1rem 2rem",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transform: isVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Left: Logo and Name */}
        <Link to="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img
              src={logo}
              alt="Company Logo"
              style={{
                height: "50px",
                width: "auto",
                filter: "brightness(0) invert(1)", // Makes logo white
              }}
            />
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "white",
              }}
            >
              Mechatronics
            </span>
          </div>
        </Link>

        {/* Center: Navigation with Icons */}
        <div style={{ display: "flex", gap: "2.5rem" }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isDisabled =
              item.path === "/results" &&
              location.pathname === "/fan-selection";
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  textDecoration: "none",
                  pointerEvents: isDisabled ? "none" : "auto",
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    padding: "0.25rem 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <IconComponent
                    size={20}
                    style={{
                      color: isActive ? "white" : "#95A0CE",
                      transition: "color 0.3s ease",
                    }}
                  />
                  <span
                    className={isActive ? "nav-item active" : "nav-item"}
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: isActive ? "white" : "#95A0CE",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {item.name}
                  </span>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-4px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: isActive ? "100%" : "0",
                      height: "2px",
                      background: "white",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right: User Profile */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* User Profile Dropdown */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={() => {
                console.log(
                  "🖱️ User icon clicked! Current state:",
                  showDropdown
                );
                console.log("👤 User data:", userData);
                setShowDropdown(!showDropdown);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "45px",
                height: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {userData?.firstName?.[0]?.toUpperCase() || "U"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "55px",
                  right: 0,
                  background:
                    "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  borderRadius: "12px",
                  boxShadow:
                    "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  minWidth: "280px",
                  zIndex: 1001,
                  overflow: "hidden",
                }}
              >
                {/* User Info */}
                <div
                  style={{
                    padding: "1.25rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {userData ? (
                    <>
                      <div
                        style={{
                          color: "#ffffff",
                          fontWeight: "600",
                          fontSize: "1.125rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {userData.firstName} {userData.lastName}
                      </div>
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.875rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {userData.email}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          background: "#3b82f6",
                          color: "#ffffff",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {userData.role || "user"}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                      Loading...
                    </div>
                  )}
                </div>

                {/* Theme Toggle (Placeholder) */}
                <button
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "transparent",
                    border: "none",
                    color: "#cbd5e1",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#334155")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>Dark Mode</span>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    (Coming Soon)
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "transparent",
                    border: "none",
                    borderTop: "1px solid #334155",
                    color: "#ef4444",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#334155")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
