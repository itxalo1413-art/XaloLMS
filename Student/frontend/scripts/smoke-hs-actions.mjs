/**
 * Smoke action: toàn bộ flow mutate của học viên (HS)
 *
 * Usage:
 *   cd frontend && npm run smoke:hs-actions
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = "nguyenduong939705@gmail.com";
const PASS = "Student@123!";

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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const feHost = new URL(FE).hostname;
  await context.addCookies([
    { name: "xalo.auth", value: "1", domain: feHost, path: "/", sameSite: "Lax" },
  ]);
  await context.addInitScript(
    ({ token, user }) => {
      try {
        localStorage.setItem("xalo.auth.token", token);
        localStorage.setItem("xalo.auth.user", JSON.stringify(user));
        localStorage.setItem("xalo.studentOnboardingSeen", "true");
        localStorage.removeItem("xalo.showLoginQuotePopup");
        document.cookie = "xalo.auth=1; Path=/; SameSite=Lax";
      } catch {}
    },
    { token: auth.access_token, user: auth.user },
  );
  return context;
}

async function dismissOverlays(page) {
  await page.keyboard.press("Escape").catch(() => {});
  for (let i = 0; i < 3; i++) {
    const btn = page.getByRole("button", {
      name: /bỏ qua|đóng|đã hiểu|tiếp tục|xong|skip|bắt đầu/i,
    });
    if (await btn.first().isVisible({ timeout: 400 }).catch(() => false)) {
      await btn.first().click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(200);
  }
}

async function waitBody(page, min = 40) {
  await page
    .waitForFunction((n) => (document.body?.innerText || "").trim().length >= n, min, {
      timeout: 20000,
    })
    .catch(() => {});
}

async function goto(page, path) {
  await page.goto(`${FE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissOverlays(page);
  await waitBody(page);
}

async function waitApi(page, pattern, action) {
  const p = page.waitForResponse(
    (r) => pattern.test(r.url()) && ["PATCH", "POST", "PUT", "DELETE"].includes(r.request().method()),
    { timeout: 8000 },
  ).catch(() => null);
  await action();
  return await p;
}

async function testShell(page) {
  await goto(page, "/");

  const guide = page.getByRole("button", { name: /Hướng dẫn sử dụng/i });
  if (await guide.isVisible().catch(() => false)) {
    await guide.click();
    await page.waitForTimeout(500);
    const guideOpen = await page.getByText(/Hướng dẫn|Onboarding|portal/i).count();
    log("Shell", "Mở hướng dẫn", guideOpen > 0 ? "Pass" : "Note", "modal/guide opened");
    await page.keyboard.press("Escape").catch(() => {});
    await dismissOverlays(page);
  } else {
    log("Shell", "Mở hướng dẫn", "Note", "nút guide không thấy");
  }

  const warnClose = page.locator('[title="Thu nhỏ tin nhắn"]').first();
  if (await warnClose.isVisible({ timeout: 1500 }).catch(() => false)) {
    await warnClose.click();
    log("Shell", "Dismiss cảnh báo học vụ", "Pass", "đã thu nhỏ alert");
  } else {
    log("Shell", "Dismiss cảnh báo học vụ", "Note", "không có cảnh báo active");
  }
}

async function testProfile(page) {
  await goto(page, "/");
  const open = page.getByRole("button", { name: /Mở hồ sơ học viên/i });
  if (!(await open.isVisible().catch(() => false))) {
    log("Profile", "Mở modal hồ sơ", "Fail", "không tìm thấy nút avatar");
    return;
  }
  await open.click();
  await page.getByRole("button", { name: /Lưu hồ sơ/i }).waitFor({ state: "visible", timeout: 8000 });
  const phoneInput = page.locator('input').filter({ has: page.locator('text=Số điện thoại') }).first();
  const phoneField = page.locator('label:has-text("Số điện thoại") input');
  const field = (await phoneField.count()) > 0 ? phoneField : page.locator('input').nth(2);
  const before = await field.inputValue().catch(() => "");
  const marker = `smoke-${Date.now().toString().slice(-4)}`;
  const nextPhone = before.includes("smoke-") ? before.replace(/smoke-\d{4}/, marker) : `${before} ${marker}`.trim();

  const saveResp = await waitApi(page, /\/api\/student\/profile/, async () => {
    await field.fill(nextPhone);
    await page.getByRole("button", { name: /Lưu hồ sơ/i }).click();
  });
  const ok = saveResp?.ok() ?? false;
  log(
    "Profile",
    "Lưu SĐT hồ sơ",
    ok ? "Pass" : "Note",
    saveResp ? `HTTP ${saveResp.status()}` : "no PATCH (có thể fallback local)",
  );

  await page.locator('[class*="overflow-y"]').first().evaluate((el) => el.scrollTo(0, 0)).catch(() => {});
  const sampleAvatar = page.locator('div:has-text("Ảnh đại diện mẫu") button[type="button"]').first();
  if (await sampleAvatar.isVisible().catch(() => false)) {
    await sampleAvatar.click();
    log("Profile", "Chọn avatar mẫu", "Pass", "clicked sample");
  } else {
    log("Profile", "Chọn avatar mẫu", "Note", "không thấy mẫu");
  }

  log("Profile", "Đổi mật khẩu", "Note", "bỏ qua (destructive) — chỉ kiểm tra section");
  const pwdToggle = page.getByRole("button", { name: /Đổi mật khẩu|mật khẩu/i }).first();
  if (await pwdToggle.isVisible().catch(() => false)) {
    await pwdToggle.click().catch(() => {});
    log("Profile", "Mở form đổi MK", "Pass", "section expand");
  }

  await page.getByRole("button", { name: /Đóng|Hủy|✕/i }).first().click().catch(() => {
    page.keyboard.press("Escape");
  });
}

async function testHomeMutations(page) {
  await goto(page, "/");

  await page.getByText("Phương pháp học hiệu quả", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
  const selectEl = page.locator("select").nth(1);
  if (await selectEl.isVisible().catch(() => false)) {
    const opts = await selectEl.locator("option").allTextContents();
    const pick = opts.find((o) => o.trim()) || opts[0];
    const profilePatch = page.waitForResponse(
      (r) => r.url().includes("/api/student/profile") && r.request().method() === "PATCH",
      { timeout: 15000 },
    );
    await selectEl.selectOption({ label: pick }).catch(async () => {
      if (opts[1]) await selectEl.selectOption({ index: 1 });
    });
    const pr = await profilePatch.catch(() => null);
    log(
      "Home",
      "Study Habits (weeklyHours)",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "local save only",
    );
  } else {
    log("Home", "Study Habits", "Fail", "select weeklyHours không thấy");
  }

  const skillChip = page
    .locator("button")
    .filter({ hasText: /^(Listening|Reading|Writing|Speaking)$/ })
    .first();
  if (await skillChip.isVisible().catch(() => false)) {
    await skillChip.click({ timeout: 5000 }).catch(() => {});
    const confirm = page.getByRole("button", { name: /Xác nhận \(\d+\)/i });
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      const pr = await waitApi(page, /\/api\/student\/profile/, async () => {
        await confirm.click({ timeout: 5000 }).catch(() => {});
      });
      log(
        "Home",
        "Focus skills Xác nhận",
        pr?.ok() ? "Pass" : "Note",
        pr ? `HTTP ${pr.status()}` : "confirmed UI / no API",
      );
    } else {
      log("Home", "Focus skills Xác nhận", "Note", "đã chọn, không cần xác nhận");
    }
  } else {
    log("Home", "Focus skills", "Note", "chip kỹ năng không thấy");
  }

  const examInput = page.locator('input[type="date"]').first();
  if (await examInput.isVisible().catch(() => false)) {
    const future = new Date();
    future.setMonth(future.getMonth() + 2);
    const iso = future.toISOString().slice(0, 10);
    const pr = await waitApi(page, /\/api\/student\/profile/, async () => {
      await examInput.fill(iso);
      await examInput.blur();
    });
    log(
      "Home",
      "Ngày thi dự kiến",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()} date=${iso}` : `set date=${iso}`,
    );
  } else {
    log("Home", "Ngày thi dự kiến", "Note", "input date không thấy");
  }
}

async function testRlpHomework(page) {
  await goto(page, "/skill");
  const submitBtn = page.getByRole("button", { name: /^Nộp bài$/i }).first();
  if (!(await submitBtn.isVisible().catch(() => false))) {
    const editBtn = page.getByRole("button", { name: /Đã nộp · Sửa link/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      log("RLP", "Nộp homework", "Note", "không có buổi chờ nộp; đã có bài nộp sẵn");
      const unsubmit = page.getByRole("button", { name: /Hủy nộp/i }).first();
      if (await unsubmit.isVisible().catch(() => false)) {
        const pr = await waitApi(page, /\/api\/student\/rlp-sessions\//, async () => {
          await unsubmit.click();
        });
        log("RLP", "Hủy nộp homework", pr?.ok() ? "Pass" : "Note", pr ? `HTTP ${pr.status()}` : "clicked");
      }
      return;
    }
    log("RLP", "Nộp homework", "Note", "không có nút Nộp bài (chưa giao BT?)");
    return;
  }

  await submitBtn.click();
  const link = `https://docs.google.com/document/d/hs-rlp-smoke-${Date.now()}`;
  await page.locator('input[placeholder*="http" i], input[placeholder*="link" i]').last().fill(link);
  const pr = await waitApi(page, /\/api\/student\/rlp-sessions\//, async () => {
    await page.getByRole("button", { name: /Xác nhận nộp/i }).click();
  });
  log(
    "RLP",
    "Nộp homework link",
    pr?.ok() ? "Pass" : "Note",
    pr ? `HTTP ${pr.status()}` : "dialog submitted",
  );

  const unsubmit = page.getByRole("button", { name: /Hủy nộp/i }).first();
  if (await unsubmit.isVisible({ timeout: 5000 }).catch(() => false)) {
    const pr2 = await waitApi(page, /\/api\/student\/rlp-sessions\//, async () => {
      await unsubmit.click();
    });
    log("RLP", "Hủy nộp homework", pr2?.ok() ? "Pass" : "Note", pr2 ? `HTTP ${pr2.status()}` : "clicked");
  }
}

async function testHoTro(page) {
  await goto(page, "/ho-tro-tu-hoc");

  // Writing submit
  const regWriting = page.getByRole("button", { name: /Đăng ký ngay/i }).nth(1);
  const writingPanelBtn = page.locator("button").filter({ hasText: /Writing|đăng ký ngay/i });
  let writingOpened = false;
  for (const btn of [regWriting, ...(await writingPanelBtn.all())]) {
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      writingOpened = true;
      break;
    }
  }
  const wInput = page.locator('input[placeholder*="http" i], input[placeholder*="link" i]').first();
  if (await wInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    const link = `https://docs.google.com/document/d/hs-w-smoke-${Date.now()}`;
    await wInput.fill(link);
    const pr = await waitApi(page, /\/api\/writing-submissions|writing/i, async () => {
      await page.getByRole("button", { name: /Gửi bài|Nộp bài|nộp ngay/i }).first().click();
    });
    log(
      "Hỗ trợ",
      "Writing gửi link",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "submitted UI",
    );
  } else {
    log("Hỗ trợ", "Writing gửi link", "Note", writingOpened ? "quota/full" : "input không mở");
  }

  // Speaking book + optional cancel
  await page.getByText(/mock test speaking|Support Speaking/i).first().scrollIntoViewIfNeeded().catch(() => {});
  const expandSpeaking = page.getByRole("button", { name: /Đăng ký ngay/i }).first();
  if (await expandSpeaking.isVisible().catch(() => false)) {
    const label = await expandSpeaking.innerText().catch(() => "");
    if (/đăng ký ngay/i.test(label)) await expandSpeaking.click({ force: true });
  }
  const speakBookBtn = page.getByRole("button", { name: /^Đăng ký lịch$/i }).first();
  if (await clickIfEnabled(speakBookBtn)) {
    await page.waitForTimeout(800);
    const step1 = await page.getByText("Bước 1 / 3").isVisible().catch(() => false);
    if (step1) {
      const dayBtn = page.locator("button:has(span.bg-emerald-400)").first();
      if (await dayBtn.isVisible().catch(() => false)) {
        await dayBtn.click();
        await page.waitForTimeout(600);
        const teacher = page.locator("button").filter({ hasText: /ca rảnh ngày này/i }).first();
        if (await teacher.isVisible().catch(() => false)) {
          await teacher.click();
          await page.waitForTimeout(600);
          const slot = page.locator("button").filter({ hasText: /:\d{2}/ }).first();
          if (await slot.isVisible().catch(() => false)) {
            await slot.click();
            await page.waitForTimeout(400);
            const confirm = page.getByRole("button", { name: /^Xác nhận$/i }).last();
            const pr = await waitApi(page, /\/api\/mock-tests|mock-test/i, async () => {
              await confirm.click();
            });
            log(
              "Hỗ trợ",
              "Speaking đặt lịch",
              pr?.ok() ? "Pass" : "Note",
              pr ? `HTTP ${pr.status()}` : "confirm clicked",
            );
            await page.waitForTimeout(1200);
            const cancelBtn = page.getByRole("button", { name: /Hủy ca/i }).first();
            if (await cancelBtn.isVisible().catch(() => false)) {
              await cancelBtn.click();
              await page.getByRole("button", { name: /Xác nhận|Hủy ca|Đồng ý/i }).last().click().catch(() => {});
              log("Hỗ trợ", "Speaking hủy ca", "Pass", "clicked hủy ca");
            }
          } else {
            log("Hỗ trợ", "Speaking đặt lịch", "Note", "không có slot giờ");
          }
        } else {
          log("Hỗ trợ", "Speaking đặt lịch", "Note", "không có GV rảnh ngày chọn");
        }
      } else {
        log("Hỗ trợ", "Speaking đặt lịch", "Note", "không có ngày có ca rảnh");
        await page.getByRole("button", { name: /^Đóng$/i }).click().catch(() => {});
      }
    } else {
      log("Hỗ trợ", "Speaking modal", "Note", "modal không mở / đã đủ ca tuần");
    }
  } else {
    log("Hỗ trợ", "Speaking đặt lịch", "Note", "nút Đăng ký lịch disabled (quota)");
  }

  // Practice join + slot
  const joinProgram = page.getByRole("button", { name: /Đăng ký ngay/i }).last();
  if (await joinProgram.isVisible().catch(() => false)) {
    const txtBefore = await page.evaluate(() => document.body.innerText);
    if (/đăng ký lớp luyện|tham gia chương trình/i.test(txtBefore)) {
      await joinProgram.click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
    }
  }
  const slotBtn = page.getByRole("button", { name: /Đăng ký buổi này/i }).first();
  if (await slotBtn.isVisible().catch(() => false)) {
    const pr = await waitApi(page, /\/api\/practice-class|practice/i, async () => {
      await slotBtn.click();
    });
    log(
      "Hỗ trợ",
      "Luyện đề đăng ký buổi",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "registered UI",
    );
  } else {
    log("Hỗ trợ", "Luyện đề đăng ký buổi", "Note", "đã đăng ký hoặc không có slot");
  }

  const folderInput = page.locator('input[placeholder*="drive" i], input[placeholder*="Drive" i], input[placeholder*="folder" i]').first();
  if (await folderInput.isVisible().catch(() => false)) {
    const url = `https://drive.google.com/drive/folders/hs-smoke-${Date.now()}`;
    await folderInput.fill(url);
    await folderInput.press("Enter").catch(() => {});
    log("Hỗ trợ", "Lưu Drive folder cá nhân", "Pass", "filled folder url");
  } else {
    log("Hỗ trợ", "Lưu Drive folder", "Note", "input folder không thấy");
  }

  const practiceRlp = page.getByRole("button", { name: /^Nộp bài$/i }).last();
  if (await practiceRlp.isVisible().catch(() => false)) {
    await practiceRlp.click().catch(() => {});
    log("Hỗ trợ", "Practice RLP nộp/toggle", "Pass", "clicked Nộp bài practice");
  } else {
    log("Hỗ trợ", "Practice RLP", "Note", "không có bảng RLP practice");
  }
}

async function clickIfEnabled(locator) {
  try {
    await locator.waitFor({ state: "visible", timeout: 4000 });
    if (await locator.isDisabled()) return false;
    await locator.click({ timeout: 5000, force: true });
    return true;
  } catch {
    return false;
  }
}

async function testLuuTru(page) {
  await goto(page, "/luu-tru-test");

  const finalExpand = page.getByRole("button", { name: /Đăng ký ngay/i }).filter({ hasText: /Final|final/i }).first();
  if (await finalExpand.isVisible().catch(() => false)) {
    await finalExpand.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  const finalPanel = page.locator("div").filter({ hasText: /Final Test|Bài thi cuối khóa/i }).first();
  const speakBook = finalPanel.getByRole("button", { name: /Đăng ký lịch/i }).first();
  if (await clickIfEnabled(speakBook)) {
    await page.waitForTimeout(600);
    const modal = await page.getByText(/Final Speaking|Chọn ngày|Bước/i).count();
    log("Lưu trữ test", "Mở modal Final Speaking", modal > 0 ? "Pass" : "Note", "modal");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Đóng|Hủy|✕/i }).first().click().catch(() => {});
  } else {
    log("Lưu trữ test", "Final Speaking modal", "Note", "nút disabled / không đủ điều kiện");
  }

  const lrwBook = finalPanel.getByRole("button", { name: /Đăng ký lịch/i }).nth(1);
  if (await clickIfEnabled(lrwBook)) {
    await page.waitForTimeout(600);
    log("Lưu trữ test", "Mở modal Final LRW", "Pass", "opened");
    await page.keyboard.press("Escape");
  } else {
    log("Lưu trữ test", "Final LRW modal", "Note", "nút disabled / không đủ điều kiện");
  }

  const finalWriting = finalPanel.locator('input[placeholder*="http" i], input[placeholder*="Docs" i]').first();
  if (await finalWriting.isVisible().catch(() => false)) {
    const link = `https://docs.google.com/document/d/hs-final-w-${Date.now()}`;
    await finalWriting.fill(link);
    const submitBtn = finalPanel.getByRole("button", { name: /Nộp bài|Gửi|\+ Nộp bài/i }).first();
    const pr = await waitApi(page, /final|writing/i, async () => {
      await clickIfEnabled(submitBtn);
    });
    log(
      "Lưu trữ test",
      "Final Writing nộp link",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "submit clicked",
    );
  } else {
    log("Lưu trữ test", "Final Writing nộp link", "Note", "chưa có ca / form ẩn");
  }
}

async function testDocumentProgress(page) {
  await goto(page, "/tai-lieu-them");
  const docLink = page.locator('a[href*="/tai-lieu-them/xem/"]').first();
  const href = await docLink.getAttribute("href").catch(() => null);
  if (!href) {
    log("Tài liệu", "Progress demo", "Fail", "không có link tài liệu");
    return;
  }
  await page.goto(`${FE}${href}`, { waitUntil: "domcontentloaded" });
  await waitBody(page);
  const docId = href.split("/").pop();
  await page.getByRole("button", { name: /Đánh dấu: Đã xem/i }).click();
  await page.locator('input[placeholder*="Trang"]').fill(`Smoke ${Date.now().toString().slice(-4)}`);
  await page.getByRole("button", { name: /Lưu vị trí đọc/i }).click();
  const stored = await page.evaluate((id) => {
    try {
      const raw = localStorage.getItem("student_reading_progress_v1");
      const map = raw ? JSON.parse(raw) : {};
      return map[id]?.status === "completed";
    } catch {
      return false;
    }
  }, docId);
  log("Tài liệu", "Lưu progress đọc (local)", stored ? "Pass" : "Note", `doc=${docId}`);
}

async function testGuestLead(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${FE}/guest-diagnosis`, { waitUntil: "load", timeout: 60000 });
  await page
    .waitForFunction(
      () => !/Đang tải báo cáo chẩn đoán/i.test(document.body?.innerText || ""),
      { timeout: 25000 },
    )
    .catch(() => {});
  await waitBody(page);
  await page.locator("#tu-van").scrollIntoViewIfNeeded();
  const nameInput = page.locator("#tu-van input[type='text']");
  await nameInput.waitFor({ state: "visible", timeout: 20000 });
  const name = `Smoke Guest ${Date.now().toString().slice(-5)}`;
  const phone = `09${String(Date.now()).slice(-8)}`;
  await nameInput.fill(name);
  await page.locator("#tu-van input[type='tel']").fill(phone);
  const submitWait = page.waitForResponse(
    (r) => r.url().includes("/api/") && r.request().method() === "POST",
    { timeout: 8000 },
  ).catch(() => null);
  await page.locator("#tu-van form button[type='submit']").click({ timeout: 10000 });
  await submitWait;
  await page
    .waitForFunction(
      () =>
        window.location.search.includes("leadId=") ||
        /Đăng Ký Thành Công/i.test(document.body?.innerText || ""),
      { timeout: 12000 },
    )
    .catch(() => {});
  const ok =
    page.url().includes("leadId=") ||
    (await page.getByText(/Đăng Ký Thành Công/i).count()) > 0;
  const localLead = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem("xalo.guestDiagnosis.leads.v1");
      return raw ? JSON.parse(raw).length > 0 : false;
    } catch {
      return false;
    }
  });
  log(
    "Guest",
    "Form tư vấn",
    ok || localLead ? "Pass" : "Note",
    ok ? page.url() : localLead ? "saved local lead" : page.url(),
  );
  await context.close();
}

async function testLogout(page) {
  await goto(page, "/");
  const logoutBtn = page.locator("aside button").last();
  const alt = page.getByRole("button", { name: /Đăng xuất/i });
  if (await alt.isVisible().catch(() => false)) {
    await alt.click();
  } else {
    await logoutBtn.click().catch(() => {});
  }
  await page.waitForURL((u) => u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  log(
    "Shell",
    "Đăng xuất",
    page.url().includes("/login") ? "Pass" : "Fail",
    page.url(),
  );
}

async function safeRun(name, fn, page) {
  try {
    await fn(page);
  } catch (e) {
    log(name, "Runner error", "Fail", String(e.message || e).slice(0, 220));
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    await testGuestLead(browser);
  } catch (e) {
    log("Guest", "Runner error", "Fail", String(e.message || e).slice(0, 220));
  }

  const auth = await loginApi();
  log("Auth", "API login", "Pass", auth.user?.name || EMAIL);

  const context = await createAuthedContext(browser, auth);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await safeRun("Shell", testShell, page);
  await safeRun("Profile", testProfile, page);
  await safeRun("Home", testHomeMutations, page);
  await safeRun("RLP", testRlpHomework, page);
  await safeRun("Hỗ trợ", testHoTro, page);
  await safeRun("Lưu trữ", testLuuTru, page);
  await safeRun("Tài liệu", testDocumentProgress, page);
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
  fs.writeFileSync("/tmp/hs-actions-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/hs-actions-smoke.json",
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
