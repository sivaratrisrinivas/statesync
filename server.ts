import express from "express";
import { createServer as createViteServer } from "vite";
import { DEMO_COMPANY, STATE_TEXT_BLOBS, REQUIRED_FIELDS_BY_STATE, STATE_HELP_TEXT } from "./server/mockData";
import { extractCanonicalPayload } from "./server/gemini";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory sessions
  const sessions: Record<string, any> = {};

  app.get("/api/companies/demo-company", (req, res) => {
    res.json(DEMO_COMPANY);
  });

  app.get("/api/companies/demo-company/locations", (req, res) => {
    res.json(DEMO_COMPANY.locations);
  });

  app.get("/api/companies/demo-company/employees", (req, res) => {
    res.json(DEMO_COMPANY.employees);
  });

  app.post("/api/companies/:id/compliance-sessions", async (req, res) => {
    const { targetState } = req.body;
    const companyId = req.params.id;

    if (companyId !== "demo-company") {
      return res.status(404).json({ error: "Company not found" });
    }

    const stateText = STATE_TEXT_BLOBS[targetState as keyof typeof STATE_TEXT_BLOBS];
    if (!stateText) {
      return res.status(400).json({ error: "Invalid state" });
    }

    const payload = await extractCanonicalPayload(stateText, DEMO_COMPANY, targetState);
    
    const sessionId = crypto.randomUUID();
    
    const session = {
      id: sessionId,
      companyId,
      targetState,
      canonicalPayload: payload,
      ...computeSessionState(payload, targetState)
    };

    sessions[sessionId] = session;
    res.json(session);
  });

  app.get("/api/compliance-sessions/:id", (req, res) => {
    const session = sessions[req.params.id];
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  });

  app.put("/api/compliance-sessions/:id", (req, res) => {
    const session = sessions[req.params.id];
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { fieldPath, value } = req.body;
    
    const parts = fieldPath.split('.');
    let current = session.canonicalPayload;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = isNaN(Number(parts[i+1])) ? {} : [];
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    const updatedState = computeSessionState(session.canonicalPayload, session.targetState);
    Object.assign(session, updatedState);

    res.json(session);
  });

  function computeSessionState(payload: any, targetState: string) {
    const requiredFields = REQUIRED_FIELDS_BY_STATE[targetState as keyof typeof REQUIRED_FIELDS_BY_STATE] || [];
    let score = 50;
    const missingFields: { path: string, helpText: string }[] = [];

    for (const field of requiredFields) {
      const parts = field.split('.');
      let val = payload;
      for (const part of parts) {
        if (val) val = val[part];
      }
      
      if (val && String(val).trim() !== "") {
        score += 1;
      } else {
        score -= 2;
        missingFields.push({
          path: field,
          helpText: STATE_HELP_TEXT[field as keyof typeof STATE_HELP_TEXT] || `Please provide ${field}`
        });
      }
    }

    score = Math.max(0, Math.min(100, score));

    return {
      readinessScore: score,
      missingFields
    };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
