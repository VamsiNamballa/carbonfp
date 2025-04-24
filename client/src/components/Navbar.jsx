import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/carbonfp-logo.png"; // ✅ Adjust the path if it's different

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const storedCompanyName = localStorage.getItem("companyName");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const formatRole = (role) =>
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  const getCompanyName = () => {
    if (user?.companyId?.name) return user.companyId.name;
    if (typeof user?.companyId === "string") return storedCompanyName;
    return null;
  };

  return (
    <header className="bg-green-700 text-white shadow-md fixed top-0 w-full z-50 px-4 py-2">
      <div className="flex justify-between items-center flex-wrap gap-4">
        {/* 🔹 Logo & Branding */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="CarbonFP Logo"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-xl font-bold tracking-wide">CarbonFP</span>
        </div>

        {/* 🔸 User Info + Logout */}
        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 text-sm md:text-base">
          {user && (
            <div className="text-center md:text-left">
              <div>
                Logged in as:{" "}
                <span className="capitalize font-semibold">
                  {formatRole(user.role)} — {user.username}
                </span>
              </div>
              {user.role !== "admin" && getCompanyName() && (
                <div className="text-xs md:text-sm text-white/80">
                  🏢 Company: <span className="italic">{getCompanyName()}</span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="bg-white text-green-700 hover:bg-gray-100 font-semibold px-3 py-1 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
