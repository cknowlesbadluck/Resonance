/**
 * Static guard (no DB access): every table created in supabase/migrations must
 * have row level security enabled somewhere in the migration history, and no
 * migration may grant table privileges to anon/public or ALL to authenticated.
 * Function EXECUTE grants to authenticated are allowed (RLS helper functions).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
/**
 * Lex SQL into "code only": drop -- and nested /* *\/ comments, blank out the contents of
 * '...' and $tag$...$tag$ literals (data, never statements), and keep "quoted" identifiers
 * with their inner whitespace replaced by \u0001 so no statement pattern can start inside one.
 */
export function strip(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const two = sql.slice(i, i + 2);
    if (two === "--") { const n = sql.indexOf("\n", i); i = n === -1 ? sql.length : n; continue; }
    if (two === "/*") {
      let depth = 1; let j = i + 2;
      while (j < sql.length && depth > 0) {
        const t = sql.slice(j, j + 2);
        if (t === "/*") { depth++; j += 2; } else if (t === "*/") { depth--; j += 2; } else j++;
      }
      i = j; out += " "; continue;
    }
    if (c === "'" || c === '"') {
      // E'...' escape strings: a backslash escapes the next char (incl. a quote).
      const esc = c === "'" && /[eE]/.test(sql[i - 1] ?? "") && !/[\w$]/.test(sql[i - 2] ?? "");
      let j = i + 1;
      while (j < sql.length) { if (esc && sql[j] === "\\") { j += 2; continue; } if (sql[j] === c) { if (sql[j + 1] === c) { j += 2; continue; } break; } j++; }
      const body = sql.slice(i + 1, Math.min(j, sql.length));
      out += c + (c === "'" ? " ".repeat(body.length) : body.replace(/\s/g, "\u0001")) + (j < sql.length ? c : "");
      i = j + 1; continue;
    }
    if (/[\w$]/.test(c)) {
      // An identifier or keyword (may contain $): consume it whole so foo$tag$ is never a delimiter.
      if (c !== "$") { const m = /^[\w$]+/.exec(sql.slice(i))!; out += m[0]; i += m[0].length; continue; }
      const tag = /^\$(?:[A-Za-z_\u0080-\uffff][\w\u0080-\uffff]*)?\$/.exec(sql.slice(i));
      if (tag) {
        const n = sql.indexOf(tag[0], i + tag[0].length);
        const end = n === -1 ? sql.length : n + tag[0].length;
        out += tag[0] + " ".repeat(Math.max(0, end - i - 2 * tag[0].length)) + (n === -1 ? "" : tag[0]);
        i = end; continue;
      }
    }
    out += c; i++;
  }
  return out;
}
/** Kept for callers: idempotent after strip(); skips "quoted" identifiers so "O'Neil" never pairs an apostrophe. */
export function maskStrings(sql: string): string {
  return sql.replace(/"(?:[^"]|"")*"|'(?:[^']|'')*'/g, (m) => (m[0] === '"' ? m : "'" + " ".repeat(m.length - 2) + "'"));
}
const sql = files.map((f) => maskStrings(strip(readFileSync(join(dir, f), "utf8")))).join(";\n");
/** Postgres identifier rules: unquoted parts fold to lower case, quoted parts keep case. */
export function norm(name: string): string {
  const parts = name.match(/"(?:[^"]|"")*"|[^.]+/g) ?? [];
  const folded = parts.map((p) => (p.startsWith('"') ? p.slice(1, -1).replace(/""/g, '"').replace(/\u0001/g, " ") : p.toLowerCase()));
  if (folded.length === 2 && folded[0] === "public") folded.shift();
  // Multi-part keys keep component boundaries (public."a.b" stays distinct from schema a, table b).
  return folded.length === 1 ? folded[0] : JSON.stringify(folded);
}
const IDENT = String.raw`((?:"(?:[^"]|"")*"|[\w$]+)(?:\.(?:"(?:[^"]|"")*"|[\w$]+))?)`;

