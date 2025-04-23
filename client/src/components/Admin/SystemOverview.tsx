import { useEffect, useState } from "react";
import axios from "../api/axiosInstance";

const SystemOverview = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    approvedCompanies: 0,
    pendingCompanies: 0,
    totalTrades: 0,
    totalCredits: 0,
    pendingEmployers: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch system stats:", err);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard title="🏢 Total Companies" value={stats.totalCompanies} />
      <StatCard title="✅ Approved Companies" value={stats.approvedCompanies} />
      <StatCard title="⏳ Pending Companies" value={stats.pendingCompanies} />
      <StatCard title="📊 Total Trades" value={stats.totalTrades} />
      <StatCard title="🎁 Total Credits Traded" value={stats.totalCredits} />
      <StatCard title="🧑‍💼 Pending Employers" value={stats.pendingEmployers} />
    </div>
  );
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white shadow p-4 rounded text-center">
    <h3 className="text-gray-600 text-sm">{title}</h3>
    <p className="text-xl font-bold text-green-700">{value}</p>
  </div>
);

export default SystemOverview;
