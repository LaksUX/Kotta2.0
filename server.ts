import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Store DB state in a local file for persistent storage across server container instances
  const DB_FILE = path.join(process.cwd(), "app_state.json");

  function readDB() {
    try {
      if (fs.existsSync(DB_FILE)) {
        return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("Failed to read DB file", e);
    }
    // Return empty state if file doesn't exist
    return { users: {}, games: {}, invites: {}, buyins: {} };
  }

  function writeDB(state: any) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write DB file", e);
    }
  }

  // API endpoints to synchronize AppState across all players and devices
  app.get("/api/state", (req, res) => {
    res.json(readDB());
  });

  app.post("/api/state", (req, res) => {
    const newState = req.body;
    writeDB(newState);
    res.json({ success: true });
  });

  // Serve Vite development middleware or production assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
