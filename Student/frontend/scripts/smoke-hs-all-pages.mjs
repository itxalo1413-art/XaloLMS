/**
 * Smoke UI: tất cả trang portal Học viên (HS)
 *
 * Usage (FE webpack recommended):
 *   cd frontend && npm run smoke:hs-pages
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = "nguyenduong939705@gmail.com";
const PASS = "Student@123!";

/** @type {{ path: string; name: string; expect: RegExp }}[] */
const STUDENT_PAGES = [
  { path: "/", name: "Thông tin học viên", expect: /thông tin học viên|hồ sơ|RLP|lớp|aim|mục tiêu|điểm|profile/i },
  { path: "/student", name: "Alias /student → home", expect: /thông tin học viên|hồ sơ|RLP|lớp|aim|mục tiêu|điểm|profile/i },
  { path: "/skill", name: "Thông tin khóa học (/skill)", expect: /khóa học|course|lịch|zoom|giáo viên|instructor|thông tin khóa/i },
  { path: "/course-info", name: "Thông tin khóa học (/course-info)", expect: /khóa học|course|lịch|zoom|giáo viên|instructor|thông tin khóa/i },
  { path: "/ho-tro-tu-hoc", name: "Hỗ trợ tự học", expect: /Speaking|Writing|luyện đề|Hỗ trợ tự học/i },
  { path: "/tai-lieu-them", name: "Kho tài liệu", expect: /tài liệu|document|catalog|sách|Grammar|Cambridge|kho/i },
  { path: "/luu-tru-test", name: "Lưu trữ bài test", expect: /lưu trữ|final|entrance|mock|test|bài thi|kết quả/i },
];

const FORBIDDEN_FOR_HS = [
  { path: "/aca", name: "ACA home (deny)", expectLeave: /\/aca(\/|$)/ },
  { path: "/teacher", name: "Teacher home (deny)", expectLeave: /\/teacher(\/|$)/ },
  { path: "/grader", name: "Grader home (deny)", expectLeave: /\/grader(\/|$)/ },
  { path: "/sale", name: "Sale home (deny)", expectLeave: /\/sale(\/|$)/ },
];

const findings = [];
function log(fn, kq, ct) {
  findings.push({ vai: "HS", fn, kq, ct });
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
  const paths = [
    ...STUDENT_PAGES.map((p) => p.path),
    "/tai-lieu-them/xem/demo",
    "/guest-diagnosis",
    ...FORBIDDEN_FOR_HS.map((f) => f.path),
  ];
  await Promise.all(
    paths.map((p) =>
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
  if (await dismiss.first().isVisible({ timeout: 500 }).catch(() => false)) {
    await dismiss.first().click({ force: true }).catch(() => {});
  }
}

async function waitForPageText(page, minLen = 25) {
  await page
    .waitForFunction(
      (n) => (document.body?.innerText || "").trim().length >= n,
      minLen,
      { timeout: 20000 },
    )
    .catch(() => {});
}

async function checkPage(page, p) {
  const shot = `/tmp/hs-page${p.path.replace(/\W+/g, "_") || "_home"}.png`;
  try {
    await page.goto(`${FE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (e) {
    if (!String(e.message || e).includes("ERR_ABORTED")) throw e;
  }
  await dismissOverlays(page);
  await waitForPageText(page);
  const url = page.url();
  const text = await bodyText(page);
  const bouncedLogin = /\/login/.test(new URL(url).pathname);
  const matched = p.expect.test(text);
  await page.screenshot({ path: shot, timeout: 5000 }).catch(() => {});
  if (bouncedLogin) {
    log(p.name, "Fail", `redirect login | ${url}`);
  } else if (matched) {
    log(p.name, "Pass", url);
  } else {
    log(p.name, "Fail", `${url} | no expect match | text=${JSON.stringify(text.slice(0, 180))}`);
  }
}

async function main() {
  const auth = await loginApi();
  log("API login", "Pass", `${auth.user?.role} ${auth.user?.name || ""}`);

  await warmRoutes();
  log("Warm routes (curl)", "Pass", `${STUDENT_PAGES.length + 6} paths`);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext();
  const feHost = new URL(FE).hostname;
  await context.addCookies([
    {
      name: "xalo.auth",
      value: "1",
      domain: feHost,
      path: "/",
      sameSite: "Lax",
    },
  ]);
  await context.addInitScript(
    ({ token, user }) => {
      try {
        localStorage.setItem("xalo.auth.token", token);
        localStorage.setItem("xalo.auth.user", JSON.stringify(user));
        localStorage.setItem("xalo.studentOnboardingSeen", "true");
        document.cookie = "xalo.auth=1; Path=/; SameSite=Lax";
      } catch {}
    },
    { token: auth.access_token, user: auth.user },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));

  await page.goto(`${FE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissOverlays(page);
  if (page.url().includes("/login")) {
    log("Session inject", "Fail", page.url());
    await browser.close();
    finish(1);
    return;
  }
  log("Session inject", "Pass", page.url());

  let docId = "demo";
  try {
    await page.goto(`${FE}/tai-lieu-them`, { waitUntil: "domcontentloaded", timeout: 45000 });
    const href = await page
      .locator('a[href*="/tai-lieu-them/xem/"]')
      .first()
      .getAttribute("href", { timeout: 5000 })
      .catch(() => null);
    if (href) {
      const m = href.match(/\/tai-lieu-them\/xem\/([^/?#]+)/);
      if (m?.[1]) docId = decodeURIComponent(m[1]);
    }
  } catch {
    // keep demo
  }

  const pages = [
    ...STUDENT_PAGES,
    {
      path: `/tai-lieu-them/xem/${encodeURIComponent(docId)}`,
      name: "Chi tiết tài liệu",
      expect: /tài liệu|document|quay lại|không tìm thấy|xem|nội dung|pdf|link|mô tả|kho/i,
    },
    {
      path: "/guest-diagnosis",
      name: "Guest diagnosis (public)",
      expect: /chẩn|diagnosis|BCB|lead|đăng|guest|form|họ tên|sđt|email/i,
    },
  ];

  for (const p of pages) {
    try {
      await checkPage(page, p);
    } catch (e) {
      log(p.name, "Fail", String(e.message || e).slice(0, 200));
    }
  }

  const staffPathRe = /^\/(aca|teacher|grader|sale)(\/|$)/;
  for (const f of FORBIDDEN_FOR_HS) {
    try {
      await page.goto(`${FE}${f.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3500);
      const url = page.url();
      const pathname = new URL(url).pathname;
      const onStaff = staffPathRe.test(pathname);
      log(
        f.name,
        onStaff ? "Fail" : "Pass",
        onStaff ? `HS vẫn ở portal staff: ${url}` : `đã rời staff → ${url}`,
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
  const bad = findings.filter((x) => x.kq === "Fail");
  const out = { total: findings.length, fail: bad.length, findings };
  fs.writeFileSync("/tmp/hs-all-pages-smoke.json", JSON.stringify(out, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(out, null, 2));
  process.exit(bad.length ? 1 : 0);
}

function finish(code) {
  const bad = findings.filter((x) => x.kq === "Fail");
  const out = { total: findings.length, fail: bad.length, findings };
  fs.writeFileSync("/tmp/hs-all-pages-smoke.json", JSON.stringify(out, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(out, null, 2));
  process.exit(code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
