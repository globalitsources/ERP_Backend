import express from "express";
import {
  getReportById,
  getReports,
  getUserProjects,
  login,
  submitReport,
} from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// login route
router.post("/login", login);
router.post("/projects", auth, getUserProjects);
router.post("/submit", auth, submitReport);
router.get("/get", auth, getReports);
router.get("/report/details/:projectId", auth, getReportById);

export default router;
