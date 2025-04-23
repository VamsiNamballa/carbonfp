import { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import carbonLogo from "../assets/Carbonfp-logo.png";

const EmployeeDashboard = () => {
  const [travelStyle, setTravelStyle] = useState("Public Transport");
  const [from, setFrom] = useState("");
  const to = "Florida Atlantic University";
  const [distance, setDistance] = useState(null);
  const [credits, setCredits] = useState(null);
  const [logs, setLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyApproved, setCompanyApproved] = useState(false);
  const [userApproved, setUserApproved] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchApprovalStatus = async () => {
    try {
      const res = await axios.get("/api/auth/employee/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanyApproved(res.data.companyApproved);
      setUserApproved(res.data.employeeStatus === "approved");
    } catch {
      toast.error("❌ Failed to fetch approval status");
    }
  };

  const calculateDistance = async () => {
    try {
      const res = await axios.post(
        "/api/travel/calculate",
        { from, to, travelStyle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDistance(res.data.distanceKm);
      setCredits(res.data.carbonCreditsEarned);
      toast.success("📏 Distance calculated!");
    } catch {
      toast.error("❌ Failed to calculate distance. Try valid locations.");
    }
  };

  const logTravel = async () => {
    try {
      await axios.post(
        "/api/travel/log",
        {
          from,
          to,
          distanceKm: distance,
          carbonCreditsEarned: credits,
          travelStyle,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Travel logged!");
      fetchLogs();
      fetchLeaderboard();
    } catch {
      toast.error("❌ Failed to log travel");
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`/api/travel/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch {
      toast.error("❌ Failed to fetch travel logs");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get("/api/company/my/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaderboard(res.data);
    } catch {
      toast.error("❌ Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalStatus();
    fetchLogs();
    fetchLeaderboard();
  }, []);

  if (!companyApproved || !userApproved) {
    return (
      <div className="p-8 text-center text-lg relative min-h-screen bg-white">
        <button
          onClick={logout}
          className="mt-8 px-4 py-2 bg-red-100 text-red-600 rounded shadow hover:bg-red-200 transition"
        >
          Logout
        </button>
        <h1 className="text-2xl font-bold text-red-600 mt-4">🚫 Access Restricted</h1>
        {!companyApproved && (
          <p className="text-red-500">Your company is not yet approved by the admin.</p>
        )}
        {!userApproved && (
          <p className="text-yellow-500 mt-1">
            You are still pending approval from your employer.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Logo and Title */}
      <div className="flex flex-col items-center space-y-4 mt-4 mb-8">
        <img
          src={carbonLogo}
          alt="CarbonFP Logo"
          className="h-20 w-auto object-contain drop-shadow-md"
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-green-700">Employee Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Logged in as <strong>{user.username}</strong> (<strong>Employee</strong>)
        </p>
      </div>

      {/* Travel Logger */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-orange-600 flex items-center gap-2">
          🚶 Log Your Travel
        </h2>

        <select
          value={travelStyle}
          onChange={(e) => setTravelStyle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="Work From Home">🏠 Work From Home</option>
          <option value="Public Transport">🚌 Public Transport</option>
          <option value="Bicycle">🚴 Bicycle</option>
        </select>

        <input
          type="text"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="📍 Enter Start Location"
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={calculateDistance}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          🚗 Calculate Distance
        </button>

        {distance && (
          <>
            <p className="text-center text-gray-600 text-sm">
              📍 <strong>{distance} km</strong> | 🎁 <strong>{credits} credits</strong>
            </p>
            <button
              onClick={logTravel}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              ✅ Log Travel
            </button>
          </>
        )}
      </div>

      {/* Travel Logs */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-yellow-600 mb-3">📜 Travel Logs</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No logs yet. Start traveling green 🌿</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left">From</th>
                  <th className="p-2 text-left">To</th>
                  <th className="p-2 text-left">Distance</th>
                  <th className="p-2 text-left">Credits</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="odd:bg-white even:bg-gray-50 hover:bg-green-50">
                    <td className="p-2">{log.from}</td>
                    <td className="p-2">{log.to}</td>
                    <td className="p-2">{log.distanceKm}</td>
                    <td className="p-2">{log.carbonCreditsEarned}</td>
                    <td className="p-2">
                      {new Date(log.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-amber-700 mb-3">🏆 Company Leaderboard</h2>
        {loading ? (
          <p className="text-gray-500">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-gray-500 italic">No contributions yet from your company.</p>
        ) : (
          <div className="overflow-x-auto max-h-64 overflow-y-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-yellow-100 text-gray-800">
                <tr>
                  <th className="p-2 text-left">Rank</th>
                  <th className="p-2 text-left">Employee</th>
                  <th className="p-2 text-left">Total Credits</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.employeeId}
                    className="odd:bg-white even:bg-yellow-50 hover:bg-yellow-100"
                  >
                    <td className="p-2 font-medium">#{index + 1}</td>
                    <td className="p-2">{entry.name}</td>
                    <td className="p-2">{entry.totalCredits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="flex justify-center mt-12">
        <button
          onClick={logout}
          className="px-5 py-2 text-sm text-red-600 border border-red-500 rounded hover:bg-red-100 transition"
        >
          🔓 Logout
        </button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;