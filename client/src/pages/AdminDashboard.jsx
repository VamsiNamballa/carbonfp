import { useEffect, useState, useCallback } from "react";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import SystemOverview from "../components/Admin/SystemOverview";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [trades, setTrades] = useState([]);
  const token = localStorage.getItem("token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchAdminData = useCallback(async () => {
    try {
      const [companiesRes, tradesRes] = await Promise.all([
        axios.get("/approve?approved=false", authHeader),
        axios.get("/trades", authHeader),
      ]);

      setCompanies(companiesRes.data);
      setTrades(tradesRes.data.reverse());
    } catch (err) {
      console.error("Failed to fetch admin data:", err.message);
      toast.error("❌ Error loading admin data");
    }
  }, [token]);

  const approveCompany = async (id) => {
    try {
      await axios.patch(`/approve/company/${id}`, {}, authHeader);
      toast.success("✅ Company approved");
      fetchAdminData();
    } catch {
      toast.error("❌ Company approval failed");
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-32 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center">
            <p className="text-gray-600">Logged in as: <strong>Admin</strong> — Admin</p>
          </div>

          {/* System Overview */}
          <section>
            <SystemOverview />
          </section>

          {/* Pending Companies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pending Companies</h2>
            {companies.length === 0 ? (
              <p className="text-gray-500 italic">No pending companies.</p>
            ) : (
              <div className="space-y-3">
                {companies.map((company) => (
                  <div
                    key={company._id}
                    className="border rounded-lg p-4 shadow-sm hover:shadow-md transition flex justify-between items-center bg-white"
                  >
                    <span className="text-gray-700 font-medium">{company.name}</span>
                    <button
                      onClick={() => approveCompany(company._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Trade Audit Log */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trade Audit Log</h2>
            {trades.length === 0 ? (
              <p className="text-gray-500 italic">No trades available.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-md bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">From</th>
                      <th className="p-3 text-left">To</th>
                      <th className="p-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t._id} className="border-t">
                        <td className="p-3">{t.type}</td>
                        <td className="p-3">{t.amount}</td>
                        <td
                          className={`p-3 ${
                            t.status === "completed"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {t.status}
                        </td>
                        <td className="p-3">{t.fromCompany || "-"}</td>
                        <td className="p-3">{t.toCompany || "-"}</td>
                        <td className="p-3">
                          {new Date(t.updatedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;
