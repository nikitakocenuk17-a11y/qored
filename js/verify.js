// /js/verify.js
// Логика страницы verify.html
//
// Здесь отправляем OTP-код (ровно один раз при заходе на страницу),
// чтобы на login/register сначала прошли проверки и не было двойной отправки
// (которая вызывает ожидание для повторной отправки).

(function () {
  const form = document.getElementById("verifyForm");
  const boxesWrap = document.getElementById("codeBoxes");
  const displayEmail = document.getElementById("displayEmail");
  const backBtn = document.getElementById("backBtn");
  const checkBtn = document.getElementById("checkBtn");

  if (!form || !boxesWrap) return;

  const inputs = Array.from(boxesWrap.querySelectorAll("input"));
  const email = (localStorage.getItem("auth_email") || "").trim();
  const flow = localStorage.getItem("auth_flow") || "login"; // login | register

  if (displayEmail) displayEmail.textContent = email;

  function getCode() {
    return inputs.map((i) => (i.value || "").trim()).join("");
  }

  function setFocus(idx) {
    const el = inputs[idx];
    if (el) el.focus();
  }

  // UX: авто-переход между ячейками + вставка
  inputs.forEach((inp, idx) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
      if (inp.value && idx < inputs.length - 1) setFocus(idx + 1);
    });

    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && idx > 0) setFocus(idx - 1);
    });

    inp.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, inputs.length);
      if (!text) return;

      for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = text[i] || "";
      }
      setFocus(Math.min(text.length, inputs.length - 1));
    });
  });

  // 1) Отправка кода при заходе (один раз)
  async function sendOtpOnceOnEnter() {
    if (!email) return;

    const key = `${flow}:${email}`;
    const sentFor = localStorage.getItem("auth_code_sent_for") || "";
    const sentAt = parseInt(localStorage.getItem(`auth_code_sent_at_${flow}`) || "0", 10);
    const now = Date.now();

    // Если уже отправляли недавно (например, пользователь обновил страницу) — не отправляем снова
    const COOLDOWN_MS = 55 * 1000;
    const isRecent = sentFor === key && sentAt && now - sentAt < COOLDOWN_MS;
    if (isRecent) return;

    try {
      // блокируем кнопку проверки на время отправки, чтобы не путать UX
      if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.textContent = "Отправляем код...";
      }

      // register -> shouldCreateUser: true
      // login    -> shouldCreateUser: false
      const shouldCreateUser = flow === "register";
      await window.qored.sendCode(email, shouldCreateUser);

      localStorage.setItem("auth_code_sent_for", key);
      localStorage.setItem(`auth_code_sent_at_${flow}`, String(Date.now()));

      if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.textContent = "Проверить";
      }
    } catch (err) {
      console.error(err);

      // Важно: если у логина email не найден — покажем понятную ошибку
      if (flow === "login" && window.qored.looksLikeUserNotFound(err)) {
        alert("Аккаунт с такой почтой не найден");
      } else {
        alert(err?.message || "Не удалось отправить код");
      }

      if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.textContent = "Проверить";
      }
    }
  }

  backBtn &&
    backBtn.addEventListener("click", () => {
      // чтобы при следующем заходе код отправился заново
      localStorage.removeItem("auth_code_sent_for");
      localStorage.removeItem(`auth_code_sent_at_${flow}`);

      if (flow === "register") window.location.href = "register.html";
      else window.location.href = "login.html";
    });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const code = getCode();

    if (!email) {
      alert("Email не найден. Вернись назад и введи почту заново.");
      return;
    }

    if (code.length !== inputs.length) {
      alert("Введите код полностью");
      return;
    }

    try {
      checkBtn && (checkBtn.disabled = true);
      checkBtn && (checkBtn.textContent = "Проверка...");

      await window.qored.verifyCode(email, code);

      localStorage.removeItem("auth_email");
      localStorage.removeItem("auth_flow");
      localStorage.removeItem("auth_code_sent_for");
      localStorage.removeItem(`auth_code_sent_at_${flow}`);

      window.location.href = "app.html";
    } catch (err) {
      console.error(err);
      alert(err?.message || "Неверный код");
      checkBtn && (checkBtn.disabled = false);
      checkBtn && (checkBtn.textContent = "Проверить");
    }
  });

  // фокус на первую ячейку
  setFocus(0);

  // запускаем отправку после инициализации UI
  sendOtpOnceOnEnter();
})();
