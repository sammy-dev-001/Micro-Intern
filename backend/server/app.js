const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const { getDBConnection, runMigrations } = require("./db");
const { errorHandler } = require("./middleware/errorHandler");
const { CERTIFICATES_DIR } = require("./middleware/upload");
const skillsRouter = require("./routes/skills");

// Routers
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const mentorshipsRouter = require("./routes/mentorships");
const projectsRouter = require("./routes/projects");
const applicationsRouter = require("./routes/applications");
const deliverablesRouter = require("./routes/deliverables");
const escrowsRouter = require("./routes/escrows");
const webhooksRouter = require("./routes/webhooks");
const reviewsRouter = require("./routes/reviews");
const certificatesRouter = require("./routes/certificates");
const filesRouter = require("./routes/files");
const devRouter = require("./routes/dev");

const app = express();

// Standard middleware
app.use(cors());

// Parse raw body for webhook verification alongside JSON parsing
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// Public certificate PDF download endpoint: /c/:slug.pdf
app.get("/c/:slug.pdf", (req, res, next) => {
  const { slug } = req.params;
  const pdfPath = path.join(CERTIFICATES_DIR, `${slug}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    return res
      .status(404)
      .json({ error: "Certificate PDF not ready or not found." });
  }
  res.sendFile(pdfPath);
});

// Setup api routers for a prefix (supports both /api/v2 and /api for backward compatibility)
function mountApiRoutes(prefix) {
  const subRouter = express.Router();

  subRouter.use("/auth", authRouter);
  subRouter.use("/users", usersRouter);
  subRouter.use("/mentorships", mentorshipsRouter);
  subRouter.use("/projects", projectsRouter);
  subRouter.use("/projects/:id/applications", applicationsRouter);
  subRouter.use("/applications", applicationsRouter);
  subRouter.use("/projects/:id/deliverables", deliverablesRouter);
  subRouter.use("/projects/:id/escrow", escrowsRouter);
  subRouter.use("/projects/:id/reviews", reviewsRouter);
  subRouter.use("/webhooks", webhooksRouter);
  subRouter.use("/certificates", certificatesRouter);
  subRouter.use("/files", filesRouter);
  subRouter.use("/dev", devRouter);
  subRouter.use("/skills", skillsRouter);

  // Shortcut endpoints specified in brief:
  // e.g. GET /api/users/me/mentees, GET /api/users/me/mentor
  subRouter.get("/users/me/mentees", (req, res, next) => {
    req.url = "/mentees";
    mentorshipsRouter(req, res, next);
  });
  subRouter.get("/users/me/mentor", (req, res, next) => {
    req.url = "/mentor";
    mentorshipsRouter(req, res, next);
  });
  // GET /api/users/me/projects
  subRouter.get("/users/me/projects", (req, res, next) => {
    req.url = "/user/me";
    projectsRouter(req, res, next);
  });
  // GET /api/users/:id/reviews
  subRouter.get("/users/:id/reviews", (req, res, next) => {
    req.url = `/user/${req.params.id}`;
    reviewsRouter(req, res, next);
  });
  // Certificates: POST /api/users/me/certificates, GET /api/users/me/certificates
  subRouter.post("/users/me/certificates", (req, res, next) => {
    req.url = "/me/certificates";
    certificatesRouter(req, res, next);
  });
  subRouter.get("/users/me/certificates", (req, res, next) => {
    req.url = "/me/certificates";
    certificatesRouter(req, res, next);
  });
  
  app.use(prefix, subRouter);
}

// Mount both v2 and standard api
mountApiRoutes("/api/v2");
mountApiRoutes("/api");

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: "2.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handler
app.use(errorHandler);

let serverInstance = null;

async function startServer(port = process.env.PORT || 3001) {
  try {
    const db = await getDBConnection();
    await runMigrations(db);
    console.log("✅ SQLite database connected and migrations applied.");

    return new Promise((resolve) => {
      serverInstance = app.listen(port, () => {
        console.log(
          `🚀 MicroIntern Backend (v2.1) running at http://localhost:${port}`,
        );
        resolve(serverInstance);
      });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

module.exports = {
  app,
  startServer,
};

if (require.main === module) {
  startServer();
}
