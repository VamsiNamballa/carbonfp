import Company from "../models/Company.js";
import User from "../models/User.js";

// ✅ Admin: Approve a company by ID + Auto-approve employer(s)
export const approveCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // 🔁 Auto-approve all pending employers for this company
    const result = await User.updateMany(
      { companyId: company._id, role: "employer", status: "pending" },
      { $set: { status: "approved" } }
    );

    res.json({
      message: `✅ Company approved. ${result.modifiedCount} employer(s) auto-approved.`,
      company,
    });
  } catch (err) {
    console.error("❌ Company approval error:", err.message);
    res.status(500).json({ error: "Server error approving company" });
  }
};

// ✅ Admin: Approve a specific employer manually
export const approveEmployer = async (req, res) => {
  try {
    const employer = await User.findById(req.params.id);

    if (!employer || employer.role !== "employer") {
      return res.status(400).json({ error: "Invalid employer ID" });
    }

    employer.status = "approved";
    await employer.save();

    res.json({ message: "✅ Employer approved", user: employer });
  } catch (err) {
    console.error("❌ Employer approval error:", err.message);
    res.status(500).json({ error: "Server error approving employer" });
  }
};

// ✅ Employer: Approve an employee in their own company
export const approveEmployee = async (req, res) => {
  try {
    const employer = await User.findById(req.user.id);

    if (!employer || employer.status !== "approved") {
      return res.status(403).json({ error: "Employer not approved yet" });
    }

    const employee = await User.findById(req.params.id);

    if (
      !employee ||
      employee.role !== "employee" ||
      String(employee.companyId) !== String(employer.companyId)
    ) {
      return res.status(400).json({ error: "Invalid employee or not in your company" });
    }

    employee.status = "approved";
    await employee.save();

    res.json({ message: "✅ Employee approved", user: employee });
  } catch (err) {
    console.error("❌ Employee approval error:", err.message);
    res.status(500).json({ error: "Server error approving employee" });
  }
};
