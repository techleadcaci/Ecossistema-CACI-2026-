import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * MIDDLEWARES
 */
app.use(cors());
app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "caci-ecossistema",
    timestamp: new Date().toISOString(),
  });
});

/**
 * FIREBASE
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

    console.log("[FIREBASE] OK");
  }
} catch (err) {
  console.error("[FIREBASE ERROR]", err);
}

/**
 * 🚨 ROTAS DESATIVADAS (TEMPORÁRIO)
 */
async function loadRoutes() {
  // DESATIVADO PARA GARANTIR QUE O SERVIDOR SOBE
}

/**
 * FRONTEND
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
 * START
 */
async function start() {
  await loadRoutes();
  loadFrontend();

  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("🚀 CACI ECOSSISTEMA ONLINE");
    console.log(`PORT: ${PORT}`);
    console.log("=================================");
  });
}

start();
