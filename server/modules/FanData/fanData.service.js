import fs from "fs";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prisma client (local instance). This file uses it optionally when dataSource === 'db' or filePath === 'db'.
const prisma = new PrismaClient();

// Calculate density based on temperature
function calcDensity(tempC) {
  let temp = Number(tempC);
  if (isNaN(temp))
    throw new Error("Invalid temperature for density calculation");
  let den = 101325 / ((temp + 273.15) * 287.1);

  return Math.round(den * 100) / 100;
  // return den;
}

// Convert fan measurement units
function convertFanUnits(fan, units = {}) {
  const airFlowConverters = {
    "m^3/s": 1,
    "m^3/min": 60,
    "m^3/hr": 3600,
    "L/s": 1000,
    "L/min": 60000,
    "L/hr": 3600000,
    CFM: 2118.880003,
  };

  const pressureConverters = {
    Pa: 1,
    kPa: 0.001,
    bar: 1e-5,
    Psi: 0.000145038,
    "in.wg": 0.004018647,
  };

  const powerConverters = {
    kW: 1,
    W: 1000,
    HP: 1.34,
  };

  const convertArray = (arr, factor) =>
    arr.map((v) => (typeof v === "number" && !isNaN(v) ? v * factor : null));

  const airFlowUnit = units.airFlow || "m^3/s";
  const pressureUnit = units.pressure || "Pa";
  const powerUnit = units.power || "kW";

  return {
    ...fan,
    convAirFlow: convertArray(fan.airFlow, airFlowConverters[airFlowUnit]),
    convTotPressure: convertArray(
      fan.totPressure,
      pressureConverters[pressureUnit]
    ),
    convVelPressure: convertArray(
      fan.velPressure,
      pressureConverters[pressureUnit]
    ),
    convStaticPressure: convertArray(
      fan.staticPressure,
      pressureConverters[pressureUnit]
    ),
    convFanInputPow: convertArray(fan.fanInputPow, powerConverters[powerUnit]),
  };
}

// Recalculate performance with RPM and density scaling
function recalcFanPerformance(fan, input) {
  const inputDensity = calcDensity(input.TempC);
  const rpmRatio = input.RPM / fan.RPM;
  const densityRatio = inputDensity / fan.desigDensity;

  const scaleArray = (arr, factor) =>
    arr.map((v) => (typeof v === "number" && !isNaN(v) ? v * factor : null));

  const AirFlowNew = scaleArray(fan.convAirFlow, rpmRatio);
  const TotalPressureNew = scaleArray(
    fan.convTotPressure,
    Math.pow(rpmRatio, 2) * densityRatio
  );
  const VelocityPressureNew = scaleArray(
    fan.convVelPressure,
    Math.pow(rpmRatio, 2) * densityRatio
  );
  const StaticPressureNew = scaleArray(
    fan.convStaticPressure,
    Math.pow(rpmRatio, 2) * densityRatio
  );
  const FanInputPowerNew = scaleArray(
    fan.convFanInputPow,
    Math.pow(rpmRatio, 3) * densityRatio
  );

  // Efficiency using OLD converted data
  const FanTotalEfficiency = fan.fanInputPow.map((pow, i) => {
    const p = fan.totPressure[i] ?? 0;
    const q = fan.airFlow[i] ?? 0;
    return pow && pow > 0 ? (p * q) / (pow * 1000) : null;
  });

  const FanStaticEfficiency = fan.fanInputPow.map((pow, i) => {
    const p = fan.staticPressure[i] ?? 0;
    const q = fan.airFlow[i] ?? 0;
    return pow && pow > 0 ? (p * q) / (pow * 1000) : null;
  });

  return {
    InputDensity: inputDensity,
    ...fan,
    AirFlowNew,
    TotalPressureNew,
    VelocityPressureNew,
    StaticPressureNew,
    FanInputPowerNew,
    FanTotalEfficiency,
    FanStaticEfficiency,
  };
}

