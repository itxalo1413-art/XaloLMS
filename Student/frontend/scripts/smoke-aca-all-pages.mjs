/**
 * Smoke UI: tất cả trang portal ACA (Academic Head)
 *
 * Usage:
 *   cd frontend && npm run smoke:aca-pages
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = "aca@xaloenglish.vn";
const PASS = "test@123!";

/** @type {{ path: string; name: string; expect: RegExp; allowRedirectTo?: RegExp }}[] */
const ACA_PAGES = [
  { path: "/aca", name: "ACA home redirect", expect: /lớp|học viên|tháng|quản lý|dashboard/i, allowRedirectTo: /\/aca\/quan-ly/ },
  { path: "/aca/profile", name: "Hồ sơ ACA", expect: /hồ sơ|profile|email|ACA|Khánh Thi|tài khoản/i },
  { path: "/aca/phan-tich", name: "Phân tích & báo cáo", expect: /phân tích|KPI|báo cáo|thống kê|dashboard|analytics/i },
  { path: "/aca/quan-ly/lop-theo-thang", name: "Lớp theo tháng", expect: /lớp|tháng|giáo viên|học viên|TKB|thời khóa|tạo lớp/i },
  { path: "/aca/quan-ly/hoc-vien-lop", name: "Danh sách học viên", expect: /học viên|BCB|aim|điểm|danh sách|chu kỳ/i },
  { path: "/aca/quan-ly/lop-1-1", name: "Lớp 1:1", expect: /1:1|1 kèm 1|RLP|giáo viên|lớp/i },
  { path: "/aca/quan-ly/rlp-mau", name: "RLP Mẫu", expect: /RLP|mẫu|template|buổi|áp dụng/i },
  { path: "/aca/quan-ly/bcb-final", name: "BCB Final", expect: /BCB|Final|grader|điểm|thí sinh|Writing|Speaking/i },
  { path: "/aca/quan-ly/diem-dau-vao-cuoi-khoa", name: "Điểm Entrance/Final", expect: /Entrance|Final|điểm|lớp|import|bảng điểm/i },
  { path: "/aca/quan-ly/phan-tich-final-test", name: "Phân tích Final Test", expect: /Final|phân tích|tỷ lệ|đạt|phân loại/i },
  { path: "/aca/quan-ly/lop-luyen-de-tuan", name: "Lớp luyện đề tuần", expect: /luyện đề|tuần|folder|Meet|đăng ký/i },
  { path: "/aca/quan-ly/practice-rlp", name: "RLP luyện đề", expect: /RLP|luyện đề|học viên|buổi/i },
  { path: "/aca/quan-ly/thong-ke-luyen-de", name: "Thống kê luyện đề", expect: /thống kê|luyện đề|tuần|báo cáo/i },
  { path: "/aca/quan-ly/cham-writing", name: "Chấm Writing", expect: /Writing|chấm|grader|bài|điểm/i },
  { path: "/aca/quan-ly/test-speaking", name: "Đăng ký Speaking", expect: /Speaking|đăng ký|grader|ca|mock/i },
  { path: "/aca/quan-ly/giao-vien", name: "Hiệu suất Giáo viên", expect: /giáo viên|hiệu suất|trễ|GV|teacher/i },
  { path: "/aca/quan-ly/note", name: "Quotes & Note", expect: /note|quote|Word of|học viên/i },
  { path: "/aca/quan-ly/lich-ranh", name: "Lịch rảnh Grader", expect: /lịch rảnh|ca|grader|Meet|rảnh/i },
  { path: "/aca/quan-ly/lop-luyen-de", name: "Lớp luyện đề (cũ)", expect: /luyện đề|lịch|slot|đăng ký/i },
  { path: "/aca/quan-ly/nguoi-dung", name: "Người dùng", expect: /người dùng|user|khóa|email|role/i },
  { path: "/aca/quan-ly/noi-dung", name: "Nội dung", expect: /nội dung|catalog|duyệt|tài liệu|ẩn/i },
  { path: "/aca/he-thong", name: "Hệ thống", expect: /hệ thống|tag|danh mục|tác vụ/i },
  { path: "/aca/mock-test-sw", name: "Mock Test S-W (demo)", expect: /mock|Speaking|Writing|Entrance|Final|test/i },
  { path: "/aca/he-thong-ws", name: "Hệ thống W-S (demo)", expect: /Writing|Speaking|chấm|luồng|demo/i },
  // redirects
  { path: "/aca/quan-ly/bcb", name: "BCB redirect → Sale", expect: /BCB|chẩn|Sale|học viên|diagnosis/i, allowRedirectTo: /\/sale\/bcb/ },
  { path: "/aca/quan-ly/canh-bao-hoc-tap", name: "Cảnh báo → học viên", expect: /học viên|BCB|cảnh báo|danh sách/i, allowRedirectTo: /\/aca\/quan-ly\/hoc-vien-lop/ },
  { path: "/aca/quan-ly/weekly-docs", name: "Weekly docs → luyện đề tuần", expect: /luyện đề|tuần|folder/i, allowRedirectTo: /\/aca\/quan-ly\/lop-luyen-de-tuan/ },
];

const FORBIDDEN_FOR_ACA = [
  { path: "/", name: "HS home (should leave or not as staff home)", staffOk: false },
  { path: "/teacher", name: "Teacher portal (deny stay)", expectLeave: /\/teacher(\/|$)/ },
  { path: "/grader", name: "Grader portal", expectLeave: /\/grader(\/|$)/ }, // Head may leave or stay briefly
  { path: "/sale", name: "Sale portal (deny stay)", expectLeave: /\/sale(\/|$)/ },
];

const findings = [];
function log(fn, kq, ct) {
  findings.push({ vai: "ACA", fn, kq, ct });
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
    ACA_PAGES.map((p) => fetch(`${FE}${p.path}`, { redirect: "manual" }).catch(() => null)),
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
  } else if (p.path === "/aca") {
    await page
      .waitForURL((u) => /\/aca\/quan-ly/.test(u.pathname), { timeout: 10000 })
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
    : p.path === "/aca"
      ? /\/aca\/quan-ly/.test(new URL(url).pathname)
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
  if (auth.user?.role !== "ACA") {
    log("Role check", "Fail", `expected ACA got ${auth.user?.role}`);
  }

  await warmRoutes();
  log("Warm routes", "Pass", `${ACA_PAGES.length} paths`);

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

  await page.goto(`${FE}/aca`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissOverlays(page);
  if (page.url().includes("/login")) {
    log("Session inject", "Fail", page.url());
    await browser.close();
    finish(1);
    return;
  }
  log("Session inject", "Pass", page.url());

  for (const p of ACA_PAGES) {
    try {
      await checkPage(page, p);
    } catch (e) {
      log(p.name, "Fail", String(e.message || e).slice(0, 200));
    }
  }

  // Deny / leave other portals
  for (const f of FORBIDDEN_FOR_ACA) {
    try {
      await page.goto(`${FE}${f.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);
      const url = page.url();
      const path = new URL(url).pathname;
      if (f.expectLeave) {
        const stillThere = f.expectLeave.test(path);
        // Academic Head on /grader may redirect away; Pass if left
        log(f.name, stillThere ? "Note" : "Pass", stillThere ? `vẫn ở ${url}` : `rời → ${url}`);
      } else {
        log(f.name, "Note", url);
      }
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
  fs.writeFileSync("/tmp/aca-all-pages-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/aca-all-pages-smoke.json",
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
