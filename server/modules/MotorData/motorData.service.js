import fs from "fs";
import xlsx from "xlsx";
import { PrismaClient } from "@prisma/client";

const MOTOR_FILE = "MotorData.json";
const prisma = new PrismaClient();

// Try to read motor data from DB; fall back to file read if DB not available
export async function readMotorFile() {
  try {
    const rows = await prisma.motorData.findMany();
    // map DB rows to the existing JSON shape
    return rows
      .map((r) => ({
        id: r.id,
        material: r.material,
        model: r.model,
        powerKW: r.powerKW,
        speedRPM: r.speedRPM,
        NoPoles: r.NoPoles,
        rated: r.rated,
        DOL: r.DOL,
        starDelta: r.starDelta,
        powerFactor: r.powerFactor,
        Phase: r.Phase,
        frameSize: r.frameSize,
        shaftDia: r.shaftDia,
        shaftLength: r.shaftLength,
        shaftFeather: r.shaftFeather,
        IE: r.IE,
        frontBear: r.frontBear,
        rearBear: r.rearBear,
        noiseLvl: r.noiseLvl,
        weightKg: r.weightKg,
        effCurve: r.effCurve,
        NoCapacitors: r.NoCapacitors,
        NoPhases: r.NoPhases,
        insClass: r.insClass,
        powerHorse: r.powerHorse,
        netpower: r.netpower,
      }))
      .sort((a, b) => a.id - b.id);
  } catch (err) {
    // fallback to reading the file if DB not configured/available
    try {
      const raw = fs.readFileSync(MOTOR_FILE, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}

export async function getMotorData() {
  return await readMotorFile();
}

// Delete a motor by numeric id. Returns the deleted record id on success.
export async function deleteMotorById(id) {
  if (!id) throw new Error("No id provided");
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error("Invalid id");

  try {
    // try DB delete first
    const deleted = await prisma.motorData.delete({ where: { id: numId } });
    return { id: deleted.id };
  } catch (err) {
    // fallback to file-based deletion
    try {
      const raw = fs.readFileSync(MOTOR_FILE, "utf8");
      const arr = JSON.parse(raw || "[]");
      const idx = arr.findIndex((m) => {
        if (m == null) return false;
        // support id or Id
        return Number(m.id ?? m.Id) === numId;
      });
      if (idx === -1) {
        const notFound = new Error("Not found");
        notFound.code = "NOT_FOUND";
        throw notFound;
      }
      arr.splice(idx, 1);
      fs.writeFileSync(MOTOR_FILE, JSON.stringify(arr, null, 2), "utf8");
      return { id: numId };
    } catch (e) {
      // propagate not found specially
      if (e && e.code === "NOT_FOUND") throw e;
      throw new Error("Failed to delete motor: " + e.message);
    }
  }
}

export async function exportMotorData(res) {
  let data = [];
  try {
    const raw = await readMotorFile();
    data = raw.map((r) => ({
      Id: r.id,
      Material: r.material,
      Model: r.model,
      "Power (Kw)": r.powerKW,
      "Speed RPM": r.speedRPM,
      "No. Poles": r.NoPoles,
      "Rated Current-In": r.rated?.currentInput ?? null,
      "Rated Tourque": r.rated?.tourqueNm ?? null,
      "Direct On Line Current": r.DOL?.current ?? null,
      "Direct On Line La/ln": r.DOL?.laln ?? null,
      "Direct On Line Tourque": r.DOL?.tourque ?? null,
      "Direct On Line Ma/Mn": r.DOL?.MaMn ?? null,
      "Delta Starting Current": r.starDelta?.current ?? null,
      "Delta Starting La/ln": r.starDelta?.laln ?? null,
      "Delta Starting Tourque": r.starDelta?.tourque ?? null,
      "Delta Starting Ma/Mn": r.starDelta?.MaMn ?? null,
      "Power Factor": r.powerFactor,
      Phase: r.Phase,
      "Frame Size": r.frameSize,
      "Shaft Diameter": r.shaftDia,
      "Shaft Length": r.shaftLength,
      "Shaft Feather Key Length": r.shaftFeather,
      IE: r.IE,
      "Front Bearing": r.frontBear,
      "Rear Bearing": r.rearBear,
      "Noise Level (dB-A)": r.noiseLvl,
      "Weight (Kg)": r.weightKg,
      "Efficiency@50HZ":
        Array.isArray(r.effCurve) && r.effCurve.length > 0
          ? r.effCurve[0]
          : null,
      "Efficiency@37.5HZ":
        Array.isArray(r.effCurve) && r.effCurve.length > 1
          ? r.effCurve[1]
          : null,
      "Efficiency@25HZ":
        Array.isArray(r.effCurve) && r.effCurve.length > 2
          ? r.effCurve[2]
          : null,
      "No. of Capacitors": r.NoCapacitors,
      "No. of Phases": r.NoPhases,
      "Insulation Class": r.insClass,
      "Power (HP)": r.powerHorse,
    }));
  } catch (err) {
    console.error("Failed to read motor data for export:", err);
    throw new Error("Failed to read motor data for export: " + err.message);
  }
  const filename = "MotorData-export.xlsx";

  // convert JSON to worksheet
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "MotorData");

  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
}
const parseNumber = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim();
  if (s === "") return null;
  if (s.endsWith("%")) {
    const num = Number(s.slice(0, -1).replace(/,/g, "").trim());
    return Number.isNaN(num) ? null : num;
  }
  s = s.replace(/[^0-9+\-.,eE\[\]\{\}\:\"\'\s]/g, "");
  if ((s.match(/,/g) || []).length > 0 && s.indexOf(".") !== -1) {
    s = s.replace(/,/g, "");
  } else {
    if (s.indexOf(".") === -1 && s.indexOf(",") !== -1) {
      if ((s.match(/,/g) || []).length > 1) s = s.replace(/,/g, "");
      else s = s.replace(",", ".");
    }
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};
const motorRowToPayload = (row, offset = 0) => {
  // indices based on the sample mapping
  const idx = (i) => i + offset;
  const get = (i) => row[idx(i)] ?? null;

  const effCurve = () => {
    // sample effCurve in sample uses indexes 26..28 when offset=0
    const a = [get(27), get(28), get(29)].map((v) => parseNumber(v));
    return a;
  };

  const payload = {
    material: String(get(1) ?? "") || "",
    model: String(get(2) ?? "") || "",
    powerKW: parseNumber(get(3)),
    speedRPM: parseNumber(get(4)),
    NoPoles: parseNumber(get(5)),
    rated: {
      currentInput: parseNumber(get(6)),
      tourqueNm: parseNumber(get(7)),
    },
    DOL: {
      current: parseNumber(get(8)),
      laln: parseNumber(get(9)),
      tourque: parseNumber(get(10)),
      MaMn: parseNumber(get(11)),
    },
    starDelta: {
      current: parseNumber(get(12)),
      laln: parseNumber(get(13)),
      tourque: parseNumber(get(14)),
      MaMn: parseNumber(get(15)),
    },
    powerFactor: parseNumber(get(16)),
    Phase: parseNumber(get(17)),
    frameSize: parseNumber(get(18)),
    shaftDia: parseNumber(get(19)),
    shaftLength: parseNumber(get(20)),
    shaftFeather: parseNumber(get(21)),
    IE: parseNumber(get(22)),
    frontBear: String(get(23) ?? "") || "",
    rearBear: String(get(24) ?? "") || "",
    noiseLvl: parseNumber(get(25)),
    weightKg: parseNumber(get(26)),
    effCurve: effCurve(),
    NoCapacitors: parseNumber(get(30)),
    NoPhases: parseNumber(get(31)),
    insClass: String(get(32) ?? "") || "",
    powerHorse: parseNumber(get(33)),
  };
  // if first column looks like a numeric id, include it so callers can update by id
  const possibleId = parseNumber(row[0]);
  if (Number.isFinite(possibleId)) payload.id = possibleId;
  // netpower if possible
  if (
    payload.powerKW != null &&
    Array.isArray(payload.effCurve) &&
    payload.effCurve[0] != null
  ) {
    payload.netpower = parseNumber(payload.powerKW * payload.effCurve[0]);
  } else {
    payload.netpower = parseNumber(get(34) ?? null);
  }

  return payload;
};
export async function updateMotorDataFromExcel(
  fileBase64,
  filename = "uploaded.xlsx"
) {
  if (!fileBase64) throw new Error("No fileBase64 provided");

  const buffer = Buffer.from(fileBase64, "base64");
  const workbook = xlsx.read(buffer, { type: "buffer" });
  // parse first sheet into array of objects (header row expected)
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // We'll first try to detect whether the sheet contains a header row.
  // Read as array-of-rows so we can decide behavior.
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Known field names for header detection / mapping
  const knownFields = new Set([
    "id",
    "model",
    "material",
    "powerkw",
    "speedrpm",
    "nopoles",
    "rated",
    "dol",
    "stardelta",
    "powerfactor",
    "phase",
    "framesize",
    "shaftdia",
    "shaftlength",
    "shaftfeather",
    "ie",
    "frontbear",
    "rearbear",
    "noiselvl",
    "weightkg",
    "effcurve",
    "nocapacitors",
    "nophases",
    "insclass",
    "powerhorse",
    "netpower",
  ]);

  // Default column->field mapping when the sheet has no header row.
  // This mirrors the expectation: row[i][0] may be id (if numeric), row[i][1] -> model, row[i][2] -> material, etc.
  const colMap = [
    "id", // column 0: optional existing DB id
    "model",
    "material",
    "powerKW",
    "speedRPM",
    "NoPoles",
    "rated",
    "DOL",
    "starDelta",
    "powerFactor",
    "Phase",
    "frameSize",
    "shaftDia",
    "shaftLength",
    "shaftFeather",
    "IE",
    "frontBear",
    "rearBear",
    "noiseLvl",
    "weightKg",
    "effCurve",
    "NoCapacitors",
    "NoPhases",
    "insClass",
    "powerHorse",
    "netpower",
  ];

  // Helper: normalize header cell text
  const normalize = (s) =>
    typeof s === "string" ? s.trim().toLowerCase() : "";

  let records = [];

  if (rows.length === 0) return [];

  const firstRow = rows[0];
  const firstRowHasHeaders = firstRow.some((cell) =>
    knownFields.has(normalize(cell))
  );

  // No header row: use motorRowToPayload to normalize positional rows.
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    // detect whether first column is an id (numeric). If so, offset fields by 1.

    const payload = motorRowToPayload(row, 0);
    records.push(payload);
  }

  // Helper: robust number parser (adapted from your sample)

  // Map a positional row into a motor payload. If offset===1, row[0] is treated as ID and fields shift right.

  // If DB available, merge into DB by model (case-insensitive where possible)
  try {
    for (const rec of records) {
      // If first column was an ID (numeric), update by id
      const idCandidate = rec.id ?? rec.ID ?? null;
      const id = Number.isFinite(Number(idCandidate))
        ? Number(idCandidate)
        : null;

      // Build update/create payload: only include allowed fields and non-empty values
      const allowed = [
        "material",
        "model",
        "powerKW",
        "speedRPM",
        "NoPoles",
        "rated",
        "DOL",
        "starDelta",
        "powerFactor",
        "Phase",
        "frameSize",
        "shaftDia",
        "shaftLength",
        "shaftFeather",
        "IE",
        "frontBear",
        "rearBear",
        "noiseLvl",
        "weightKg",
        "effCurve",
        "NoCapacitors",
        "NoPhases",
        "insClass",
        "powerHorse",
        "netpower",
      ];

      const normalizeVal = (v) => {
        // try to parse JSON-like strings for arrays/objects
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
        }
        return v;
      };

      const dataPayload = {};
      for (const key of allowed) {
        // support header names lowercased if present
        const candidates = [key, key.toLowerCase(), key.toUpperCase()];
        let val = null;
        for (const c of candidates) {
          if (rec[c] !== undefined) {
            val = rec[c];
            break;
          }
        }
        if (val !== null && val !== undefined && val !== "") {
          dataPayload[key] = normalizeVal(val);
        }
      }

      if (id) {
        // update by id
        const existing = await prisma.motorData.findUnique({ where: { id } });
        if (!existing) {
          // skip if no such id
          await prisma.motorData.create({ data: dataPayload });
        }
        await prisma.motorData.update({ where: { id }, data: dataPayload });
        continue;
      }

      // otherwise try matching by model if present
      // const modelVal = (dataPayload.model ?? rec.model ?? rec.Model ?? "") + "";
      // if (modelVal) {
      //   const existing = await prisma.motorData.findFirst({
      //     where: { model: { equals: modelVal, mode: "insensitive" } },
      //   });
      //   if (existing) {
      //     console.log(existing,dataPayload)
      //     await prisma.motorData.update({
      //       where: { id: existing.id },
      //       data: dataPayload,
      //     });
      //   } else {
      //     await prisma.motorData.create({ data: dataPayload });
      //   }
      // }
      else {
        // no id and no model -> create new
        await prisma.motorData.create({ data: dataPayload });
      }
    }

    // return the full updated set from DB
    return await readMotorFile();
  } catch (err) {
    // fallback to file-based merge if DB operations fail
    const existing = (function () {
      try {
        const raw = fs.readFileSync(MOTOR_FILE, "utf8");
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    })();

    const map = new Map();
    existing.forEach((m) => {
      const key = (m.model ?? m.Model ?? "") + "";
      map.set(key.toLowerCase(), { ...m });
    });

    json.forEach((rec) => {
      const key = (rec.model ?? rec.Model ?? "") + "";
      const k = key.toLowerCase();
      if (map.has(k)) {
        const base = map.get(k);
        // merge: overwrite only when value is not null/undefined/empty-string
        Object.keys(rec).forEach((field) => {
          const v = rec[field];
          if (v !== null && v !== undefined && v !== "") {
            base[field] = v;
          }
        });
        map.set(k, base);
      } else {
        map.set(k, { ...rec });
      }
    });

    const merged = Array.from(map.values());
    fs.writeFileSync(MOTOR_FILE, JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
}
