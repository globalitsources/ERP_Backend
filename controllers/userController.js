import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Report from "../models/reportModel.js";
import assignmentModels from "../models/assignmentModels.js";
import mongoose from "mongoose";

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
    const {
      userId,
      projectId,
      projectName,
      workType,
      taskNumber,
      workDescription,
    } = req.body;
    console.log(projectId);
    if (
      !userId ||
      !projectId ||
      !projectName ||
      !workType ||
      !taskNumber ||
      !workDescription
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await Admin.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const report = new Report({
      userId: user._id,
      projectId: new mongoose.Types.ObjectId(projectId),
      projectName,
      workType,
      taskNumber,
      workDescription,
    });

    await report.save();

    res.status(201).json({ message: "Work report submitted successfully!" });
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

export { login, getUserProjects, submitReport, getReports, getReportById };
