const http = require("http");
const fs = require("fs");
const path = require("path");

const SKILLS_ROOT = path.join(__dirname, "..", "skills");
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// ---- skill scanning ----

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const yamlBlock = match[1];
  const body = match[2];
  const meta = {};
  let currentKey = null;
  for (const line of yamlBlock.split("\n")) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      let val = kv[2].trim();
      if (val === "|") {
        meta[currentKey] = "";
        continue;
      }
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      meta[currentKey] = val;
    } else if (currentKey && line.startsWith("  ")) {
      // multiline value or nested
      const trimmed = line.trim();
      if (trimmed && !trimmed.includes(":")) {
        meta[currentKey] = (meta[currentKey] ? meta[currentKey] + " " : "") + trimmed;
      } else if (trimmed) {
        // nested key like metadata.author
        const nested = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
        if (nested) {
          meta[`${currentKey}.${nested[1]}`] = nested[2].trim().replace(/^"|"$/g, "");
        }
      }
    }
  }
  return { meta, body };
}

function findSkills() {
  const skills = [];
  function walk(dir, category) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const skillFile = path.join(fullPath, "SKILL.md");
        if (fs.existsSync(skillFile)) {
          const raw = fs.readFileSync(skillFile, "utf-8");
          const { meta, body } = parseFrontmatter(raw);
          const relPath = path.relative(SKILLS_ROOT, skillFile);
          const slug = relPath.replace(/\/SKILL\.md$/, "").replace(/\//g, "/");
          skills.push({
            slug,
            category: category || slug.split("/")[0],
            title: meta.title || slug.split("/").pop(),
            description: meta.description || "",
            version: meta["metadata.version"] || meta.version || "",
            author: meta["metadata.author"] || meta.author || "",
            path: relPath,
            body,
          });
        } else {
          // subfolder without SKILL.md — recurse but track category
          walk(fullPath, category || entry.name);
        }
      }
    }
  }
  walk(SKILLS_ROOT, null);
  return skills.sort((a, b) => a.slug.localeCompare(b.slug));
}

const SKILLS = findSkills();

// ---- HTTP server ----

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/skills") {
    sendJson(res, 200, SKILLS.map((s) => ({
      slug: s.slug,
      category: s.category,
      title: s.title,
      description: s.description,
      version: s.version,
      author: s.author,
    })));
    return;
  }

  if (url.pathname.startsWith("/api/skill/")) {
    const slug = decodeURIComponent(url.pathname.replace("/api/skill/", ""));
    const skill = SKILLS.find((s) => s.slug === slug);
    if (!skill) {
      sendJson(res, 404, { error: "Skill not found" });
      return;
    }
    // also load reference files if any
    const skillDir = path.dirname(path.join(SKILLS_ROOT, skill.path));
    let references = [];
    const refsDir = path.join(skillDir, "references");
    if (fs.existsSync(refsDir)) {
      references = fs.readdirSync(refsDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({ name: f, slug: f.replace(/\.md$/, "") }));
    }
    sendJson(res, 200, { ...skill, references });
    return;
  }

  if (url.pathname.startsWith("/api/reference/")) {
    const parts = decodeURIComponent(url.pathname.replace("/api/reference/", "")).split("/");
    const refName = parts.pop() + ".md";
    const skillSlug = parts.join("/");
    const skill = SKILLS.find((s) => s.slug === skillSlug);
    if (!skill) {
      sendJson(res, 404, { error: "Skill not found" });
      return;
    }
    const refPath = path.join(path.dirname(path.join(SKILLS_ROOT, skill.path)), "references", refName);
    if (!fs.existsSync(refPath)) {
      sendJson(res, 404, { error: "Reference not found" });
      return;
    }
    const raw = fs.readFileSync(refPath, "utf-8");
    sendJson(res, 200, { name: refName, body: raw });
    return;
  }

  // static files
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  sendFile(res, path.join(PUBLIC_DIR, filePath));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Binance Skills Hub viewer running on http://0.0.0.0:${PORT}`);
  console.log(`Loaded ${SKILLS.length} skills`);
});