// Main Service Function
export async function processFanDataService(inputOptions) {
  const { filePath, units, input, dataSource } = inputOptions;

  let rawData = [];

  // If caller explicitly requests DB or passes filePath === 'db', fetch from DB
  if (dataSource === "db" || filePath === "db") {
    // read from Prisma FanData table and map DB rows to the expected nested shape
    const rows = await prisma.fanData.findMany();
    rawData = rows
      .map((r) => ({
        // map flattened DB fields to the nested structure the rest of the service expects
        Id: r.id,
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
        // Prisma returns Json columns as parsed JS values
        airFlow: r.airFlow,
        totPressure: r.totPressure,
        velPressure: r.velPressure,
        staticPressure: r.staticPressure,
        fanInputPow: r.fanInputPow,
        // keep some direct fields for compatibility
        bladesSymbol: r.bladesSymbol,
        bladesMaterial: r.bladesMaterial,
        noBlades: r.noBlades,
        bladesAngle: r.bladesAngle,
        impellerConf: r.impellerConf,
        impellerInnerDia: r.impellerInnerDia,
      }))
      .sort((a, b) => a.Id - b.Id);
  } else {
    // Resolve file path relative to server directory
    const resolvedPath =
      filePath && path.isAbsolute(filePath)
        ? filePath
        : path.join(__dirname, "..", "..", filePath || "output.json");
    rawData = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  }

  const convertedData = rawData.map((fan) => convertFanUnits(fan, units));
  const recalculatedData = convertedData.map((fan) =>
    recalcFanPerformance(fan, input)
  );
  // Save outputs for verification
  // fs.writeFileSync(
  //   "recalculated_output.json",
  //   JSON.stringify(recalculatedData, null, 2),
  //   "utf8"
  // );

  return { convertedData, recalculatedData };
}

// --- Helper functions ---

// Piecewise Cubic Interpolation (Excel-compatible)
class PiecewiseCubicInterpolator {
  constructor(x, y) {
    this.x = [...x];
    this.y = [...y];
    this.n = x.length;

    // Calculate cubic coefficients for each segment
    this.segments = [];
    for (let i = 0; i < this.n - 1; i++) {
      const x0 = this.x[i];
      const x1 = this.x[i + 1];
      const y0 = this.y[i];
      const y1 = this.y[i + 1];

      const x0_cubed = Math.pow(x0, 3);
      const x1_cubed = Math.pow(x1, 3);

      // Excel's method: Y = aX³ + b
      const a = (y1 - y0) / (x1_cubed - x0_cubed);
      const b = y0 - a * x0_cubed;

      this.segments.push({
        xMin: Math.min(x0, x1),
        xMax: Math.max(x0, x1),
        c3: a,
        c0: b,
      });
    }
  }

  at(xi) {
    // Find the segment containing xi
    for (const seg of this.segments) {
      if (xi >= seg.xMin && xi <= seg.xMax) {
        return seg.c3 * Math.pow(xi, 3) + seg.c0;
      }
    }

    // Extrapolation using nearest segment
    const seg =
      xi < this.segments[0].xMin
        ? this.segments[0]
        : this.segments[this.segments.length - 1];
    return seg.c3 * Math.pow(xi, 3) + seg.c0;
  }
}

function cubicSpline(x, y) {
  const interpolator = new PiecewiseCubicInterpolator(x, y);
  return (xi) => interpolator.at(xi);
}

function loadFansFromRecalculatedOutput(fans) {
  const curveNames = [
    "StaticPressureNew",
    "VelocityPressureNew",
    "FanInputPowerNew",
    "FanStaticEfficiency",
    "FanTotalEfficiency",
  ];

  const PredNames = [
    "StaticPressurePred",
    "VelocityPressurePred",
    "FanInputPowerPred",
    "FanStaticEfficiencyPred",
    "FanTotalEfficiencyPred",
  ];

  const xPerFan = [];
  const yPerFan = [];

  fans.forEach((fan, fanIdx) => {
    const xRaw = fan["AirFlowNew"]; // X-axis values per fan
    if (!Array.isArray(xRaw) || xRaw.length !== 10) {
      throw new Error(`Fan ${fanIdx + 1}: expected 10 AirFlowNew values`);
    }

    // Build curves in requested order
    const curvesRaw = curveNames.map((name) => {
      const arr = fan[name];
      if (!Array.isArray(arr) || arr.length !== 10) {
        throw new Error(`Fan ${fanIdx + 1}: expected 10 values for ${name}`);
      }
      return arr;
    });

    // Ensure X ascending with consistent Y reordering
    const sortedIdx = [...xRaw.keys()].sort((a, b) => xRaw[a] - xRaw[b]);
    const xSorted = sortedIdx.map((i) => xRaw[i]);
    const curvesSorted = curvesRaw.map((yArr) => sortedIdx.map((i) => yArr[i]));

    xPerFan.push(xSorted);
    yPerFan.push(curvesSorted);
  });

  return { xPerFan, yPerFan, curveNames, PredNames };
}

