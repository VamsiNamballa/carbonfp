import React, { useEffect, useState } from "react";
import axios from "axios";

interface Stats {
  totalCompanies: number;
  approvedCompanies: number;
  pendingCompanies: number;
  totalTrades: number;
  totalCredits: number;
  pendingEmployers: number; // ✅ NEW
}

interface Props {
  token: string;
}

const SystemOverview: React.FC<Props> = ({ token }) => {
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    approvedCompanies: 0,
    pendingCompanies: 0,
    totalTrades: 0,
    totalCredits: 0,
    pendingEmployers: 0, // ✅ INIT
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5050/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch stats:", err);
      }
    };

    if (token) fetchStats();
  }, [token]);

  return (
    <div className="bg-white border rounded-xl shadow p-6 mt-10">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">📊 System Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 text-sm sm:text-base">
        <div className="p-3 border rounded-md bg-gray-50">
          <strong>Total Companies:</strong> {stats.totalCompanies}
        </div>
        <div className="p-3 border rounded-md bg-gray-50">
          <strong>Approved Companies:</strong> {stats.approvedCompanies}
        </div>
        <div className="p-3 border rounded-md bg-gray-50">
          <strong>Pending Companies:</strong> {stats.pendingCompanies}
        </div>
        <div className="p-3 border rounded-md bg-gray-50">
          <strong>Total Trades:</strong> {stats.totalTrades}
        </div>
        <div className="p-3 border rounded-md bg-gray-50">
          <strong>Total Credits:</strong> {stats.totalCredits}
        </div>
        <div className="p-3 border rounded-md bg-gray-50">
          <strong>Pending Employers:</strong> {stats.pendingEmployers}
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
