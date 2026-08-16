import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginRoot = path.join(root, "plugins", "resonance");
const manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
const skillPath = path.join(pluginRoot, "skills", "resonance-engineering", "SKILL.md");
const iconPath = path.join(pluginRoot, "assets", "resonance.svg");

const fail = (message) => {
  console.error(`plugin:check: ${message}`);
  process.exitCode = 1;
};

for (const file of [manifestPath, skillPath, iconPath]) {
  if (!fs.existsSync(file)) fail(`missing required file: ${path.relative(root, file)}`);
}
if (process.exitCode) process.exit();

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`invalid JSON in plugin.json: ${error.message}`);
  process.exit();
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name ?? "")) fail("plugin name must be kebab-case ASCII");
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version ?? "")) fail("plugin version must be strict semver");
if (typeof manifest.description !== "string" || !manifest.description.trim()) fail("plugin description is required");
if (manifest.description.length > 1024) fail("plugin description exceeds 1024 characters");
if (!manifest.author?.name) fail("author.name is required");
if (manifest.skills !== "./skills/") fail("manifest skills must point to ./skills/");

const iface = manifest.interface ?? {};
if (!iface.displayName || iface.displayName.length > 30) fail("interface.displayName must be 1-30 characters");
if (!iface.shortDescription || iface.shortDescription.length > 30 || /[\r\n]/.test(iface.shortDescription)) fail("interface.shortDescription must be one line and <=30 characters");
if (!iface.longDescription || iface.longDescription.length > 4000) fail("interface.longDescription must be <=4000 characters");
if (!iface.developerName || iface.developerName.length > 80) fail("interface.developerName must be 1-80 characters");
if (iface.category !== "Developer Tools") fail("interface.category must be Developer Tools");
if (!Array.isArray(iface.capabilities) || iface.capabilities.length === 0 || iface.capabilities.length > 20) fail("interface.capabilities must contain 1-20 items");
for (const capability of iface.capabilities ?? []) {
  if (typeof capability !== "string" || !capability.trim() || capability.length > 120 || /[\r\n]/.test(capability)) fail("each capability must be one line and <=120 characters");
}
if (!Array.isArray(iface.defaultPrompt) || iface.defaultPrompt.length > 3) fail("interface.defaultPrompt must contain at most 3 prompts");
for (const prompt of iface.defaultPrompt ?? []) {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 128 || /[\r\n]/.test(prompt)) fail("each default prompt must be one line and <=128 characters");
}

const skill = fs.readFileSync(skillPath, "utf8");
if (!skill.startsWith("---\n") || !/^---\n[\s\S]*?\n---\n/.test(skill)) fail("SKILL.md must contain YAML frontmatter");
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/)[1];
if (!/^name:\s*\S+/m.test(frontmatter)) fail("SKILL.md frontmatter requires name");
if (!/^description:\s*\S+/m.test(frontmatter)) fail("SKILL.md frontmatter requires description");
if (skill.length <= frontmatter.length + 10) fail("SKILL.md body must not be empty");

const svg = fs.readFileSync(iconPath, "utf8");
if (!/^<svg\b[^>]*\bwidth="256"[^>]*\bheight="256"[^>]*\bviewBox="0 0 256 256"/s.test(svg)) fail("branding SVG must be a square 256x256 asset");
if (!svg.includes("<svg") || !svg.includes("</svg>")) fail("branding SVG is malformed");

if (process.exitCode) process.exit();
console.log("plugin:check: PASS");