// --- Evaluate ---
export async function main(InputData) {
  let result = [];
  const inputOptions = {
    filePath: InputData.filePath || "output.json",
    dataSource: InputData.dataSource, // optional: set to 'db' to read from DB
    units: InputData.units,
    input: {
      RPM: InputData.RPM,
      TempC: InputData.TempC,
      airFlow: InputData.airFlow,
    },
  };

  const { convertedData, recalculatedData } = await processFanDataService(
    inputOptions
  );

  // Load fans from recalculated data
  const { xPerFan, yPerFan, curveNames, PredNames } =
    loadFansFromRecalculatedOutput(recalculatedData);

  // Create splines per fan (five curves each)
  const splinesPerFan = yPerFan.map((fanCurves, fanIdx) => {
    const x = xPerFan[fanIdx];
    return fanCurves.map((y) => cubicSpline(x, y));
  });
  // Evaluate at a specific x value and collect predictions
  const predictions = splinesPerFan.map((fanSplines, fanIdx) => {
    const x = xPerFan[fanIdx];
    const xMin = x[0];
    const xMax = x[x.length - 1];

    if (Number.isNaN(inputOptions.input.airFlow)) {
      return { fan: fanIdx + 1, error: "Invalid x value." };
    }
    if (
      inputOptions.input.airFlow < xMin ||
      inputOptions.input.airFlow > xMax
    ) {
      result[fanIdx] = {
        Id: fanIdx,
        ...recalculatedData[fanIdx],
        predictions: null,
      };

      return {
        fan: fanIdx + 1,
        error: `x=${inputOptions.input.airFlow} is out of range [${xMin}, ${xMax}] for this fan.`,
      };
    }

    const fanResults = {};
    fanSplines.forEach((spline, curveIdx) => {
      const yPred = spline(inputOptions.input.airFlow);
      const name = PredNames[curveIdx];
      const n = Number(yPred);
      fanResults[name] = n;
    });

    // merge predictions into a copy of the recalculated fan entry
    result[fanIdx] = {
      Id: fanIdx,
      ...recalculatedData[fanIdx],
      predictions: fanResults,
    };

    return {
      fan: fanIdx + 1,
      x: inputOptions.input.airFlow,
      results: fanResults,
    };
  });

  return {
    recalculatedData,
    result,
    predictions,
  };
}

