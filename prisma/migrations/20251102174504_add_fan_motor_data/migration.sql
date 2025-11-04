-- CreateTable
CREATE TABLE "fan_data" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "fan_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motor_data" (
    "id" SERIAL NOT NULL,
    "material" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerKW" DOUBLE PRECISION NOT NULL,
    "speedRPM" DOUBLE PRECISION NOT NULL,
    "NoPoles" INTEGER NOT NULL,
    "rated" JSONB NOT NULL,
    "DOL" JSONB NOT NULL,
    "starDelta" JSONB NOT NULL,
    "powerFactor" DOUBLE PRECISION NOT NULL,
    "Phase" INTEGER NOT NULL,
    "frameSize" INTEGER NOT NULL,
    "shaftDia" DOUBLE PRECISION NOT NULL,
    "shaftLength" DOUBLE PRECISION NOT NULL,
    "shaftFeather" DOUBLE PRECISION NOT NULL,
    "IE" INTEGER NOT NULL,
    "frontBear" TEXT NOT NULL,
    "rearBear" TEXT,
    "noiseLvl" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "effCurve" JSONB NOT NULL,
    "NoCapacitors" INTEGER,
    "NoPhases" INTEGER NOT NULL,
    "insClass" TEXT NOT NULL,
    "powerHorse" DOUBLE PRECISION NOT NULL,
    "netpower" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motor_data_pkey" PRIMARY KEY ("id")
);
