import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { createRoomManager } from "./rooms.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 3000;

const app = express();
app.disable("x-powered-by");
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

if (isProd || fs.existsSync(path.join(dist, "index.html"))) {
  app.use(express.static(dist, { maxAge: isProd ? "1h" : 0 }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/socket.io") || req.path.startsWith("/health")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: isProd
    ? { origin: false }
    : { origin: true, credentials: true },
});

const manager = createRoomManager(io);
io.on("connection", (socket) => manager.attach(socket));

server.listen(port, "0.0.0.0", () => {
  console.log(`duo-play ${isProd ? "prod" : "dev"} on :${port}`);
});
