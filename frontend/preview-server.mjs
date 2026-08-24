import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 10000);
const apiTarget = process.env.BRAGSTACK_API_TARGET || "https://api.usebragstack.com";
const distDir = path.join(__dirname, "dist");

app.disable("x-powered-by");
app.get("/preview-health", (_req, res) => res.json({ status: "ok", target: "BragStack PR preview" }));
app.use(
  "/api",
  createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
    secure: true,
    pathRewrite: { "^/api": "" },
    proxyTimeout: 30000,
    timeout: 30000,
  }),
);
app.use(express.static(distDir, { index: false, maxAge: "1h" }));
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  return res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`BragStack PR preview listening on ${port}`);
});
