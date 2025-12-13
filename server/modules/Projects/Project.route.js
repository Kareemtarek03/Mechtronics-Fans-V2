import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import {
  createProject,
  addMotorToProject,
  approveProjectMotorUpdate,
  rejectProjectMotorUpdate,
  deleteMotorFromProject,
  getProjects,
  getProjectById,
  updateProjectMeta,
} from "./Project.controller.js";

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// Create project (engineer, supervisor, customer)
router.post("/", createProject);

// Add motor (fan+motor pair) to project
router.post("/:projectId/motors", addMotorToProject);

// Supervisor: approve/reject update
router.post(
  "/:projectId/motors/:projectMotorId/approve",
  approveProjectMotorUpdate
);
router.post(
  "/:projectId/motors/:projectMotorId/reject",
  rejectProjectMotorUpdate
);

// Supervisor: delete fan/motor from project
router.delete("/:projectId/motors/:projectMotorId", deleteMotorFromProject);

// Get all projects (role-based)
router.get("/", getProjects);

// Get project by id
router.get("/:id", getProjectById);

// Edit project meta (engineer + supervisor only)
router.patch("/:id", updateProjectMeta);

export default router;
