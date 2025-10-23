import express from "express";
import { filter,processFanDataController,NumericalEq } from "./fanData.controller.js";

const router = express.Router();

// POST /api/fan-data/process
router.post("/process", processFanDataController);
router.post("/numerical", NumericalEq);
router.post("/filter", filter);

export default router;
