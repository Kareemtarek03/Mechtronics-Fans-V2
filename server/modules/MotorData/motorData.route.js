import express from "express";
import {
  getMotorDataController,
  exportMotorDataController,
  uploadMotorDataController,
  deleteMotorDataController,
} from "./motorData.controller.js";

const router = express.Router();

// GET /api/motor-data/
router.get("/", getMotorDataController);

// GET /api/motor-data/export
router.get("/export", exportMotorDataController);

// POST /api/motor-data/upload
// body: { fileBase64: string, filename?: string }
router.post("/upload", uploadMotorDataController);

// DELETE /api/motor-data/:id
// delete a motor by numeric id
router.delete("/:id", (req, res) => deleteMotorDataController(req, res));

export default router;