export async function Output({ units, input, dataSource }) {
  try {
    const filePath = "output.json";
    // main expects RPM/TempC/airFlow at top-level of its InputData argument
    const result = await main({
      filePath: dataSource === "db" ? "db" : filePath,
      dataSource,
      units,
      RPM: input?.RPM,
      TempC: input?.TempC,
      airFlow: input?.airFlow,
    });
    const spf = input.SPF;

    // console.log("Main result:", result.result);
    // result.result is the array of recalculated fans with a `predictions` field
    const candidates = Array.isArray(result.result)
      ? result.result
      : result.recalculatedData;

    const staticRefRaw =
      input && (input.staticPressure ?? input.StaticPressure);
    const staticRef =
      typeof staticRefRaw === "string" ? Number(staticRefRaw) : staticRefRaw;

    const hasValidPredictions = (fan) => {
      if (!fan || !fan.predictions) return false;
      // ensure predictions object has at least one non-null numeric value
      const hasNumeric = Object.values(fan.predictions).some(
        (v) => typeof v === "number" && !Number.isNaN(v)
      );
      if (!hasNumeric) return false;

      // If caller provided a staticPressure filter, enforce it (+/-10%)
      if (typeof staticRef === "number" && Number.isFinite(staticRef)) {
        // try different possible static pressure keys in predictions
        const sp =
          fan.predictions.StaticPressurePred ??
          fan.predictions.StaticPressure ??
          fan.predictions.StaticPressureNew ??
          fan.predictions.StaticPressurepred;
        if (typeof sp !== "number" || Number.isNaN(sp)) return false;
        const l = 1 - spf / 100;
        const u = 1 + spf / 100;
        const lower = staticRef * l;
        const upper = staticRef * u;
        return sp >= lower && sp <= upper;
      }

      return true;
    };

    // Helper to calculate noPoles from RPM
    function calcNoPoles(rpm) {
      if (rpm === undefined || rpm === null || isNaN(rpm)) return "";
      if (rpm <= 750) return 8;
      if (rpm > 750 && rpm <= 1000) return 6;
      if (rpm > 1000 && rpm <= 1500) return 4;
      if (rpm > 1500 && rpm <= 3000) return 2;
      return "";
    }
    const noPoles = calcNoPoles(input.RPM);

    // Add FanModel property to each filtered fan
    const filtered = (candidates || [])
      .filter(hasValidPredictions)
      .map((fan) => {
        const blades = fan.Blades || {};
        const impeller = fan.Impeller || {};
        const FanModel = `${units.fanType || ""}-${impeller.innerDia || ""}-${
          blades.noBlades || ""
        }\\${blades.angle || ""}\\${blades.material || ""}${
          blades.symbol || ""
        }-${noPoles}${input.NoPhases == 3 ? "T" : "M"}`;

        return { FanModel, ...fan };
      });

    // Load motor database and attach nearest motor by netpower to each fan
    let motors = [];
    try {
      // Prefer DB-backed motor data via Prisma; fallback to file if DB not available
      const rows = await prisma.motorData.findMany();
      motors = rows;
    } catch (err) {
      try {
        const motorDataPath = path.join(
          __dirname,
          "..",
          "..",
          "MotorData.json"
        );
        const motorsRaw = fs.readFileSync(motorDataPath, "utf8");
        motors = JSON.parse(motorsRaw);
      } catch (err2) {
        // if file missing or parse error, continue without matching
        motors = [];
      }
    }

    const attachClosestMotor = (fan) => {
      // determine fan power to match against motor.netpower
      const fanPower =
        (fan.predictions &&
          (fan.predictions.FanInputPower ??
            fan.predictions.FanInputPowerPred)) ??
        null;
      const fPower =
        typeof fanPower === "number" && !Number.isNaN(fanPower)
          ? fanPower
          : null;
      if (fPower === null) {
        return { ...fan, matchedMotor: null, powerDiff: null };
      }

      // Determine fan power (try multiple prediction keys)
      const fanPowerCandidate =
        (fan.predictions &&
          (fan.predictions.FanInputPowerPred ??
            fan.predictions.FanInputPower ??
            fan.FanInputPowerNew?.[0])) ??
        null;
      const fPowerVal =
        typeof fanPowerCandidate === "number" &&
        !Number.isNaN(fanPowerCandidate)
          ? fanPowerCandidate
          : fPower;
      const fPowerFinal =
        typeof fPowerVal === "number" && Number.isFinite(fPowerVal)
          ? fPowerVal
          : null;
      if (fPowerFinal === null)
        return { ...fan, matchedMotor: null, powerDiff: null };

      // collect motors with net >= fan power
      const candidatesAbove = [];
      for (const m of motors) {
        const netRaw = m.netpower ?? m.netPower ?? m.powerKW ?? m.powerKw;
        const net = Number(netRaw);
        if (!Number.isFinite(net)) continue;
        if (
          net >= fPowerFinal * (1 + input.Safety / 100) &&
          noPoles == m.NoPoles
        )
          candidatesAbove.push({ m, net });
      }

      if (candidatesAbove.length === 0) {
        // no motor meets the criterion of net >= fan power
        return { ...fan, matchedMotor: null, powerDiff: null };
      }

      // choose the smallest net among candidates (closest higher)
      candidatesAbove.sort((a, b) => a.net - b.net);
      const bestEntry = candidatesAbove[0];
      const best = bestEntry.m;
      const bestNet = bestEntry.net;
      const bestDiff = bestNet - fPowerFinal;

      const matched = {
        model: best.model ?? best.Model ?? null,
        powerKW: best.powerKW ?? best.powerKw ?? null,
        netpower: best.netpower ?? best.netPower ?? null,
        frameSize: best.frameSize ?? null,
        powerHorse: best.powerHorse ?? null,
      };
      fan.FanModel += `-${matched.powerHorse || ""}`;

      return { ...fan, matchedMotor: best, powerDiff: bestDiff };
    };

    const withMatches = filtered.map(attachClosestMotor);

    // Sort final results by predictions.FanTotalEfficiencyPred (descending).
    const getEff = (item) => {
      const p =
        item.predictions?.FanTotalEfficiencyPred ??
        item.predictions?.FanTotalEfficiency ??
        null;
      if (typeof p === "number" && !Number.isNaN(p)) return p;
      const parsed = Number(p);
      return Number.isFinite(parsed) ? parsed : -Infinity;
    };

    const sorted = withMatches.sort((a, b) => getEff(b) - getEff(a));
    return sorted;
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    throw new Error(`Error`);
  }
}

