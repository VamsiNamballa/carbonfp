import { useEffect, useState } from "react";
import axios from "../api/axiosInstance"; // ✅ Using centralized instance
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
        axios.get("/api/employer/status", authHeader),
        axios.get("/api/employer/dashboard", authHeader),
        axios.get("/api/employer/trades/history", authHeader),
        axios.get("/api/employer/employees/pending", authHeader),
        axios.get("/api/trade-requests/mine", authHeader),
        axios.get("/api/trades/ads/other", authHeader),
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
        toast.warn(`❌ Your request to fulfill trade from ${r.tradeId.companyId.name} was declined`)
      );
      const statusMap = {};
      requestsRes.data.forEach((r) => (statusMap[r._id] = r.status));
      localStorage.setItem("myRequests", JSON.stringify(statusMap));
      setOutgoingRequests(requestsRes.data);

      const pendingTrades = tradesRes.data.filter((t) => t.status === "pending");
      const incomingMap = {};
      await Promise.all(
        pendingTrades.map(async (trade) => {
          const res = await axios.get(`/api/trade-requests/${trade._id}/requests`, authHeader);
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
      toast.error("Error loading dashboard data");
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.clear();
    toast.success("Logged out");
    navigate("/login");
  };

  const approveEmployee = async (id) => {
    try {
      await axios.patch(`/api/employer/employees/${id}/approve`, {}, authHeader);
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
        "/api/trades/create",
        {
          type: tradeType,
          amount: Number(tradeAmount),
        },
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
      await axios.patch(`/api/trade-requests/${tradeId}/requests/${requestId}/accept`, {}, authHeader);
      toast.success("✅ Trade fulfilled");
      fetchDashboardData();
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || "Unknown error";
      toast.error(`❌ Accepting failed: ${message}`);
    }
  };

  const fulfillTrade = async (tradeId) => {
    try {
      await axios.post(`/api/trade-requests/${tradeId}/request`, {}, authHeader);
      toast.success("✅ Request sent");
      fetchDashboardData();
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data?.error || "Already requested or error";
      toast.error(`❌ Cannot request: ${message}`);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ⬇️ UI remains unchanged from your version. No changes needed here.
  return (
    <div className="p-6">
      {/* Everything you already wrote for layout and data presentation stays here */}
      {/* You do not need to change anything else since API changes are complete above */}
    </div>
  );
};

export default EmployerDashboard;
