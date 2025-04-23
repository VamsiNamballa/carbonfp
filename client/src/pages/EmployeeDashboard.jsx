import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import carbonLogo from "../assets/Carbonfp-logo.jpg"; // ✅ Update path if different

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

  const API = axios.create({
    baseURL: "http://localhost:5050/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchApprovalStatus = async () => {
    try {
      const res = await API.get("/auth/employee/status");
      setCompanyApproved(res.data.companyApproved);
      setUserApproved(res.data.employeeStatus === "approved");
    } catch {
      toast.error("❌ Failed to fetch approval status");
    }
  };

  const calculateDistance = async () => {
    try {
      const res = await API.post("/travel/calculate", {
        from,
        to,
        travelStyle,
      });
      setDistance(res.data.distanceKm);
      setCredits(res.data.carbonCreditsEarned);
      toast.success("📏 Distance calculated!");
    } catch {
      toast.error("❌ Failed to calculate distance. Try valid locations.");
    }
  };

  const logTravel = async () => {
    try {
      await API.post("/travel/log", {
        from,
        to,
        distanceKm: distance,
        carbonCreditsEarned: credits,
        travelStyle,
      });
      toast.success("✅ Travel logged!");
      fetchLogs();
      fetchLeaderboard();
    } catch {
      toast.error("❌ Failed to log travel");
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get(`/travel/user/${user.id}`);
      setLogs(res.data);
    } catch {
      toast.error("❌ Failed to fetch travel logs");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await API.get("/company/my/leaderboard");
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
      <div className="p-8 text-center text-lg relative">
        <button
          onClick={logout}
          className="absolute top-4 right-6 text-sm text-red-600 underline"
        >
          Logout
        </button>
        <h1 className="text-2xl font-bold text-red-600 mb-2">🚫 Access Restricted</h1>
        {!companyApproved && (
          <p className="text-red-500">Your company is not yet approved by the admin.</p>
        )}
        {!userApproved && (
          <p className="text-yellow-500 mt-1">You are still pending approval from your employer.</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-6xl mx-auto space-y-10 relative">
      {/* 🔴 Logout */}
      <div className="flex justify-end">
        <button
          onClick={logout}
          className="px-4 py-1 text-sm text-red-600 border border-red-500 rounded hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>

      {/* ✅ Logo and Title */}
      <div className="flex flex-col items-center space-y-4">
        <img
          src={carbonLogo}
          alt="CarbonFP Logo"
          className="w-20 h-20 object-contain rounded-full shadow"
        />
        <h1 className="text-4xl font-bold text-green-700">Employee Dashboard</h1>
        <p className="text-gray-600 text-sm">
          Logged in as <strong>{user.username}</strong> (<strong>Employee</strong>)
        </p>
      </div>

      {/* 🚴 Travel Calculator */}
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">🚶 Log Your Travel</h2>

        <select
          value={travelStyle}
          onChange={(e) => setTravelStyle(e.target.value)}
          className="w-full p-2 border rounded"
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
          className="w-full p-2 border rounded"
        />

        <button
          onClick={calculateDistance}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          🚗 Calculate Distance
        </button>

        {distance && (
          <>
            <p className="text-center text-sm text-gray-700">
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

      {/* 📜 Travel Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-3">📜 Travel Logs</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No logs yet. Start traveling green 🌿</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-gray-700">
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
                  <tr key={log._id} className="odd:bg-white even:bg-gray-50">
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

      {/* 🏆 Leaderboard */}
      <div>
        <h2 className="text-xl font-semibold mb-3">🏆 Company Leaderboard</h2>
        {loading ? (
          <p className="text-gray-500">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-gray-500 italic">No contributions yet from your company.</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
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
                  <tr key={entry.employeeId} className="odd:bg-white even:bg-yellow-50">
                    <td className="p-2">#{index + 1}</td>
                    <td className="p-2">{entry.name}</td>
                    <td className="p-2">{entry.totalCredits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
