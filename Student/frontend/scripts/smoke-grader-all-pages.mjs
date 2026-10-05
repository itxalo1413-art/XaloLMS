/**
 * Smoke UI: tất cả trang portal Grader
 *
 * Usage:
 *   cd frontend && npm run smoke:grader-pages
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = process.env.GRADER_EMAIL || "aca_1@gmail.com";
const PASS = process.env.GRADER_PASS || "test@123!";

/** @type {{ path: string; name: string; expect: RegExp; allowRedirectTo?: RegExp }}[] */
const GRADER_PAGES = [
  {
    path: "/grader",
    name: "Grader home redirect",
    expect: /Writing|chấm|bài|grader/i,
    allowRedirectTo: /\/grader\/cham-writing/,
  },
  {
    path: "/grader/cham-writing",
    name: "Chấm Writing",
    expect: /Writing|chấm|bài|grader|điểm|pending|graded/i,
  },
  {
    path: "/grader/test-speaking",
    name: "Test Speaking",
    expect: /Speaking|đăng ký|ca|mock|grader|điểm/i,
  },
  {
    path: "/grader/lich-ranh",
    name: "Lịch rảnh",
    expect: /lịch rảnh|ca|rảnh|Meet|tuần|grader/i,
  },
  {
    path: "/grader/profile",
    name: "Hồ sơ Grader",
    expect: /hồ sơ|profile|email|grader|tài khoản|tên/i,
  },
  // Legacy ACA URLs should map to grader portal
  {
    path: "/aca/quan-ly/cham-writing",
    name: "Legacy ACA Writing → Grader",
    expect: /Writing|chấm|bài/i,
    allowRedirectTo: /\/grader/,
  },
  {
    path: "/aca/quan-ly/test-speaking",
    name: "Legacy ACA Speaking → Grader",
    expect: /Speaking|đăng ký|ca/i,
    allowRedirectTo: /\/grader/,
  },
  {
    path: "/aca/quan-ly/lich-ranh",
    name: "Legacy ACA lịch rảnh → Grader",
    expect: /lịch rảnh|ca|rảnh|Meet/i,
    allowRedirectTo: /\/grader/,
  },
];

const FORBIDDEN = [
  { path: "/aca", name: "ACA home (should leave to grader)", expectLeave: /^\/aca(\/|$)/ },
  { path: "/teacher", name: "Teacher portal (deny stay)", expectLeave: /\/teacher(\/|$)/ },
  { path: "/sale", name: "Sale portal (deny stay)", expectLeave: /\/sale(\/|$)/ },
];

const findings = [];
function log(fn, kq, ct) {
  findings.push({ vai: "GRADER", fn, kq, ct });
  console.log(`[${kq}] ${fn} — ${ct}`);
}

