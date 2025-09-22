import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
2
import { DEMO_SECRET } from "./config.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// Healthcheck
app.get("/healthz", (_req, res) => {
res.json({ ok: true, ts: new Date().toISOString() });
});
// 1) 反射型 XSS デモ（テンプレート無エスケープ）
// http://localhost:3000/hello?name=<script>alert(1)</script>
app.get("/hello", (req, res) => {
const name = req.query.name || "world";
// EJS の <%- %> は「非エスケープ埋め込み」→ 脆弱
res.render("hello", { name });
});
// 2) 疑似 SQLi デモ（危険な文字列連結）: 実際の DB 実行はしない
// http://localhost:3000/user-search?name=' OR '1'='1
app.get("/user-search", (req, res) => {
const name = req.query.name || "alice";
const insecureQuery = "SELECT * FROM users WHERE name = '" + name + "'"; // 脆弱
// デモのためログに出す（本番では絶対NG）
res.json({ message: "This query would be vulnerable", query: insecureQuery });
});
// 3) Path Traversal デモ（正規化・検証不足）
// 例: /file?path=sample.txt や /file?path=../src/config.js
app.get("/file", async (req, res) => {
const p = req.query.path;
if (!p) return res.status(400).json({ error: "path query required" });
const base = path.join(__dirname, "../data");
// 正規化・ブロックなしの結合 → ../ による上位パス参照が可能（コンテナ内に限定）
const target = path.join(base, p);
try {
const content = await fs.readFile(target, "utf-8");
res.type("text/plain").send(content);
} catch (e) {
res.status(404).json({ error: "not found", details: String(e) });
}
});
// デモ秘密値を露出（情報漏えいの悪例）
app.get("/leak", (_req, res) => {
res.json({ secret: DEMO_SECRET });
});
3
app.get("/", (_req, res) => {
res.type("text/plain").send(`ASPM Demo\n/hello?name=... (XSS)\n/user-search?name=... (SQLilike)\n/file?path=... (Path Traversal)\n/leak (Hardcoded secret leak)`);
});
app.listen(process.env.PORT || 3000, () => {
console.log(`ASPM demo listening on :${process.env.PORT || 3000}`);
});

