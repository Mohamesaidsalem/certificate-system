import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock, User, LogOut, Eye, EyeOff, AlertCircle, Plane } from "lucide-react";
import { supabase } from "./supabaseClient";
import CertificateManagementSystem from "./CertificateManagementSystem";

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Login Component
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Default users data
  const users = [
    {
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "Administrator",
      permissions: {
        readOnly: false,
        allowDelete: true,
        canEdit: true,
        canAdd: true,
        canDeliver: true,
        canImport: true,
        canExport: true,
      },
    },
    {
      username: "viewer",
      password: "viewer123",
      role: "viewer",
      name: "Viewer User",
      permissions: {
        readOnly: true,
        allowDelete: false,
        canEdit: false,
        canAdd: false,
        canDeliver: false,
        canImport: false,
        canExport: true,
      },
    },
    {
      username: "cert",
      password: "cert123",
      role: "certificate-only",
      name: "Certificate Viewer",
      permissions: {
        readOnly: true,
        allowDelete: false,
        canEdit: false,
        canAdd: false,
        canDeliver: false,
        canImport: false,
        canExport: true,
      },
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      login(user);
    } else {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  const quickLogin = (role) => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setUsername(user.username);
      setPassword(user.password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4 shadow-lg">
            <Plane className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Smart Aviation
          </h1>
          <p className="text-gray-600">Certificate Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Sign In
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Quick Login Demo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              Quick login for testing:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin("admin")}
                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => quickLogin("viewer")}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
              >
                Viewer
              </button>
              <button
                onClick={() => quickLogin("certificate-only")}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
              >
                Cert Only
              </button>
            </div>
          </div>

          {/* Users Info */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Login Credentials:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Admin:</strong> admin / admin123
              </p>
              <p>
                <strong>Viewer:</strong> viewer / viewer123
              </p>
              <p>
                <strong>Cert Only:</strong> cert / cert123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Smart Aviation. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// Top Bar Component
const TopBar = ({ user, onLogout }) => {
  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: "System Admin", color: "bg-purple-600" },
      viewer: { text: "Viewer", color: "bg-green-600" },
      "certificate-only": { text: "Certificates Only", color: "bg-blue-600" },
    };
    return badges[role] || badges["viewer"];
  };

  const badge = getRoleBadge(user.role);

  return (
    <div className="bg-white shadow-md border-b border-gray-200 print:hidden">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User size={20} className="text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <span
              className={`text-xs px-2 py-1 rounded-full text-white ${badge.color}`}
            >
              {badge.text}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("currentUser");
      }
    }
    setLoading(false);
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
function App() {
  const { currentUser, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <TopBar user={currentUser} onLogout={logout} />
      <CertificateManagementSystem
        readOnly={currentUser.permissions.readOnly}
        allowDelete={currentUser.permissions.allowDelete}
      />
    </div>
  );
}

// Final Wrapper
export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
