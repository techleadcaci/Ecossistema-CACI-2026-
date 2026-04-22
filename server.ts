import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * 🔥 CLOUD RUN: PORTA OBRIGATÓRIA
 */
const PORT = process.env.PORT || 8080;

/**
 * 🔥 MIDDLEWARES BÁSICOS
 */
app.use(cors());
app.use(express.json());

/**
 * 🔥 HEALTH CHECK (OBRIGATÓRIO PARA CLOUD RUN)
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "caci-ecossistema",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 🔥 FIREBASE ADMIN SAFE INIT
 * (não quebra se arquivo não existir)
 */
try {
  const configPath = path.join(__dirname, "firebase-applet-config.json");

  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    }

    console.log("[FIREBASE] Admin inicializado");
  } else {
    console.warn("[FIREBASE] Config não encontrada — rodando sem admin init");
  }
} catch (err) {
  console.error("[FIREBASE ERROR]", err);
}

/**
 * 🔥 ROTAS API (IMPORTAÇÃO SEGURA)
 */
async function loadRoutes() {
  try {
    const { authRouter } = await import("./src/api/auth");
    const { governanceRouter } = await import("./src/api/governance");
    const { metricsRouter } = await import("./src/api/metrics");
    const { esgRouter } = await import("./src/api/esg");
    const { automationRouter } = await import("./src/api/automation");
    const { cmsRouter } = await import("./src/api/cms");

    app.use("/api/auth", authRouter);
    app.use("/api/governance", governanceRouter);
    app.use("/api/metrics", metricsRouter);
    app.use("/api/esg", esgRouter);
    app.use("/api/automation", automationRouter);
    app.use("/api/cms", cmsRouter);

    console.log("[ROUTES] carregadas com sucesso");
  } catch (err) {
    console.error("[ROUTES ERROR]", err);
  }
}

/**
 * 🔥 FRONTEND (VITE / PROD BUILD)
 */
function loadFrontend() {
  const distPath = path.join(process.cwd(), "dist");

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "Not found" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

/**
 * 🔥 STARTUP SEQUENCIAL (CRÍTICO PARA CLOUD RUN)
 */
async function start() {
  await loadRoutes();
  loadFrontend();

  app.listen(PORT, "0.0.0.0", () => {
    console.log("=====================================");
    console.log("🚀 CACI ECOSSISTEMA ONLINE");
    console.log(`🌐 PORT: ${PORT}`);
    console.log(`⚙️ ENV: ${process.env.NODE_ENV || "production"}`);
    console.log("=====================================");
  });
}

/**
 * 🔥 ENTRYPOINT
 */
start();
