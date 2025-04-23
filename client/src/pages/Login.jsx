import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/carbonfp-logo.jpg";
import api from "../api/axiosInstance";

const ROLES = {
  EMPLOYEE: "employee",
  EMPLOYER: "employer",
  ADMIN: "admin",
};

function LoginForm({
  form,
  errors,
  handleChange,
  handleSubmit,
  loading,
  showPassword,
  setShowPassword,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
      {/* Role */}
      <div className="flex flex-col">
        <label htmlFor="role" className="text-sm font-medium mb-1">Role</label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          className={`p-2 rounded border ${errors.role ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          required
        >
          <option value={ROLES.EMPLOYEE}>Employee</option>
          <option value={ROLES.EMPLOYER}>Employer</option>
          <option value={ROLES.ADMIN}>Admin</option>
        </select>
        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
      </div>

      {/* Company */}
      {form.role !== ROLES.ADMIN && (
        <div className="flex flex-col">
          <label htmlFor="company" className="text-sm font-medium mb-1">Company</label>
          <input
            id="company"
            type="text"
            name="company"
            placeholder="Enter your company"
            value={form.company}
            onChange={handleChange}
            className={`p-2 rounded border ${errors.company ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            required
          />
          {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
        </div>
      )}

      {/* Username */}
      <div className="flex flex-col">
        <label htmlFor="username" className="text-sm font-medium mb-1">Username</label>
        <input
          id="username"
          type="text"
          name="username"
          placeholder="Enter your username"
          value={form.username}
          onChange={handleChange}
          className={`p-2 rounded border ${errors.username ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          required
        />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col mb-6">
        <label htmlFor="password" className="text-sm font-medium mb-1">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            className={`p-2 rounded border w-full ${errors.password ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-2 text-gray-500 text-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className={`w-full py-2 text-white text-sm font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </button>
    </form>
  );
}

export default function Login() {
  const [form, setForm] = useState({
    company: "",
    username: "",
    password: "",
    role: ROLES.EMPLOYEE,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    if (!value.trim()) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    return "";
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      if (form.role === ROLES.ADMIN && key === "company") return;
      newErrors[key] = validateField(key, form[key]);
    });
    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);
      if (user.companyId) {
        localStorage.setItem("companyId", user.companyId);
      }

      navigate(`/dashboard/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Carbonfp Logo"
            className="h-16 w-auto object-contain rounded-xl shadow-sm"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-green-700 mb-4">
          Login to CarbonFP
        </h2>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-3 text-center font-medium" aria-live="assertive">
            {error}
          </p>
        )}

        {/* Login Form */}
        <LoginForm
          form={form}
          errors={errors}
          handleChange={handleChange}
          handleSubmit={handleLogin}
          loading={loading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