// --- Export / Import helpers for FanData (xlsx)
export async function exportFanData(res) {
  // try DB first, fallback to file
  let data = [];
  try {
    const rows = await prisma.fanData.findMany();
    data = rows.map((r) => ({
      Blades: {
        symbol: r.bladesSymbol,
        material: r.bladesMaterial,
        noBlades: r.noBlades,
        angle: r.bladesAngle,
      },
      Impeller: { innerDia: r.impellerInnerDia, conf: r.impellerConf },
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
  } catch (e) {
    try {
      const raw = fs.readFileSync(
        path.join(__dirname, "..", "..", "output.json"),
        "utf8"
      );
      data = JSON.parse(raw || "[]");
    } catch (e2) {
      data = [];
    }
  }

  const filename = "FanData-export.xlsx";
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "FanData");
  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
}

export async function importFanDataFromExcel(
  fileBase64,
  filename = "uploaded.xlsx"
) {
  if (!fileBase64) throw new Error("No fileBase64 provided");
  const buffer = Buffer.from(fileBase64, "base64");
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  if (!rows || rows.length === 0) return [];

  // small number parser (robust to commas/percent signs)
  const parseNumber = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    let s = String(v).trim();
    if (s === "") return null;
    if (s.endsWith("%")) {
      const n = Number(s.slice(0, -1).replace(/,/g, ""));
      return Number.isNaN(n) ? null : n;
    }
    // remove any non-numeric except .,- and e
    s = s.replace(/[^0-9+\-.,eE]/g, "");
    if ((s.match(/,/g) || []).length > 0 && s.indexOf(".") !== -1)
      s = s.replace(/,/g, "");
    else if (s.indexOf(".") === -1 && s.indexOf(",") !== -1) {
      if ((s.match(/,/g) || []).length > 1) s = s.replace(/,/g, "");
      else s = s.replace(",", ".");
    }
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  };

  // Map a positional row -> FanData payload. offset=1 means first column is ID and fields shift right.
  const fanRowToPayload = (row, offset = 0) => {
    const idx = (i) => i + offset;
    const get = (i) => row[idx(i)] ?? null;

    // expect 10-point curves for AirFlow & others; safe-read with fallback
    const readArray = (startIndex, length = 10) => {
      const out = [];
      for (let i = 0; i < length; i++) {
        out.push(parseNumber(row[idx(startIndex + i)]));
      }
      return out;
    };

    const payload = {
      id: parseNumber(get(-1)), // if offset=1, id is at -1
      bladesSymbol: String(get(2) ?? "") || "",
      bladesMaterial: String(get(3) ?? "") || "",
      noBlades: parseNumber(get(5)),
      bladesAngle: parseNumber(get(4)),
      hubType: parseNumber(get(4)),
      impellerConf: String(get(7) ?? "") || "",
      impellerInnerDia: parseNumber(get(6)),
      desigDensity: parseNumber(get(0)),
      RPM: parseNumber(get(1)),
      airFlow: readArray(8, 10),
      totPressure: readArray(18, 10),
      velPressure: readArray(28, 10),
      staticPressure: readArray(38, 10),
      fanInputPow: readArray(48, 10),
    };
    console.log("Parsed payload:", payload);
    // if first column looks like numeric id include it
    const possibleId = parseNumber(row[0]);
    if (Number.isFinite(possibleId)) payload.id = possibleId;

    return payload;
  };

  // Known field names for header detection
  const knownFields = new Set([
    "id",
    "bladessymbol",
    "bladesmaterial",
    "noblades",
    "bladesangle",
    "hubtype",
    "impellerconf",
    "impellerinnerdia",
    "desigdensity",
    "rpm",
    "airflow",
    "totpressure",
    "velpressure",
    "staticpressure",
    "faninputpow",
  ]);

  // const firstRow = rows[0];
  // const firstRowHasHeaders = firstRow.some((cell) =>
  //   knownFields.has(
  //     String(cell || "")
  //       .toLowerCase()
  //       .replace(/\s+/g, "")
  //   )
  // );

  const records = [];
  // if (firstRowHasHeaders) {
  //   // parse with header mapping
  //   const objs = xlsx.utils.sheet_to_json(sheet, { defval: null });
  //   for (const o of objs) {
  //     // normalize keys and attempt to parse arrays if present as CSV strings
  //     const rec = {};
  //     for (const k of Object.keys(o)) {
  //       const nk = String(k).trim();
  //       const key = nk.replace(/\s+/g, "").toLowerCase();
  //       const val = o[k];
  //       if (
  //         [
  //           "airflow",
  //           "totpressure",
  //           "velpressure",
  //           "staticpressure",
  //           "faninputpow",
  //         ].includes(key)
  //       ) {
  //         if (Array.isArray(val)) rec[key] = val.map((v) => parseNumber(v));
  //         else if (typeof val === "string") {
  //           const parts = val.split(/[,;\|]/).map((s) => parseNumber(s));
  //           rec[key] = parts;
  //         } else rec[key] = val;
  //       } else if (
  //         [
  //           "noblades",
  //           "hubtype",
  //           "rpm",
  //           "bladesangle",
  //           "desigdensity",
  //         ].includes(key)
  //       ) {
  //         rec[key] = parseNumber(val);
  //       } else {
  //         rec[key] = val;
  //       }
  //     }
  //     records.push(rec);
  //   }
  // } else {
  // No headers — treat each row (skip header-like empty first row?)
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const payload = fanRowToPayload(row, 1);
    records.push(payload);
  }
  // }

  // Merge into DB (preferred) or fallback to file
  try {
    for (const rec of records) {
      const idCandidate = rec.id || rec.Id || rec.ID || null;
      const id = Number.isFinite(Number(idCandidate))
        ? Number(idCandidate)
        : null;

      // build data payload mapping to DB columns
      const allowed = [
        "bladesSymbol",
        "bladesMaterial",
        "noBlades",
        "bladesAngle",
        "hubType",
        "impellerConf",
        "impellerInnerDia",
        "desigDensity",
        "RPM",
        "airFlow",
        "totPressure",
        "velPressure",
        "staticPressure",
        "fanInputPow",
      ];

      const normalizeVal = (v) => {
        if (typeof v === "string") {
          const s = v.trim();
          if (
            (s.startsWith("[") && s.endsWith("]")) ||
            (s.startsWith("{") && s.endsWith("}"))
          ) {
            try {
              return JSON.parse(s);
            } catch (e) {
              return v;
            }
          }
          // comma-separated numbers
          if (s.indexOf(",") !== -1) {
            const parts = s.split(/[,;\|]/).map((p) => parseNumber(p));
            return parts;
          }
        }
        return v;
      };

      const dataPayload = {};
      for (const key of allowed) {
        // support different casings
        const candidates = [key, key.toLowerCase(), key.toUpperCase()];
        let val = undefined;
        for (const c of candidates) {
          if (rec[c] !== undefined) {
            val = rec[c];
            break;
          }
        }
        if (val === undefined) {
          // also try direct property names from fanRowToPayload (camelCase)
          if (rec[key] !== undefined) val = rec[key];
          else if (rec[key.toLowerCase()] !== undefined)
            val = rec[key.toLowerCase()];
        }
        if (val !== undefined && val !== null && val !== "") {
          dataPayload[key] = normalizeVal(val);
        }
      }

      if (id) {
        const existing = await prisma.fanData.findUnique({ where: { id } });
        if (!existing) {
          console.warn(`No existing fan with id=${id}, creating new instead.`);
          await prisma.fanData.create({ data: dataPayload });
          continue;
        }
        await prisma.fanData.update({ where: { id }, data: dataPayload });
        continue;
      }

      // No id: try to match by impellerInnerDia + noBlades + bladesSymbol if present
      else {
        await prisma.fanData.create({ data: dataPayload });
      }
    }

    return await prisma.fanData.findMany();
  } catch (err) {
    // fallback to file write
    try {
      const filePath = path.join(__dirname, "..", "..", "output.json");
      const existing = JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
      const merged = existing.concat(records);
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf8");
      return merged;
    } catch (e) {
      throw new Error("Failed to import fan data: " + e.message);
    }
  }
}
