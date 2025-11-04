import { processFanDataService, main, Output } from "./fanData.service.js";
import { exportFanData, importFanDataFromExcel } from "./fanData.service.js";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

export async function processFanDataController(req, res) {
  try {
    const { units, input } = req.body;
    const filePath = "db";
    const result = await processFanDataService({
      filePath,
      units,
      input,
      dataSource: "db",
    });

    res.json({
      message: "✅ Fan data processed successfully!",
      data: result.recalculatedData,
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    res.status(500).json({
      error: "Failed to process fan data",
      details: error.message,
    });
  }
}
export async function NumericalEq(req, res) {
  try {
    const { units, input } = req.body;
    const filePath = "db";
    const result = await main({ filePath, units, input, dataSource: "db" });

    res.json({
      message: "✅ Fan data processed successfully!",
      data: result.result,
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    res.status(500).json({
      error: "Failed to process fan data",
      details: error.message,
    });
  }
}
export async function filter(req, res) {
  try {
    const { units, input } = req.body;

    const result = await Output({ units, input, dataSource: "db" });

    res.json({
      message: "✅ Fan data processed successfully!",
      data: result,
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    res.status(500).json({
      error: "Failed to process fan data",
      details: error.message,
    });
  }
}
export async function getOutputFile(req, res) {
  try {
    // Read fan data directly from the database
    const rows = await prisma.fanData.findMany();
    const data = rows.map((r) => ({
      Blades: {
        symbol: r.bladesSymbol,
        material: r.bladesMaterial,
        noBlades: r.noBlades,
        angle: r.bladesAngle,
      },
      Impeller: {
        innerDia: r.impellerInnerDia,
        conf: r.impellerConf,
      },
      desigDensity: r.desigDensity,
      RPM: r.RPM,
      airFlow: r.airFlow,
      totPressure: r.totPressure,
      velPressure: r.velPressure,
      staticPressure: r.staticPressure,
      fanInputPow: r.fanInputPow,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ message: "✅ Output data (from DB)", data });
  } catch (err) {
    console.error("Failed to read output file", err);
    res
      .status(500)
      .json({ error: "Failed to read output file", details: err.message });
  }
}

export async function exportFanDataController(req, res) {
  try {
    return await exportFanData(res);
  } catch (err) {
    console.error("Failed to export fan data", err);
    res.status(500).json({ error: "Failed to export fan data", details: err.message });
  }
}

export async function uploadFanDataController(req, res) {
  try {
    const { fileBase64, filename } = req.body;
    const out = await importFanDataFromExcel(fileBase64, filename);
    res.json({ message: "✅ Fan data imported", importedRows: Array.isArray(out) ? out.length : 0 });
  } catch (err) {
    console.error("Failed to import fan data", err);
    res.status(500).json({ error: "Failed to import fan data", details: err.message });
  }
}

export async function uploadFanDataBinaryController(req, res) {
  try {
    // Expect raw bytes in req.body (Buffer) and optional filename in header 'x-filename'
    const filename = req.headers["x-filename"] || req.query.filename || "uploaded.xlsx";
    let fileBuffer = null;
    if (req.body && Buffer.isBuffer(req.body)) {
      fileBuffer = req.body;
    } else if (req.body && typeof req.body === "string") {
      // sometimes body may be stringified; try to decode
      fileBuffer = Buffer.from(req.body, "binary");
    } else {
      return res.status(400).json({ error: "Missing file body" });
    }

    const base64 = fileBuffer.toString("base64");
    const out = await importFanDataFromExcel(base64, filename);
    res.json({ message: "✅ Fan data imported (binary)", importedRows: Array.isArray(out) ? out.length : 0 });
  } catch (err) {
    console.error("Failed to import fan data (binary)", err);
    res.status(500).json({ error: "Failed to import fan data (binary)", details: err.message });
  }
}
