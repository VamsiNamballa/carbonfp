import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  const isAuthenticated = Boolean(token && role);
  const publicPaths = ["/", "/login", "/register"];

  // 🧭 Redirect authenticated users from login/register to dashboard
  if (isAuthenticated && publicPaths.includes(location.pathname)) {
    return <Navigate to={`/dashboard/${role}`} replace />;
  }

  // 🔐 Redirect unauthenticated users from protected routes
  const protect = (element, requiredRole) =>
    isAuthenticated && role === requiredRole ? element : <Navigate to="/" replace />;

  return (
    <Routes>
      {/* 🔓 Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 🔐 Protected Dashboards */}
      <Route path="/dashboard/employee" element={protect(<EmployeeDashboard />, "employee")} />
      <Route path="/dashboard/employer" element={protect(<EmployerDashboard />, "employer")} />
      <Route path="/dashboard/admin" element={protect(<AdminDashboard />, "admin")} />

      {/* 🔁 Fallback to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
