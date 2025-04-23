import { useEffect, useState } from "react";
import axios from "axios";

const CompanyInsights = () => {
  const [logs, setLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [credits, setCredits] = useState(0);
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("companyId");

  const API = axios.create({
    baseURL: "http://localhost:5050/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchCompanyData = async () => {
    try {
      const [logRes, leaderRes, companyRes] = await Promise.all([
        API.get(`/company/${companyId}/logs`),
        API.get(`/company/${companyId}/contributions`),
        API.get("/company/me"),
      ]);

      setLogs(logRes.data);
      setLeaderboard(leaderRes.data);
      setCredits(companyRes.data.credits || 0);
    } catch (err) {
      console.error("Failed to load company insights", err);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  return (
    <div className="space-y-10">
      <div className="bg-blue-100 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-blue-800">🏢 Company Credits</h2>
        <p className="text-lg mt-2 text-blue-700">Available: {credits} credits</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">📋 Employee Travel Logs</h2>
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Style</th>
              <th className="p-2 border">Credits</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="text-center">
                <td className="p-2 border">{log.date}</td>
                <td className="p-2 border">{log.name}</td>
                <td className="p-2 border">{log.travelStyle}</td>
                <td className="p-2 border">{log.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">🏆 Leaderboard</h2>
        <table className="w-full border text-sm">
          <thead className="bg-yellow-100">
            <tr>
              <th className="p-2 border">Rank</th>
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Total Credits</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((e, i) => (
              <tr key={e.employeeId} className="text-center">
                <td className="p-2 border">#{i + 1}</td>
                <td className="p-2 border">{e.name}</td>
                <td className="p-2 border">{e.totalCredits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyInsights;
