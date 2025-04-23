// ✅ ESM compatible middleware
import Company from "../models/Company.js";

const checkApprovedCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.body.companyId);
    if (!company || !company.approved) {
      return res.status(403).json({ message: "Company not approved by admin." });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Middleware error: " + err.message });
  }
};

export default checkApprovedCompany;
