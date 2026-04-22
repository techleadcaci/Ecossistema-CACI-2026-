await import("./dist/src/api/auth.js");
await import("./dist/src/api/governance.js");
await import("./dist/src/api/metrics.js");
await import("./dist/src/api/esg.js");
await import("./dist/src/api/automation.js");
await import("./dist/src/api/cms.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * 🔥 CLOUD RUN PORT (OBRIGATÓRIO)
 */
const PORT = process.env.PORT || 8080;

/**
 * 🔥 MIDDLEWARES
 */
app.use(cors());
app.use(express.json());

/**
 * 🔥 HEALTH CHECK (OBRIGATÓRIO)
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "caci-ecossistema",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 🔥 FIREBASE ADMIN (SAFE INIT)
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
 * 🔥 API ROUTES
 */
async function loadRoutes() {
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
}

/**
 * 🔥 FRONTEND (SOMENTE BUILD FINAL)
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
 * 🔥 STARTUP (CRÍTICO)
 */
async function start() {
  await loadRoutes();
  loadFrontend();

  app.listen(process.env.PORT || 8080, "0.0.0.0"), () => {
    console.log("=================================");
    console.log("🚀 CACI ECOSSISTEMA ONLINE");
    console.log(`PORT: ${PORT}`);
    console.log(`ENV: ${process.env.NODE_ENV || "production"}`);
    console.log("=================================");
  });
}

start();
