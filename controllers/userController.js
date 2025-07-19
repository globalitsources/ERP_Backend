import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Report from "../models/reportModel.js";
import assignmentModels from "../models/assignmentModels.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const admin = await Admin.findOne({ userId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userId: admin.userId,
        role: admin.role,
        _id: admin._id,
        name: admin.name,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getUserProjects = async (req, res) => {
  const userId = req.user._id;

  try {
    const assignments = await assignmentModels
      .find({ name: userId })
      .populate("project", "name").sort({ createdAt: -1 });;

    const projectList = assignments.map((a) => ({
      id: a.project._id,
      name: a.project.name,
    }));

    res.json(projectList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching assigned projects" });
  }
};

const submitReport = async (req, res) => {
  try {
    const { userId, projectId, projectName, reports } = req.body;

    if (
      !userId ||
      !projectId ||
      !projectName ||
      !Array.isArray(reports) ||
      reports.length === 0
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await Admin.findOne({ userId: String(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const reportDoc = new Report({
      userId: user._id,
      projectId: new mongoose.Types.ObjectId(projectId),
      projectName,
      reports,
    });

    await reportDoc.save();

    res.status(201).json({ message: "Work reports submitted successfully!" });
  } catch (error) {
    console.error("Submit Report Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};





//  Get reports by filter (date, month, year)
const getReports = async (req, res) => {
  try {
    const { userId, filterType, filterValue } = req.query;

    let query = { userId };
    const date = new Date(filterValue);

    if (filterType === "date") {
      query.date = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    } else if (filterType === "month") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      query.date = { $gte: start, $lte: end };
    } else if (filterType === "year") {
      const start = new Date(Number(filterValue), 0, 1);
      const end = new Date(Number(filterValue), 11, 31, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const reports = await Report.find(query).sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getReportById = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log("Looking for projectId:", projectId);
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const report = await Report.find({
      projectId: new mongoose.Types.ObjectId(projectId),
    }).sort({ createdAt: -1 });;

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getReportByProjectAndUser = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    console.log("Looking for projectId:", projectId, "and userId:", userId);

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid projectId or userId" });
    }

    const report = await Report.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    if (!report || report.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


const getCurrentISTStatus = (req, res) => {
  // Get current time in IST using moment-timezone
  const nowIST = moment().tz("Asia/Kolkata");

  const currentMinutes = nowIST.hours() * 60 + nowIST.minutes();

  const firstHalfStart = 13 * 60;      // 1:00 PM IST
  const firstHalfEnd = 14 * 60 + 10;   // 1:30 PM IST

  const secondHalfStart = 18 * 60;     // 6:00 PM IST
  const secondHalfEnd = 18 * 60 + 30;  // 6:30 PM IST

  const isAllowed =
    (currentMinutes >= firstHalfStart && currentMinutes <= firstHalfEnd) ||
    (currentMinutes >= secondHalfStart && currentMinutes <= secondHalfEnd);

  return res.json({
    allowed: isAllowed,
    currentIST: nowIST.format("HH:mm"),
    message: isAllowed
      ? "✅ You can submit the report now."
      : "⛔ Report submission is only allowed from 1:00 – 1:30 PM and 6:00 – 6:30 PM (IST).",
  });
};



export { login, getUserProjects, submitReport, getReports, getReportByProjectAndUser, getReportById,getCurrentISTStatus };
