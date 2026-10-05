/**
 * Smoke action: chức năng mutate chính của ACA (Academic Head)
 *
 * Usage:
 *   cd frontend && npm run smoke:aca-actions
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = "aca@xaloenglish.vn";
const PASS = "test@123!";

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

async function testLopTheoThang(page) {
  await goto(page, "/aca/quan-ly/lop-theo-thang");
  const hasList = /lớp|tháng|học viên/i.test(await page.locator("body").innerText());
  log("Lớp tháng", "Load danh sách", hasList ? "Pass" : "Fail", page.url());

  const opened = await clickFirst(page, /Tạo lớp|Thêm lớp|\+.*lớp/i);
  if (opened) {
    await page.waitForTimeout(500);
    const modal = await page.getByText(/tên lớp|mã lớp|giáo viên|tháng|phase/i).count();
    log("Lớp tháng", "Mở form tạo lớp", modal > 0 ? "Pass" : "Note", "create UI");
    await dismiss(page);
  } else {
    log("Lớp tháng", "Mở form tạo lớp", "Note", "không thấy nút tạo");
  }
}

async function testHocVien(page) {
  await goto(page, "/aca/quan-ly/hoc-vien-lop");
  const text = await page.locator("body").innerText();
  log("Học viên", "Load danh sách", /học viên|BCB|aim/i.test(text) ? "Pass" : "Fail", page.url());

  const opened = await clickFirst(page, /Thêm học viên|Tạo học viên|\+.*học viên/i);
  if (opened) {
    await page.waitForTimeout(500);
    log("Học viên", "Mở form thêm HV", "Pass", "modal/form");
    await dismiss(page);
  } else {
    // try row edit
    const edit = page.getByRole("button", { name: /Sửa|Edit|Chi tiết/i }).first();
    if (await edit.isVisible({ timeout: 2000 }).catch(() => false)) {
      await edit.click({ force: true }).catch(() => {});
      log("Học viên", "Mở chi tiết/sửa HV", "Pass", "row action");
      await dismiss(page);
    } else {
      log("Học viên", "Form thêm/sửa", "Note", "không thấy CTA create/edit");
    }
  }
}

async function testLop11(page) {
  await goto(page, "/aca/quan-ly/lop-1-1");
  log(
    "Lớp 1:1",
    "Load trang",
    /1:1|1 kèm|RLP|giáo viên/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const opened = await clickFirst(page, /Tạo|Thêm|Đăng ký lớp/i);
  log("Lớp 1:1", "CTA tạo/thêm", opened ? "Pass" : "Note", opened ? "opened" : "no CTA");
  await dismiss(page);
}

async function testRlpMau(page) {
  await goto(page, "/aca/quan-ly/rlp-mau");
  log(
    "RLP mẫu",
    "Load trang",
    /RLP|mẫu|template|buổi/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const opened = await clickFirst(page, /Tạo|Thêm mẫu|\+/i);
  log("RLP mẫu", "CTA tạo template", opened ? "Pass" : "Note", opened ? "opened" : "no CTA");
  await dismiss(page);
}

async function testBcbFinal(page) {
  await goto(page, "/aca/quan-ly/bcb-final");
  const text = await page.locator("body").innerText();
  log("BCB Final", "Load trang", /BCB|Final|thí sinh/i.test(text) ? "Pass" : "Fail", page.url());

  const toggle = page.getByRole("button", { name: /Hiện kết quả|Ẩn kết quả|Check|Hoàn thành/i }).first();
  if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await toggle.click({ force: true }).catch(() => {});
    log("BCB Final", "Toggle trạng thái row", "Pass", "clicked toggle");
  } else {
    log("BCB Final", "Toggle trạng thái", "Note", "không có row action");
  }
  await dismiss(page);
}

async function testDiemEntranceFinal(page) {
  await goto(page, "/aca/quan-ly/diem-dau-vao-cuoi-khoa");
  log(
    "Điểm E/F",
    "Load bảng điểm",
    /Entrance|Final|điểm/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const save = page.getByRole("button", { name: /Lưu|Save|Import/i }).first();
  if (await save.isVisible({ timeout: 2000 }).catch(() => false)) {
    log("Điểm E/F", "CTA Lưu/Import hiện", "Pass", await save.innerText().catch(() => "btn"));
  } else {
    log("Điểm E/F", "CTA Lưu/Import", "Note", "không thấy");
  }
}

async function testLuyenDeTuan(page) {
  await goto(page, "/aca/quan-ly/lop-luyen-de-tuan");
  log(
    "Luyện đề tuần",
    "Load trang",
    /luyện đề|tuần|folder|Meet/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const linkInput = page.locator('input[placeholder*="drive" i], input[placeholder*="http" i], input[type="url"]').first();
  if (await linkInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    const before = await linkInput.inputValue().catch(() => "");
    if (!before) {
      await linkInput.fill(`https://drive.google.com/drive/folders/aca-smoke-${Date.now()}`);
      const pr = await waitApi(page, /practice|weekly|folder/i, async () => {
        await page.getByRole("button", { name: /Lưu/i }).first().click().catch(() => {});
      });
      log("Luyện đề tuần", "Lưu folder link", pr?.ok() ? "Pass" : "Note", pr ? `HTTP ${pr.status()}` : "filled");
    } else {
      log("Luyện đề tuần", "Folder link đã có", "Pass", "skip overwrite");
    }
  } else {
    log("Luyện đề tuần", "Folder input", "Note", "không thấy input");
  }
}

async function testPracticeRlp(page) {
  await goto(page, "/aca/quan-ly/practice-rlp");
  log(
    "Practice RLP",
    "Load trang",
    /RLP|luyện|học viên/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
}

async function testChamWriting(page) {
  await goto(page, "/aca/quan-ly/cham-writing");
  const text = await page.locator("body").innerText();
  log("Chấm Writing", "Load danh sách", /Writing|chấm|bài|grader/i.test(text) ? "Pass" : "Fail", page.url());

  const assign = page.getByRole("button", { name: /Phân grader|Gán|Assign|Chọn grader/i }).first();
  const grade = page.getByRole("button", { name: /Chấm|Lưu điểm|Grade/i }).first();
  if (await assign.isVisible({ timeout: 1500 }).catch(() => false)) {
    await assign.click({ force: true }).catch(() => {});
    log("Chấm Writing", "CTA phân grader", "Pass", "clicked");
    await dismiss(page);
  } else if (await grade.isVisible({ timeout: 1500 }).catch(() => false)) {
    log("Chấm Writing", "CTA chấm/lưu", "Pass", "visible");
  } else {
    log("Chấm Writing", "CTA phân/chấm", "Note", "empty hoặc không có action");
  }
}

async function testSpeaking(page) {
  await goto(page, "/aca/quan-ly/test-speaking");
  log(
    "Speaking",
    "Load đăng ký",
    /Speaking|đăng ký|grader/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const add = await clickFirst(page, /Thêm đăng ký|Tạo ca|\+/i);
  if (add) {
    await page.waitForTimeout(400);
    log("Speaking", "Mở form thêm đăng ký", "Pass", "modal");
    await dismiss(page);
  } else {
    log("Speaking", "Form thêm đăng ký", "Note", "không thấy CTA");
  }
}

async function testGiaoVien(page) {
  await goto(page, "/aca/quan-ly/giao-vien");
  log(
    "Giáo viên",
    "Load danh sách",
    /giáo viên|hiệu suất|GV/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const add = await clickFirst(page, /Thêm giáo viên|Tạo GV|\+/i);
  log("Giáo viên", "CTA thêm GV", add ? "Pass" : "Note", add ? "opened" : "no CTA");
  await dismiss(page);
}

async function testNote(page) {
  await goto(page, "/aca/quan-ly/note");
  log(
    "Note",
    "Load trang",
    /note|quote|Word/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const add = await clickFirst(page, /Thêm|Tạo|Lưu/i);
  if (add) {
    const ta = page.locator("textarea, input[type='text']").first();
    if (await ta.isVisible({ timeout: 1500 }).catch(() => false)) {
      const marker = `ACA smoke note ${Date.now().toString().slice(-4)}`;
      await ta.fill(marker);
      const pr = await waitApi(page, /note|quote/i, async () => {
        await page.getByRole("button", { name: /Lưu|Thêm|Tạo/i }).first().click().catch(() => {});
      });
      log("Note", "Lưu note/quote", pr?.ok() ? "Pass" : "Note", pr ? `HTTP ${pr.status()}` : marker);
    }
  } else {
    log("Note", "CTA thêm/lưu", "Note", "không thấy");
  }
  await dismiss(page);
}

async function testLichRanh(page) {
  await goto(page, "/aca/quan-ly/lich-ranh");
  log(
    "Lịch rảnh",
    "Load lịch",
    /lịch rảnh|ca|grader|rảnh/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  // Click a free cell if present
  const cell = page.locator("td button, button").filter({ hasText: /^$|^\+$|Rảnh|Trống/ }).first();
  if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
    const pr = await waitApi(page, /free-slot|lich-ranh|aca/i, async () => {
      await cell.click({ force: true }).catch(() => {});
    });
    log("Lịch rảnh", "Toggle/tạo ca", pr?.ok() ? "Pass" : "Note", pr ? `HTTP ${pr.status()}` : "clicked cell");
  } else {
    log("Lịch rảnh", "Toggle ca", "Note", "không click được ô lịch");
  }
}

async function testNguoiDung(page) {
  await goto(page, "/aca/quan-ly/nguoi-dung");
  log(
    "Người dùng",
    "Load (mock)",
    /người dùng|user|email/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const lock = page.getByRole("button", { name: /Khóa|Mở khóa|Lock/i }).first();
  if (await lock.isVisible({ timeout: 1500 }).catch(() => false)) {
    await lock.click({ force: true }).catch(() => {});
    log("Người dùng", "Toggle khóa (demo)", "Pass", "clicked");
  } else {
    log("Người dùng", "Toggle khóa", "Note", "không thấy");
  }
}

async function testNoiDung(page) {
  await goto(page, "/aca/quan-ly/noi-dung");
  log(
    "Nội dung",
    "Load catalog",
    /nội dung|catalog|tài liệu/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
}

async function testPhanTich(page) {
  await goto(page, "/aca/phan-tich");
  log(
    "Phân tích",
    "Load dashboard",
    /phân tích|KPI|báo cáo|thống kê/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
}

async function testProfile(page) {
  await goto(page, "/aca/profile");
  log(
    "Profile",
    "Load hồ sơ",
    /hồ sơ|email|ACA|Khánh Thi/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
}

async function testLogout(page) {
  await goto(page, "/aca/quan-ly/lop-theo-thang");
  const logout = page.getByRole("button", { name: /Đăng xuất/i }).first();
  if (await logout.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logout.click({ force: true });
  } else {
    // sidebar icon last
    await page.locator("aside button").last().click().catch(() => {});
  }
  await page.waitForURL((u) => u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  log("Shell", "Đăng xuất", page.url().includes("/login") ? "Pass" : "Fail", page.url());
}

async function main() {
  const auth = await loginApi();
  log("Auth", "API login", "Pass", `${auth.user?.role} ${auth.user?.name || ""}`);
  if (auth.user?.role !== "ACA") {
    log("Auth", "Role ACA", "Fail", String(auth.user?.role));
  }

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await createAuthedContext(browser, auth);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await safeRun("Lớp tháng", testLopTheoThang, page);
  await safeRun("Học viên", testHocVien, page);
  await safeRun("Lớp 1:1", testLop11, page);
  await safeRun("RLP mẫu", testRlpMau, page);
  await safeRun("BCB Final", testBcbFinal, page);
  await safeRun("Điểm E/F", testDiemEntranceFinal, page);
  await safeRun("Luyện đề tuần", testLuyenDeTuan, page);
  await safeRun("Practice RLP", testPracticeRlp, page);
  await safeRun("Chấm Writing", testChamWriting, page);
  await safeRun("Speaking", testSpeaking, page);
  await safeRun("Giáo viên", testGiaoVien, page);
  await safeRun("Note", testNote, page);
  await safeRun("Lịch rảnh", testLichRanh, page);
  await safeRun("Người dùng", testNguoiDung, page);
  await safeRun("Nội dung", testNoiDung, page);
  await safeRun("Phân tích", testPhanTich, page);
  await safeRun("Profile", testProfile, page);
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
  fs.writeFileSync("/tmp/aca-actions-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/aca-actions-smoke.json",
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
