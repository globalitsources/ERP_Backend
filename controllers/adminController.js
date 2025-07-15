import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import Project from "../models/projectModel.js";
import assignmentModels from "../models/assignmentModels.js";
import Report from "../models/reportModel.js";

// register
const register = async (req, res) => {
  try {
    const { userId, password, role, name } = req.body;

    const existingUser = await Admin.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Admin({
      userId,
      name,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Registration Error:", err);

    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: err.message || "Validation error" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Project name is required" });

    const newProject = new Project({ name });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update project by ID
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await Project.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete project by ID
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await Admin.find({}, "_id name");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users." });
  }
};

// assign project

const assignProject = async (req, res) => {
  const { name, project } = req.body;

  console.log("Backend received:", req.body);

  if (!name || !project) {
    return res
      .status(400)
      .json({ message: "User ID and Project ID required." });
  }

  try {
    const newAssignment = new assignmentModels({
      name,
      project,
    });

    await newAssignment.save();

    res.status(201).json({ message: "Project assigned successfully." });
  } catch (error) {
    console.error("Assignment error:", error);
    res.status(500).json({ message: "❗ Server error during assignment." });
  }
};

const getTodayReports = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const reports = await Report.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const formatted = reports.map((r) => ({
      name: r.userId.name,
      projectName: r.projectName,
      workType: r.workType,
      taskNumber: r.taskNumber,
      workDescription: r.workDescription,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Today report error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const allReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

export {
  deleteProject,
  register,
  updateProject,
  getAllProjects,
  createProject,
  getAllUsers,
  assignProject,
  getTodayReports,
  allReports,
};
