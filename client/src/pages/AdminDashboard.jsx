import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import SystemOverview from "../components/Admin/SystemOverview";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [trades, setTrades] = useState([]);
  const token = localStorage.getItem("token");

  const fetchAdminData = useCallback(async () => {
    try {
      const [companiesRes, tradesRes] = await Promise.all([
        axios.get("http://localhost:5050/api/approve?approved=false", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5050/api/trades", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCompanies(companiesRes.data);
      setTrades(tradesRes.data.reverse());
    } catch (err) {
      console.error("Failed to fetch admin data:", err.message);
      toast.error("Error loading admin data");
    }
  }, [token]);

  const approveCompany = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5050/api/approve/company/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Company approved");
      fetchAdminData();
    } catch (err) {
      toast.error("❌ Company approval failed");
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return (
    <>
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-10">Admin Dashboard</h1>

        {/* 📊 System Overview */}
        <SystemOverview token={token} />

        {/* 🏢 Pending Companies */}
        <section className="mb-12 mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Pending Companies</h2>
          {companies.length === 0 ? (
            <p className="text-gray-500 italic">No pending companies.</p>
          ) : (
            companies.map((company) => (
              <div
                key={company._id}
                className="border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition flex justify-between items-center bg-white"
              >
                <span className="text-gray-700 font-medium">{company.name}</span>
                <button
                  onClick={() => approveCompany(company._id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
                >
                  Approve
                </button>
              </div>
            ))
          )}
        </section>

        {/* 📄 Trade Audit Log */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Trade Audit Log</h2>
          {trades.length === 0 ? (
            <p className="text-gray-500 italic">No trades available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">From</th>
                    <th className="p-3">To</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t._id} className="border-t">
                      <td className="p-3">{t.type}</td>
                      <td className="p-3">{t.amount}</td>
                      <td
                        className={`p-3 ${
                          t.status === "completed" ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {t.status}
                      </td>
                      <td className="p-3">{t.fromCompany || "-"}</td>
                      <td className="p-3">{t.toCompany || "-"}</td>
                      <td className="p-3">{new Date(t.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;
