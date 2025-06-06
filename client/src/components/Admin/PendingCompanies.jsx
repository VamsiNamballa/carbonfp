import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance"; // centralized instance
import { toast } from "react-toastify";

const PendingCompanies = ({ token }) => {
  const [companies, setCompanies] = useState([]);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("/approve?approved=false", authHeader);
      setCompanies(res.data);
    } catch (err) {
      toast.error("❌ Error loading pending companies");
    }
  };

  const approveCompany = async (id) => {
    try {
      await axios.patch(`/approve/${id}`, { approved: true }, authHeader);
      toast.success("✅ Company approved");
      fetchCompanies();
    } catch {
      toast.error("❌ Failed to approve company");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <section className="mb-12">
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
  );
};

export default PendingCompanies;