export function createdTables(text: string): string[] {
  const re = new RegExp(String.raw`create\s+(?:(?:global|local)\s+)?(?:(?:temp|temporary|unlogged)\s+)?table\s+(?:if\s+not\s+exists\s+)?` + IDENT, "gi");
  return [...text.matchAll(re)].map((m) => norm(m[1]));
}
export function rlsTables(text: string): Set<string> {
  const re = new RegExp(String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?` + IDENT + String.raw`\s+enable\s+row\s+level\s+security`, "gi");
  return new Set([...text.matchAll(re)].map((m) => norm(m[1])));
}
export function riskyGrants(text: string): string[] {
  const re = /grant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+?)\s*(?:;|$)/gi;
  return [...text.matchAll(re)]
    .filter(([, priv, obj, to]) => {
      const all = /\ball\b/i.test(priv);
      if (all && /\b(anon|public|authenticated)\b/i.test(to)) return true; // GRANT ALL on anything (incl. schema)
      if (/^\s*(function|schema)\b/i.test(obj)) return false; // EXECUTE/USAGE grants are policy-gated
      return /\b(anon|public)\b/i.test(to);
    })
    .map((m) => m[0].replace(/\s+/g, " ").trim());
}

describe("supabase migrations: RLS + grants (static)", () => {
  it("finds migrations", () => expect(files.length).toBeGreaterThan(0));

  it("every created table has RLS enabled", () => {
    const rls = rlsTables(sql);
    const missing = createdTables(sql).filter((t) => !rls.has(t));
    expect(missing).toEqual([]);
  });

  it("no table grants to anon/public and no ALL to authenticated", () => {
    expect(riskyGrants(sql)).toEqual([]);
  });

  it("parsers catch violations (self-test)", () => {
    const bad = "create table public.x (id int); grant select on table public.x to anon; grant all on y to authenticated;";
    expect(createdTables(bad)).toEqual(["x"]);
    expect(rlsTables(bad).has("x")).toBe(false);
    expect(riskyGrants(bad)).toHaveLength(2);
    expect(riskyGrants("grant execute on function private.f(uuid) to authenticated;")).toEqual([]);
    expect(riskyGrants(strip("grant all on schema public to authenticated;"))).toHaveLength(1);
    expect(riskyGrants(strip("select '/*'; grant select on table public.x to anon; select '*/';"))).toHaveLength(1);
    expect(strip("select $f$ -- not a comment $f$; -- real")).not.toContain("real");
    // nested comments, dollar tags with digits, $ inside identifiers, dollar bodies and quoted identifiers
    const hide = (x: string) => rlsTables(strip(x)).has("leaky") || !createdTables(strip(x)).includes("leaky");
    expect(createdTables(strip("/* outer /* inner */ ' */ CREATE TABLE public.leaky (id int);"))).toEqual(["leaky"]);
    expect(hide("SELECT $v1$-- text$v1$; CREATE TABLE public.leaky (id int);")).toBe(false);
    expect(createdTables(strip("select foo$tag$ ; CREATE TABLE public.leaky (id int); select '$tag$';"))).toEqual(["leaky"]);
    expect(hide("CREATE TABLE public.leaky (id int); SELECT $$alter table public.leaky enable row level security$$;")).toBe(false);
    expect(hide('CREATE TABLE public.leaky ("alter table public.leaky enable row level security" integer);')).toBe(false);
    expect(createdTables(strip('create table public."My Table" (id int);'))).toEqual(["My Table"]);
    expect(createdTables('create unlogged table public.u (id int); create table public."Accounts" (id int);')).toEqual(["u", "Accounts"]);
    expect(rlsTables("alter table public.accounts enable row level security;").has("Accounts")).toBe(false);
    expect(norm('PUBLIC.Foo')).toBe("foo");
    // string literals are data, not statements
    const leaky = maskStrings(strip("create table public.leaky (id int); comment on table public.leaky is 'alter table public.leaky enable row level security;';"));
    expect(rlsTables(leaky).has("leaky")).toBe(false);
    // a final statement without a trailing semicolon is still checked
    expect(riskyGrants("grant select on table public.projects to anon")).toHaveLength(1);
    expect(riskyGrants("grant all on table public.projects to authenticated")).toHaveLength(1);
    // E'' escapes, apostrophes inside quoted identifiers, dotted quoted identifiers
    expect(hide("CREATE TABLE public.leaky (id int); SELECT E'\\' ; ALTER TABLE public.leaky ENABLE ROW LEVEL SECURITY;';")).toBe(false);
    expect(createdTables(maskStrings(strip('alter table a add column "O\'Neil" int; CREATE TABLE public.leaky (id int); alter table b add column "O\'Brian" int;')))).toEqual(["leaky"]);
    expect(norm('public."secret.table"')).not.toBe(norm("secret.table"));
  });
});
