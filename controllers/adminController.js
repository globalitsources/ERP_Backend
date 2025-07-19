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
    const { name, url } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const existingProject = await Project.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingProject) {
      return res.status(400).json({ message: "Project already exists" });
    }

    const newProject = new Project({ name, url: url || null });
    await newProject.save();

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Create project error:", error);
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
    const { name, url } = req.body;

    const updated = await Project.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(url !== undefined && { url }),
      },
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
    const users = await Admin.find({}, "_id name").sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users." });
  }
};

// delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await Admin.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

// assign project
const assignProject = async (req, res) => {
  const { name, projects } = req.body;

  console.log("Backend received:", req.body);

  if (!name || !projects || !Array.isArray(projects) || projects.length === 0) {
    return res
      .status(400)
      .json({ message: "User ID and at least one Project ID are required." });
  }
  try {
    const assignments = projects.map((projectId) => ({
      name,
      project: projectId,
    }));

    await assignmentModels.insertMany(assignments);

    res.status(201).json({ message: "Projects assigned successfully." });
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
      .populate({ path: "userId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 });

    const assignments = await assignmentModels.find()
      .populate({ path: "name", select: "name", strictPopulate: false }) // user
      .populate({ path: "project", select: "name", strictPopulate: false }); // project

    const userMap = {};

    assignments.forEach((assignment) => {
      if (!assignment.name || !assignment.project) return;

      const userId = assignment.name._id.toString();
      const userName = assignment.name.name;
      const projectName = assignment.project.name || "Unnamed Project";

      if (!userMap[userId]) {
        userMap[userId] = {
          name: userName,
          reports: [],
          assignedProjects: [],
        };
      }

      if (!userMap[userId].assignedProjects.includes(projectName)) {
        userMap[userId].assignedProjects.push(projectName);
      }
    });
    reports.forEach((report) => {
      if (!report.userId) return;

      const userId = report.userId._id.toString();
      if (userMap[userId]) {
        report.reports.forEach((entry) => {
          userMap[userId].reports.push({
            projectName: report.projectName,
            taskNumber: entry.taskNumber,
            workType: entry.workType,
            workDescription: entry.workDescription,
          });
        });
      }
    });


    const userData = Object.values(userMap).map((user) => {
      const combined = user.assignedProjects.flatMap((projectName) => {
        const reportsForProject = user.reports.filter(
          (r) => r.projectName === projectName
        );

        return reportsForProject.length > 0
          ? reportsForProject
          : [
            {
              projectName,
              taskNumber: null,
              workType: null,
              workDescription: null,
            },
          ];
      });

      return {
        name: user.name,
        reports: combined,
      };
    });

    res.status(200).json(userData);
  } catch (error) {
    console.error("Today report error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
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
const getReportsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
const getAssignedProjectsByAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const assignments = await assignmentModels
      .find({ name: userId })
      .populate("project", "name")
      .sort({ createdAt: -1 });

    const projectList = assignments
      .filter(a => a.project)
      .map((a) => ({
        id: a.project._id,
        name: a.project.name,
      }));

    res.json(projectList);
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    res.status(500).json({ message: "Error fetching assigned projects" });
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
  getReportsByUser,
  getAssignedProjectsByAdmin,
  deleteUser,
};
