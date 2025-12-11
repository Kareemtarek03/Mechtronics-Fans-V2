import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  console.log("🌱 Starting database seed...");

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: "superadmin@fanselect.com" },
  });

  if (existingSuperAdmin) {
    console.log("✅ Super admin already exists!");
    console.log("   Email: superadmin@fanselect.com");
    return;
  }

  // Create super admin user
  const hashedPassword = await bcrypt.hash("SuperAdmin@123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@fanselect.com",
      firstName: "Super",
      lastName: "Admin",
      password: hashedPassword,
      role: "super_admin",
      emailVerified: true,
    },
  });

  console.log("✅ Super admin created successfully!");
  console.log("   Email: superadmin@fanselect.com");
  console.log("   Password: SuperAdmin@123");
  console.log("   Role: super_admin");
  console.log("");
  console.log("🎉 You can now login with these credentials!");
}
async function seedFanData() {
  console.log("🌬️ Seeding FanData...");
  const fans = JSON.parse(fs.readFileSync("./server/axialFan.json", "utf-8"));

  for (const fanJson of fans) {
    await prisma.fanData.create({
      data: {
        No: fanJson.No,
        Model: fanJson.Model,
        AFS: fanJson["AF-S"],
        AFL: fanJson["AF-L"],
        WF: fanJson.WF,
        ARTF: fanJson.ARTF,
        SF: fanJson.SF,
        ABSFC: fanJson["ABSF-C"],
        ABSFS: fanJson["ABSF-S"],
        SABF: fanJson.SABF,
        SARTF: fanJson.SARTF,
        AJF: fanJson.AJF,
        bladesSymbol: fanJson.Blades.symbol,
        bladesMaterial: fanJson.Blades.material,
        noBlades: fanJson.Blades.noBlades,
        bladesAngle: fanJson.Blades.angle,
        hubType: fanJson.hubType,
        impellerConf: fanJson.Impeller.conf,
        impellerInnerDia: fanJson.Impeller.innerDia,
        desigDensity: fanJson.desigDensity,
        RPM: fanJson.RPM,
        airFlow: fanJson.airFlow,
        totPressure: fanJson.totPressure,
        velPressure: fanJson.velPressure,
        staticPressure: fanJson.staticPressure,
        fanInputPow: fanJson.fanInputPow,
      },
    });
  }

  console.log("✅ FanData seeded successfully!");
}

async function seedMotorData() {
  console.log("⚙️ Seeding MotorData...");
  const motors = JSON.parse(
    fs.readFileSync("./server/MotorData.json", "utf-8")
  );

  if (Array.isArray(motors)) {
    for (const motorJson of motors) {
      await prisma.motorData.create({
        data: {
          material: motorJson.material,
          model: motorJson.model,
          powerKW: motorJson.powerKW,
          speedRPM: motorJson.speedRPM,
          NoPoles: motorJson.NoPoles,
          rated: motorJson.rated,
          DOL: motorJson.DOL,
          starDelta: motorJson.starDelta,
          powerFactor: motorJson.powerFactor,
          Phase: motorJson.Phase,
          frameSize: motorJson.frameSize,
          shaftDia: motorJson.shaftDia,
          shaftLength: motorJson.shaftLength,
          shaftFeather: motorJson.shaftFeather,
          IE: motorJson.IE,
          frontBear: motorJson.frontBear,
          rearBear: motorJson.rearBear || "",
          noiseLvl: motorJson.noiseLvl,
          weightKg: motorJson.weightKg,
          effCurve: motorJson.effCurve,
          NoCapacitors: motorJson.NoCapacitors,
          NoPhases: motorJson.NoPhases,
          insClass: motorJson.insClass,
          powerHorse: motorJson.powerHorse,
          netpower: motorJson.netpower,
        },
      });
    }
    console.log(`✅ Seeded ${motors.length} motor records successfully!`);
  } else {
    // Single object
    await prisma.motorData.create({
      data: {
        material: motors.material,
        model: motors.model,
        powerKW: motors.powerKW,
        speedRPM: motors.speedRPM,
        NoPoles: motors.NoPoles,
        rated: motors.rated,
        DOL: motors.DOL,
        starDelta: motors.starDelta,
        powerFactor: motors.powerFactor,
        Phase: motors.Phase,
        frameSize: motors.frameSize,
        shaftDia: motors.shaftDia,
        shaftLength: motors.shaftLength,
        shaftFeather: motors.shaftFeather,
        IE: motors.IE,
        frontBear: motors.frontBear,
        rearBear: motors.rearBear || "",
        noiseLvl: motors.noiseLvl,
        weightKg: motors.weightKg,
        effCurve: motors.effCurve,
        NoCapacitors: motors.NoCapacitors,
        NoPhases: motors.NoPhases,
        insClass: motors.insClass,
        powerHorse: motors.powerHorse,
        netpower: motors.netpower,
      },
    });
    console.log(`✅ Seeded 1 motor record successfully!`);
  }

  console.log("✅ MotorData seeded successfully!");
}

async function main() {
  console.log("🚀 Starting full seed process...\n");
  await seedSuperAdmin();
  await seedFanData();
  await seedMotorData();
  console.log("\n🎉 All data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
