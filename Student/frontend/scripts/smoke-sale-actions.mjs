/**
 * Smoke action: chức năng mutate chính của Sale / BD
 *
 * Usage:
 *   cd frontend && npm run smoke:sale-actions
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = process.env.SALE_EMAIL || "sale@xalo.edu.vn";
const PASS = process.env.SALE_PASS || "Sale@123!";

const findings = [];
function log(area, fn, kq, ct) {
  findings.push({ area, fn, kq, ct });
  console.log(`[${kq}] ${area} · ${fn} — ${ct}`);
}

async function loginApi() {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("API login failed");
  return j;
}

async function createAuthedContext(browser, auth) {
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
  return context;
}

async function dismiss(page) {
  await page.keyboard.press("Escape").catch(() => {});
  const btn = page.getByRole("button", { name: /bỏ qua|đóng|đã hiểu|hủy/i });
  if (await btn.first().isVisible({ timeout: 300 }).catch(() => false)) {
    await btn.first().click({ force: true }).catch(() => {});
  }
}

async function goto(page, path) {
  await page.goto(`${FE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismiss(page);
  await page
    .waitForFunction((n) => (document.body?.innerText || "").trim().length >= n, 30, {
      timeout: 20000,
    })
    .catch(() => {});
}

async function waitApi(page, pattern, action, timeout = 10000) {
  const p = page
    .waitForResponse(
      (r) =>
        pattern.test(r.url()) &&
        ["PATCH", "POST", "PUT", "DELETE"].includes(r.request().method()),
      { timeout },
    )
    .catch(() => null);
  await action();
  return await p;
}

async function clickFirst(page, nameRe) {
  const btn = page.getByRole("button", { name: nameRe }).first();
  if (!(await btn.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  if (await btn.isDisabled().catch(() => false)) return false;
  await btn.click({ force: true, timeout: 5000 }).catch(() => {});
  return true;
}

async function safeRun(area, fn, page) {
  try {
    await fn(page);
  } catch (e) {
    log(area, "Runner error", "Fail", String(e.message || e).slice(0, 220));
  }
}

async function testBcb(page) {
  await goto(page, "/sale/bcb");
  const text = await page.locator("body").innerText();
  log(
    "BCB",
    "Load bảng chẩn bệnh",
    /BCB|chẩn|Listening|Reading/i.test(text) ? "Pass" : "Fail",
    page.url(),
  );

  const add = await clickFirst(page, /Thêm|Tạo|Chọn học viên|\+/i);
  if (add) {
    await page.waitForTimeout(500);
    log("BCB", "Mở form thêm/chọn HV", "Pass", "modal/form");
    await dismiss(page);
  } else {
    // try select student row
    const row = page.locator("table tbody tr, [role='row']").first();
    if (await row.isVisible({ timeout: 1500 }).catch(() => false)) {
      await row.click({ force: true }).catch(() => {});
      log("BCB", "Chọn row HV", "Pass", "clicked");
    } else {
      log("BCB", "Form/row HV", "Note", "không thấy CTA");
    }
  }

  const save = page.getByRole("button", { name: /Lưu|Cập nhật BCB|Save/i }).first();
  if (await save.isVisible({ timeout: 1500 }).catch(() => false)) {
    log("BCB", "CTA Lưu BCB hiện", "Pass", await save.innerText().catch(() => "Lưu"));
  } else {
    log("BCB", "CTA Lưu BCB", "Note", "không thấy (cần chọn HV trước)");
  }
}

async function testBcbEntrance(page) {
  await goto(page, "/sale/bcb-entrance");
  log(
    "BCB Entrance",
    "Load trang",
    /BCB|Entrance|chẩn|Listening|Reading|booking/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );

  const pick = await clickFirst(page, /Chọn|Mở|Xem|Booking|Thêm/i);
  log("BCB Entrance", "CTA chọn booking", pick ? "Pass" : "Note", pick ? "clicked" : "no CTA");
  await dismiss(page);
}

async function testSpeaking(page) {
  await goto(page, "/sale/test-speaking");
  log(
    "Speaking Entrance",
    "Load danh sách",
    /Speaking|Entrance|đăng ký|ca|lịch/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );

  const add = await clickFirst(page, /Thêm|Đặt lịch|Tạo ca|Đăng ký|\+/i);
  if (add) {
    await page.waitForTimeout(600);
    const modal = await page.getByText(/học viên|ngày|giờ|grader|Speaking|xác nhận|SĐT|tên/i).count();
    log("Speaking Entrance", "Mở form đặt lịch", modal > 0 ? "Pass" : "Note", "modal");
    await dismiss(page);
  } else {
    log("Speaking Entrance", "Form đặt lịch", "Note", "không thấy CTA");
  }

  const cancel = page.getByRole("button", { name: /Hủy ca|Hủy/i }).first();
  if (await cancel.isVisible({ timeout: 1500 }).catch(() => false)) {
    log("Speaking Entrance", "CTA hủy ca hiện", "Pass", "visible (không click destructive)");
  } else {
    log("Speaking Entrance", "CTA hủy ca", "Note", "không có ca pending");
  }
}

async function testWriting(page) {
  await goto(page, "/sale/cham-writing");
  log(
    "Writing Entrance",
    "Load trang",
    /Writing|Entrance|nộp|link/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );

  const add = await clickFirst(page, /Nộp bài|Thêm|\+ Nộp|Đăng ký/i);
  if (add) {
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder*="http" i], input[placeholder*="link" i], input[type="url"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      const link = `https://docs.google.com/document/d/sale-w-smoke-${Date.now()}`;
      await input.fill(link);
      const pr = await waitApi(page, /writing|entrance/i, async () => {
        await page.getByRole("button", { name: /Gửi|Nộp|Lưu|Xác nhận/i }).first().click().catch(() => {});
      });
      log(
        "Writing Entrance",
        "Nộp link Writing",
        pr?.ok() ? "Pass" : "Note",
        pr ? `HTTP ${pr.status()}` : "submitted UI",
      );
    } else {
      log("Writing Entrance", "Form nộp Writing", "Pass", "modal opened, no link input yet");
    }
    await dismiss(page);
  } else {
    const input = page.locator('input[placeholder*="http" i], input[placeholder*="link" i]').first();
    if (await input.isVisible({ timeout: 1500 }).catch(() => false)) {
      await input.fill(`https://docs.google.com/document/d/sale-w-${Date.now()}`);
      log("Writing Entrance", "Input link hiện", "Pass", "filled");
    } else {
      log("Writing Entrance", "Form nộp", "Note", "không thấy CTA/input");
    }
  }
}

async function testLichRanh(page) {
  await goto(page, "/sale/lich-ranh");
  log(
    "Lịch rảnh",
    "Load lịch",
    /lịch rảnh|ca|rảnh|Speaking|Meet|tuần/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );

  const cell = page.locator("table button, [class*='grid'] button").nth(2);
  if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cell.click({ force: true }).catch(() => {});
    log("Lịch rảnh", "Click ô lịch", "Note", "clicked (xem ca rảnh grader)");
  } else {
    log("Lịch rảnh", "Ô lịch", "Note", "không click được");
  }
}

async function testGuestDiagnosisLink(page) {
  // Sale often links to guest-diagnosis for leads — verify can open public page while logged in as Sale
  await page.goto(`${FE}/guest-diagnosis`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(800);
  const ok = /chẩn|diagnosis|tư vấn|IELTS|guest/i.test(await page.locator("body").innerText());
  log("Guest diagnosis", "Mở trang public (Sale session)", ok ? "Pass" : "Note", page.url());
}

async function testLogout(page) {
  await goto(page, "/sale/bcb");
  const logout = page.getByRole("button", { name: /Đăng xuất/i }).first();
  if (await logout.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logout.click({ force: true });
  } else {
    await page.locator("aside button").last().click().catch(() => {});
  }
  await page.waitForURL((u) => u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  log("Shell", "Đăng xuất", page.url().includes("/login") ? "Pass" : "Fail", page.url());
}

async function main() {
  const auth = await loginApi();
  log("Auth", "API login", "Pass", `${auth.user?.role} ${auth.user?.name || ""}`);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await createAuthedContext(browser, auth);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await safeRun("BCB", testBcb, page);
  await safeRun("BCB Entrance", testBcbEntrance, page);
  await safeRun("Speaking", testSpeaking, page);
  await safeRun("Writing", testWriting, page);
  await safeRun("Lịch rảnh", testLichRanh, page);
  await safeRun("Guest", testGuestDiagnosisLink, page);
  await safeRun("Shell", testLogout, page);

  await context.close();
  await browser.close();

  const bad = findings.filter((f) => f.kq === "Fail");
  const out = {
    total: findings.length,
    fail: bad.length,
    pass: findings.filter((f) => f.kq === "Pass").length,
    note: findings.filter((f) => f.kq === "Note").length,
    findings,
  };
  fs.writeFileSync("/tmp/sale-actions-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/sale-actions-smoke.json",
    JSON.stringify(out, null, 2),
  );
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(out, null, 2));
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
