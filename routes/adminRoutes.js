import express from "express";
import {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  register,
  getAllUsers,
  assignProject,
  getTodayReports,
  allReports,
  getReportsByUser,
  getAssignedProjectsByAdmin,
  deleteUser,
} from "../controllers/adminController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// login route
router.post("/register", auth, register);
router.get("/", auth, getAllProjects);
router.post("/", auth, createProject);
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);
router.get("/users", auth, getAllUsers);
router.post("/assign", auth, assignProject);
router.get("/reports/today", auth, getTodayReports);
router.get("/reports", auth, allReports);
router.get("/user/:userId/reports", auth, getReportsByUser);
router.get("/assigned-projects/:userId", getAssignedProjectsByAdmin);
router.delete("/user/:userId", auth, deleteUser);




export default router;
