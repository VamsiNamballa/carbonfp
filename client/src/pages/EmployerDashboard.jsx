import { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const EmployerDashboard = () => {
  const [credits, setCredits] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [logsByEmployee, setLogsByEmployee] = useState({});
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [trades, setTrades] = useState([]);
  const [ads, setAds] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingRequestsMap, setIncomingRequestsMap] = useState({});
  const [tradeType, setTradeType] = useState("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [employerInfo, setEmployerInfo] = useState({});
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchDashboardData = async () => {
    try {
      const [
        statusRes,
        dashboardRes,
        tradesRes,
        pendingRes,
        requestsRes,
        adsRes,
      ] = await Promise.all([
        axios.get("/employer/status", authHeader),
        axios.get("/employer/dashboard", authHeader),
        axios.get("/employer/trades/history", authHeader),
        axios.get("/employer/employees/pending", authHeader),
        axios.get("/trade-requests/mine", authHeader),
        axios.get("/trades/ads/other", authHeader),
      ]);

      setEmployerInfo(statusRes.data);
      setCredits(dashboardRes.data.totalCredits);
      setLeaderboard(dashboardRes.data.leaderboard);
      setLogsByEmployee(dashboardRes.data.logsByEmployee);
      setTrades(tradesRes.data);
      setPendingEmployees(pendingRes.data);
      setAds(adsRes.data);

      const prev = JSON.parse(localStorage.getItem("myRequests")) || {};
      const declined = requestsRes.data.filter(
        (r) => r.status === "declined" && prev[r._id] !== "declined"
      );
      declined.forEach((r) =>
        toast.warn(
          `❌ Your request to fulfill trade from ${r.tradeId.companyId.name} was declined`
        )
      );
      const statusMap = {};
      requestsRes.data.forEach((r) => (statusMap[r._id] = r.status));
      localStorage.setItem("myRequests", JSON.stringify(statusMap));
      setOutgoingRequests(requestsRes.data);

      const pendingTrades = tradesRes.data.filter((t) => t.status === "pending");
      const incomingMap = {};
      await Promise.all(
        pendingTrades.map(async (trade) => {
          const res = await axios.get(
            `/trade-requests/${trade._id}/requests`,
            authHeader
          );
          if (res.data.length > 0) {
            incomingMap[trade._id] = {
              type: trade.type,
              requests: res.data,
            };
          }
        })
      );
      setIncomingRequestsMap(incomingMap);
    } catch (err) {
      toast.error("❌ Error loading dashboard data");
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.clear();
    toast.success("👋 Logged out");
    navigate("/login");
  };

  const approveEmployee = async (id) => {
    try {
      await axios.patch(`/employer/employees/${id}/approve`, {}, authHeader);
      toast.success("✅ Employee approved");
      fetchDashboardData();
    } catch {
      toast.error("❌ Failed to approve employee");
    }
  };

  const createTrade = async (e) => {
    e.preventDefault();
    if (!tradeAmount || isNaN(tradeAmount) || tradeAmount <= 0) {
      return toast.error("❌ Please enter a valid amount");
    }
    try {
      await axios.post(
        "/trades/create",
        { type: tradeType, amount: Number(tradeAmount) },
        authHeader
      );
      toast.success(`✅ ${tradeType.toUpperCase()} trade created`);
      setTradeAmount("");
      fetchDashboardData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Trade creation failed";
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const acceptRequest = async (tradeId, requestId) => {
    try {
      await axios.patch(
        `/trade-requests/${tradeId}/requests/${requestId}/accept`,
        {},
        authHeader
      );
      toast.success("✅ Trade fulfilled");
      fetchDashboardData();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unknown error";
      toast.error(`❌ Accepting failed: ${message}`);
    }
  };

  const fulfillTrade = async (tradeId) => {
    try {
      await axios.post(`/trade-requests/${tradeId}/request`, {}, authHeader);
      toast.success("✅ Request sent");
      fetchDashboardData();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Already requested or error";
      toast.error(`❌ Cannot request: ${message}`);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Employer Dashboard</h1>
          {employerInfo && (
            <p className="text-sm text-gray-600 mt-1">
              Logged in as <strong>{employerInfo.employerUsername}</strong> from <strong>{employerInfo.companyName}</strong> (
              {employerInfo.companyApproved ? "✅ Approved" : "⏳ Pending"})
            </p>
          )}
        </div>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-md">
          Logout
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Total Company Credits</h2>
        <p className="text-lg text-green-700 font-semibold">{credits}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Buy / Sell Carbon Credits</h2>
        <form onSubmit={createTrade} className="flex gap-4 flex-wrap">
          <select value={tradeType} onChange={(e) => setTradeType(e.target.value)} className="border px-3 py-2 rounded">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded">
            Post {tradeType === "buy" ? "Buy" : "Sell"} Request
          </button>
        </form>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">🏆 Company Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 italic">No contributions yet from your company.</p>
        ) : (
          <div className="overflow-x-auto rounded shadow">
            <table className="min-w-full text-sm border">
              <thead className="bg-yellow-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Rank</th>
                  <th className="p-2 border">Employee</th>
                  <th className="p-2 border">Total Credits</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry._id} className="bg-white">
                    <td className="p-2 border">#{index + 1}</td>
                    <td className="p-2 border">{entry.username}</td>
                    <td className="p-2 border">{entry.carbonCredits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Employee Approvals */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Pending Employee Approvals</h2>
        {pendingEmployees.length === 0 ? (
          <p className="text-gray-500 italic">No pending employee requests.</p>
        ) : (
          <ul className="space-y-2">
            {pendingEmployees.map((emp) => (
              <li key={emp._id} className="flex justify-between items-center border p-2 rounded">
                <span>{emp.username}</span>
                <button
                  onClick={() => approveEmployee(emp._id)}
                  className="bg-green-600 text-white px-3 py-1 rounded-md"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Live Market Ads */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Live Market</h2>
        {ads.length === 0 ? (
          <p className="text-gray-500 italic">No active ads from other companies.</p>
        ) : (
          ads.map((ad) => (
            <div key={ad._id} className="flex justify-between items-center border p-2 rounded mb-2">
              <span>
                {ad.companyId?.name || "Unknown"} wants to {ad.type.toUpperCase()} {ad.amount} credits
              </span>
              <button
                onClick={() => fulfillTrade(ad._id)}
                className="bg-blue-600 text-white px-3 py-1 rounded-md"
              >
                Request to Fulfill
              </button>
            </div>
          ))
        )}
      </div>

      {/* Incoming Fulfillment Requests */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Incoming Fulfillment Requests</h2>
        {Object.keys(incomingRequestsMap).length === 0 ? (
          <p className="text-gray-500 italic">No incoming requests yet.</p>
        ) : (
          Object.entries(incomingRequestsMap).map(([tradeId, data]) => (
            <div key={tradeId} className="mb-4">
              <h3 className="font-medium text-gray-700 mb-1">
                Trade ID: {tradeId} ({data.type.toUpperCase()} request — you will {data.type === "buy" ? "SELL" : "BUY"})
              </h3>
              {data.requests.map((r) => (
                <div key={r._id} className="flex justify-between items-center border p-2 rounded mb-2">
                  <span>{r.requestedBy?.name}</span>
                  <button
                    onClick={() => acceptRequest(tradeId, r._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* My Trade Requests */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">My Trade Requests</h2>
        {outgoingRequests.length === 0 ? (
          <p className="text-gray-500 italic">No trade requests yet.</p>
        ) : (
          <ul className="divide-y">
            {outgoingRequests.map((r) => {
              const status = r.status;
              const badgeColor =
                status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : status === "declined"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800";

              const timestamp = new Date(r.createdAt).toLocaleString();
              const tradeType = r.tradeId?.type?.toUpperCase() || "TRADE";
              const amount = r.tradeId?.amount || "N/A";
              const companyName = r.tradeId?.companyId?.name || "Unknown";

              return (
                <li key={r._id} className="flex flex-col md:flex-row justify-between py-2 gap-2">
                  <div>
                    <p className="font-medium">
                      To {companyName} — <span className="text-sm text-gray-600">{tradeType} {amount} credits</span>
                    </p>
                    <p className="text-xs text-gray-500">Requested on: {timestamp}</p>
                  </div>
                  <span className={`self-start md:self-center px-2 py-1 text-xs rounded font-semibold ${badgeColor}`}>
                    {status.toUpperCase()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
