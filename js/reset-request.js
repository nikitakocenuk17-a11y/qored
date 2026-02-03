// /js/reset-request.js
// Сброс пароля (2 шага на одной странице):
// 1) Ввод email + отправка кода
// 2) Ввод кода (как на verify) + кнопка "Продолжить" (пока без следующего шага)

(function () {
  const form = document.getElementById("resetRequestForm");
  const resetEmailInput = document.getElementById("resetEmailInput");
  const sendBtn = document.getElementById("resetSendBtn");
  const back = document.getElementById("resetBack");

  const subtitle = document.getElementById("resetSubtitle");
  const emailStep = document.getElementById("resetEmailStep");
  const codeStep = document.getElementById("resetCodeStep");

  const displayEmail = document.getElementById("displayEmail");
  const boxesWrap = document.getElementById("codeBoxes");
  const continueBtn = document.getElementById("resetContinueBtn");

  if (back) back.addEventListener("click", () => (window.location.href = "login.html"));
  if (!form || !resetEmailInput) return;

  // --- Кодовые боксы (UX как verify/reset)
  const inputs = boxesWrap ? Array.from(boxesWrap.querySelectorAll("input")) : [];

  function setFocus(idx) {
    const el = inputs[idx];
    if (el) el.focus();
  }

  function getCode() {
    return inputs.map((i) => (i.value || "").trim()).join("");
  }

  function initCodeBoxes() {
    if (!inputs.length) return;

    inputs.forEach((inp, idx) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
        window.qored.hideAlert("alertBoxResetRequest");
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
  }

  initCodeBoxes();
  resetEmailInput.addEventListener("input", () => window.qored.hideAlert("alertBoxResetRequest"));

  let step = "email"; // 'email' | 'code'

  function showCodeStep(email) {
    step = "code";
    if (emailStep) emailStep.style.display = "none";
    if (codeStep) codeStep.style.display = "block";
    if (subtitle) subtitle.textContent = "Введите код из письма";
    if (displayEmail) displayEmail.textContent = email;

    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.textContent = "Продолжить";
    }

    // очистим ячейки и поставим фокус
    inputs.forEach((i) => (i.value = ""));
    setFocus(0);
  }

  async function sendResetCode(email) {
    // единый ключ, чтобы избежать повторной отправки при обновлении
    const flow = "reset";
    const key = `${flow}:${email}`;
    const sentFor = localStorage.getItem("auth_code_sent_for") || "";
    const sentAt = parseInt(localStorage.getItem(`auth_code_sent_at_${flow}`) || "0", 10);
    const now = Date.now();

    const COOLDOWN_MS = 55 * 1000;
    const isRecent = sentFor === key && sentAt && now - sentAt < COOLDOWN_MS;
    if (isRecent) return;

    await window.qored.sendCode(email, false);

    localStorage.setItem("auth_email", email);
    localStorage.setItem("auth_flow", flow);
    localStorage.setItem("auth_code_sent_for", key);
    localStorage.setItem(`auth_code_sent_at_${flow}`, String(Date.now()));
  }

  async function handleEmailSubmit() {
    window.qored.hideAlert("alertBoxResetRequest");

    const email = (resetEmailInput.value || "").trim();
    if (!email) return window.qored.showAlert("alertBoxResetRequest", "Электронная почта не указана");
    if (!window.qored.isValidEmail(email)) return window.qored.showAlert("alertBoxResetRequest", "Некорректная электронная почта");

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Проверяем...";
      }

      // ВАЖНО: probeEmailExists() в текущей реализации уже вызывает sendCode()
      // (Supabase signInWithOtp) и тем самым отправляет OTP.
      // Раньше здесь происходила двойная отправка подряд, из‑за чего Supabase
      // отвечал лимитом вида: "For security purposes, you can only request this after XX seconds".
      // Поэтому: проверяем существование через probeEmailExists() и, если всё ок,
      // просто переходим к шагу ввода кода без повторной отправки.
      const flow = "reset";
      localStorage.setItem("auth_flow", flow);

      const exists = await window.qored.probeEmailExists(email);
      if (!exists) {
        return window.qored.showAlert("alertBoxResetRequest", "Аккаунт с такой почтой не найден");
      }

      // помечаем, что код для этой почты/флоу уже отправлялся недавно
      const key = `${flow}:${email}`;
      localStorage.setItem("auth_email", email);
      localStorage.setItem("auth_code_sent_for", key);
      localStorage.setItem(`auth_code_sent_at_${flow}`, String(Date.now()));

      showCodeStep(email);
    } catch (err) {
      console.error(err);
      window.qored.showAlert("alertBoxResetRequest", err?.message || "Не удалось отправить код");
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = "Отправить код";
      }
    }
  }

  async function handleCodeSubmit() {
    window.qored.hideAlert("alertBoxResetRequest");

    const email = (localStorage.getItem("auth_email") || "").trim() || (resetEmailInput.value || "").trim();
    if (!email) return window.qored.showAlert("alertBoxResetRequest", "Email не найден. Начните заново.");

    const code = getCode();
    if (code.length !== inputs.length) return window.qored.showAlert("alertBoxResetRequest", "Введите код полностью");

    try {
      if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = "Проверка...";
      }

      await window.qored.verifyCode(email, code);

      // Пока что — останавливаемся здесь (следующий шаг добавим позже)
      if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = "Готово";
      }
    } catch (err) {
      console.error(err);
      window.qored.showAlert("alertBoxResetRequest", err?.message || "Неверный код");
      if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.textContent = "Продолжить";
      }
    }
  }

  // Один submit для двух шагов
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (step === "email") return handleEmailSubmit();
    return handleCodeSubmit();
  });
})();
