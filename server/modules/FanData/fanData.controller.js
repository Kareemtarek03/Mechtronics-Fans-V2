import { processFanDataService, main, Output } from "./fanData.service.js";

export async function processFanDataController(req, res) {
  try {
    const { units, input } = req.body;
    const filePath = "output.json";
    const result = await processFanDataService({ filePath, units, input });

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
    const filePath = "output.json";
    const result = await main({ filePath, units, input });

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

    const result = await Output({ units, input });

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