async function loginApi() {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`API login failed: ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

async function warmRoutes() {
  await Promise.all(
    [...GRADER_PAGES.map((p) => p.path), ...FORBIDDEN.map((f) => f.path)].map((p) =>
      fetch(`${FE}${p}`, { redirect: "manual" }).catch(() => null),
    ),
  );
}

async function bodyText(page) {
  return page.evaluate(() => (document.body?.innerText || "").slice(0, 12000));
}

async function dismissOverlays(page) {
  await page.keyboard.press("Escape").catch(() => {});
  const dismiss = page.getByRole("button", {
    name: /bỏ qua|đóng|đã hiểu|tiếp tục|xong|skip|bắt đầu/i,
  });
  if (await dismiss.first().isVisible({ timeout: 400 }).catch(() => false)) {
    await dismiss.first().click({ force: true }).catch(() => {});
  }
}

async function waitForPageText(page, minLen = 20) {
  await page
    .waitForFunction(
      (n) => (document.body?.innerText || "").trim().length >= n,
      minLen,
      { timeout: 20000 },
    )
    .catch(() => {});
}

async function checkPage(page, p) {
  try {
    await page.goto(`${FE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (e) {
    if (!String(e.message || e).includes("ERR_ABORTED")) throw e;
  }
  await dismissOverlays(page);
  if (p.allowRedirectTo) {
    await page
      .waitForURL((u) => p.allowRedirectTo.test(u.pathname), { timeout: 10000 })
      .catch(() => {});
  } else if (p.path === "/grader") {
    await page
      .waitForURL((u) => /\/grader\/cham-writing/.test(u.pathname), { timeout: 10000 })
      .catch(() => {});
  }
  await page
    .waitForFunction(
      () => !/đang chuyển hướng/i.test(document.body?.innerText || ""),
      { timeout: 8000 },
    )
    .catch(() => {});
  await waitForPageText(page);
  await page.waitForTimeout(400);

  const url = page.url();
  const text = await bodyText(page);
  const bouncedLogin = /\/login/.test(new URL(url).pathname);
  const matched = p.expect.test(text) && !/đang chuyển hướng/i.test(text);
  const redirectOk = p.allowRedirectTo
    ? p.allowRedirectTo.test(new URL(url).pathname)
    : p.path === "/grader"
      ? /\/grader\/cham-writing/.test(new URL(url).pathname)
      : false;

  if (bouncedLogin) {
    log(p.name, "Fail", `redirect login | ${url}`);
  } else if (matched || redirectOk) {
    log(p.name, "Pass", url);
  } else {
    log(p.name, "Fail", `${url} | no expect | text=${JSON.stringify(text.slice(0, 160))}`);
  }
}

async function main() {
  const auth = await loginApi();
  log("API login", "Pass", `${auth.user?.role} ${auth.user?.name || ""}`);
  if (auth.user?.role !== "GRADER" && auth.user?.role !== "ACA") {
    log("Role check", "Note", `got ${auth.user?.role} (legacy grader may be ACA then bounce)`);
  }

  await warmRoutes();
  log("Warm routes", "Pass", `${GRADER_PAGES.length} paths`);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const feHost = new URL(FE).hostname;
  await context.addCookies([
    { name: "xalo.auth", value: "1", domain: feHost, path: "/", sameSite: "Lax" },
  ]);
  await context.addInitScript(
    ({ token, user }) => {
      try {
        localStorage.setItem("xalo.auth.token", token);
        localStorage.setItem("xalo.auth.user", JSON.stringify(user));
        document.cookie = "xalo.auth=1; Path=/; SameSite=Lax";
      } catch {}
    },
    { token: auth.access_token, user: auth.user },
  );

  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));

  await page.goto(`${FE}/grader`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissOverlays(page);
  await page
    .waitForURL((u) => !u.pathname.includes("/login"), { timeout: 10000 })
    .catch(() => {});
  if (page.url().includes("/login")) {
    log("Session inject", "Fail", page.url());
    await browser.close();
    finish(1);
    return;
  }
  log("Session inject", "Pass", page.url());

  for (const p of GRADER_PAGES) {
    try {
      await checkPage(page, p);
    } catch (e) {
      log(p.name, "Fail", String(e.message || e).slice(0, 200));
    }
  }

  for (const f of FORBIDDEN) {
    try {
      await page.goto(`${FE}${f.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);
      const url = page.url();
      const path = new URL(url).pathname;
      const stillThere = f.expectLeave.test(path);
      log(
        f.name,
        stillThere ? "Fail" : "Pass",
        stillThere ? `vẫn ở ${url}` : `rời → ${url}`,
      );
    } catch (e) {
      log(f.name, "Fail", String(e.message || e).slice(0, 160));
    }
  }

  if (consoleErrors.length) {
    log("Console errors (sample)", "Note", consoleErrors.slice(0, 5).join(" | "));
  } else {
    log("Console errors", "Pass", "none");
  }

  await browser.close();
  finish(findings.some((x) => x.kq === "Fail") ? 1 : 0);
}

function finish(code) {
  const bad = findings.filter((x) => x.kq === "Fail");
  const out = {
    total: findings.length,
    fail: bad.length,
    pass: findings.filter((x) => x.kq === "Pass").length,
    note: findings.filter((x) => x.kq === "Note").length,
    findings,
  };
  fs.writeFileSync("/tmp/grader-all-pages-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/grader-all-pages-smoke.json",
    JSON.stringify(out, null, 2),
  );
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(out, null, 2));
  process.exit(code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
