import { useEffect, useState } from "react";
import axios from "axios";

const TradeAuditLog = ({ token }) => {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5050/api/trades", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setTrades(res.data.reverse()))
      .catch(() => console.error("Failed to load trade logs"));
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Trade Audit Log</h2>
      {trades.length === 0 ? (
        <p className="text-gray-500 italic">No trades found.</p>
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
              {trades.map(t => (
                <tr key={t._id} className="border-t">
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">{t.amount}</td>
                  <td className="p-3 text-green-600">{t.status}</td>
                  <td className="p-3">{t.fromCompany || '-'}</td>
                  <td className="p-3">{t.toCompany || '-'}</td>
                  <td className="p-3">{new Date(t.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TradeAuditLog;
