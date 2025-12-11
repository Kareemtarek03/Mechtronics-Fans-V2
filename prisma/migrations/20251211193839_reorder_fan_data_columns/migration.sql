-- Recreate fan_data table with columns in correct order
-- Step 1: Create new table with correct column order
CREATE TABLE "fan_data_new" (
    "id" SERIAL NOT NULL,
    "No" INTEGER,
    "Model" TEXT,
    "AF-S" INTEGER,
    "AF-L" INTEGER,
    "WF" INTEGER,
    "ARTF" INTEGER,
    "SF" INTEGER,
    "ABSF-C" INTEGER,
    "ABSF-S" INTEGER,
    "SABF" INTEGER,
    "SARTF" INTEGER,
    "AJF" INTEGER,
    "bladesSymbol" TEXT NOT NULL,
    "bladesMaterial" TEXT NOT NULL,
    "noBlades" INTEGER NOT NULL,
    "bladesAngle" DOUBLE PRECISION NOT NULL,
    "hubType" INTEGER NOT NULL,
    "impellerConf" TEXT NOT NULL,
    "impellerInnerDia" DOUBLE PRECISION NOT NULL,
    "desigDensity" DOUBLE PRECISION NOT NULL,
    "RPM" DOUBLE PRECISION NOT NULL,
    "airFlow" JSONB NOT NULL,
    "totPressure" JSONB NOT NULL,
    "velPressure" JSONB NOT NULL,
    "staticPressure" JSONB NOT NULL,
    "fanInputPow" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_data_new_pkey" PRIMARY KEY ("id")
);

-- Step 2: Copy data from old table to new table
INSERT INTO "fan_data_new" (
    "id", "No", "Model", "AF-S", "AF-L", "WF", "ARTF", "SF", "ABSF-C", "ABSF-S",
    "SABF", "SARTF", "AJF", "bladesSymbol", "bladesMaterial", "noBlades",
    "bladesAngle", "hubType", "impellerConf", "impellerInnerDia", "desigDensity",
    "RPM", "airFlow", "totPressure", "velPressure", "staticPressure",
    "fanInputPow", "createdAt", "updatedAt"
)
SELECT
    "id", "No", "Model", "AF-S", "AF-L", "WF", "ARTF", "SF", "ABSF-C", "ABSF-S",
    "SABF", "SARTF", "AJF", "bladesSymbol", "bladesMaterial", "noBlades",
    "bladesAngle", "hubType", "impellerConf", "impellerInnerDia", "desigDensity",
    "RPM", "airFlow", "totPressure", "velPressure", "staticPressure",
    "fanInputPow", "createdAt", "updatedAt"
FROM "fan_data";

-- Step 3: Drop old table
DROP TABLE "fan_data";

-- Step 4: Rename new table to original name
ALTER TABLE "fan_data_new" RENAME TO "fan_data";

-- Step 5: Rename constraint
ALTER TABLE "fan_data" RENAME CONSTRAINT "fan_data_new_pkey" TO "fan_data_pkey";

-- Step 6: Reset sequence to continue from max id
SELECT setval(pg_get_serial_sequence('fan_data', 'id'), COALESCE((SELECT MAX(id) FROM fan_data), 0) + 1, false);