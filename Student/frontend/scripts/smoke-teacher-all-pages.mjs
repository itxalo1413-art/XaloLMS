/**
 * Smoke UI: tất cả trang portal Giáo viên (GV / Teacher)
 *
 * Usage:
 *   cd frontend && npm run smoke:teacher-pages
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = process.env.TEACHER_EMAIL || "quynhchau.nghiem@xalo.edu.vn";
const PASS = process.env.TEACHER_PASS || "Teacher@123!";

/** @type {{ path: string; name: string; expect: RegExp; allowRedirectTo?: RegExp }}[] */
const TEACHER_PAGES = [
  { path: "/teacher", name: "Danh sách lớp", expect: /lớp|học viên|danh sách|RLP|teacher|giáo viên/i },
  { path: "/teacher/rlp", name: "RLP", expect: /RLP|buổi|học viên|chuyên cần|bài tập|attendance/i },
  { path: "/teacher/practice-rlp", name: "RLP luyện đề", expect: /RLP|luyện đề|học viên|buổi/i },
  { path: "/teacher/cham-writing", name: "Chấm Writing", expect: /Writing|chấm|bài|điểm|grader/i },
  { path: "/teacher/final-test", name: "Final Test", expect: /Final|test|điểm|Speaking|Writing|Entrance/i },
  { path: "/teacher/lich", name: "Lịch", expect: /lịch|tuần|tháng|lớp|ca|schedule/i },
  { path: "/teacher/teaching-materials", name: "Teaching Materials", expect: /material|tài liệu|teaching|folder|link|nội dung/i },
  { path: "/teacher/performance", name: "Performance", expect: /performance|hiệu suất|tháng|thống kê|giờ|lớp/i },
  { path: "/teacher/profile", name: "Hồ sơ GV", expect: /hồ sơ|profile|email|tên|giáo viên|tài khoản/i },
  { path: "/teacher/bcb", name: "BCB", expect: /BCB|chẩn|Listening|Reading|Writing|Speaking|điểm/i },
  { path: "/teacher/mock-test", name: "Mock Test Speaking", expect: /mock|Speaking|test|ca|điểm|đăng ký/i },
  { path: "/teacher/khoa-hoc", name: "Khóa học", expect: /khóa học|lớp|course|học viên|giáo viên/i },
  { path: "/teacher/canh-bao-hoc-tap", name: "Cảnh báo học tập", expect: /cảnh báo|học tập|vắng|bài tập|học viên/i },
];

const FORBIDDEN = [
  { path: "/aca", name: "ACA portal (deny stay)", expectLeave: /^\/aca(\/|$)/ },
  { path: "/grader", name: "Grader portal (deny stay)", expectLeave: /\/grader(\/|$)/ },
  { path: "/sale", name: "Sale portal (deny stay)", expectLeave: /\/sale(\/|$)/ },
];

const findings = [];
function log(fn, kq, ct) {
  findings.push({ vai: "GV", fn, kq, ct });
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
    [...TEACHER_PAGES.map((p) => p.path), "/teacher/hoc-sinh/demo", ...FORBIDDEN.map((f) => f.path)].map(
      (p) => fetch(`${FE}${p}`, { redirect: "manual" }).catch(() => null),
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
  }
  await page
    .waitForFunction(
      () => !/đang chuyển hướng|đang tải/i.test((document.body?.innerText || "").slice(0, 80)),
      { timeout: 8000 },
    )
    .catch(() => {});
  await waitForPageText(page);
  await page.waitForTimeout(400);

  const url = page.url();
  const text = await bodyText(page);
  const bouncedLogin = /\/login/.test(new URL(url).pathname);
  const matched = p.expect.test(text);

  if (bouncedLogin) {
    log(p.name, "Fail", `redirect login | ${url}`);
  } else if (matched) {
    log(p.name, "Pass", url);
  } else {
    log(p.name, "Fail", `${url} | no expect | text=${JSON.stringify(text.slice(0, 160))}`);
  }
}

async function main() {
  const auth = await loginApi();
  log("API login", "Pass", `${auth.user?.role} ${auth.user?.name || ""}`);
  if (auth.user?.role !== "GV") {
    log("Role check", "Fail", `expected GV got ${auth.user?.role}`);
  }

  await warmRoutes();
  log("Warm routes", "Pass", `${TEACHER_PAGES.length} paths`);

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

  await page.goto(`${FE}/teacher`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissOverlays(page);
  if (page.url().includes("/login")) {
    log("Session inject", "Fail", page.url());
    await browser.close();
    finish(1);
    return;
  }
  log("Session inject", "Pass", page.url());

  // Prefetch a student id for /teacher/hoc-sinh/[id]
  let studentId = "demo";
  try {
    await page.waitForTimeout(800);
    const href = await page
      .locator('a[href*="/teacher/hoc-sinh/"]')
      .first()
      .getAttribute("href", { timeout: 5000 })
      .catch(() => null);
    if (href) {
      const m = href.match(/\/teacher\/hoc-sinh\/([^/?#]+)/);
      if (m?.[1]) studentId = decodeURIComponent(m[1]);
    }
  } catch {
    // keep demo
  }

  const pages = [
    ...TEACHER_PAGES,
    {
      path: `/teacher/hoc-sinh/${encodeURIComponent(studentId)}`,
      name: "Chi tiết học sinh",
      expect: /học|RLP|điểm|BCB|profile|không tìm|chi tiết|Writing|Speaking/i,
    },
  ];

  for (const p of pages) {
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
  fs.writeFileSync("/tmp/teacher-all-pages-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/teacher-all-pages-smoke.json",
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
