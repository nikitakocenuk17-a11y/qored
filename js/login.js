// /js/login.js
// Логика страницы login.html
//
// Задача: сначала все проверки, и только ПОТОМ отправка кода.
// Чтобы не ловить ожидание «повторная отправка кода через N секунд»,
// мы НЕ отправляем OTP здесь.
// Код отправляется на verify.html (один раз на вход).

(function () {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("emailInput");
  const passInput = document.getElementById("passInput");
  const sendBtn = document.getElementById("sendBtn");

  const eye = document.getElementById("eye");
  const eyeOpen = document.getElementById("eyeOpen");
  const eyeClosed = document.getElementById("eyeClosed");

  if (!form) return;

  function setEyeVisible(visible) {
    if (!eye) return;
    eye.style.display = visible ? "flex" : "none";
  }

  function setEyeState(isShown) {
    if (!eyeOpen || !eyeClosed) return;
    eyeOpen.style.display = isShown ? "block" : "none";
    eyeClosed.style.display = isShown ? "none" : "block";
  }

  // глаз появляется только если есть пароль
  if (passInput) {
    setEyeVisible(!!passInput.value);
    passInput.addEventListener("input", () => {
      setEyeVisible(!!passInput.value);
      window.qored.hideAlert("alertBox");
    });
  }

  // переключение пароля
  if (eye && passInput) {
    let shown = false;
    setEyeState(shown);

    const toggle = () => {
      if (!passInput.value) return;
      shown = !shown;
      passInput.type = shown ? "text" : "password";
      setEyeState(shown);
    };

    eye.addEventListener("click", toggle);
    eye.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") toggle();
    });
  }

  emailInput && emailInput.addEventListener("input", () => window.qored.hideAlert("alertBox"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.qored.hideAlert("alertBox");

    const email = (emailInput?.value || "").trim();
    const pass = (passInput?.value || "");

    if (!email) return window.qored.showAlert("alertBox", "Электронная почта не указана");
    if (!window.qored.isValidEmail(email)) return window.qored.showAlert("alertBox", "Некорректная электронная почта");
    if (!pass) return window.qored.showAlert("alertBox", "Пароль не указан");
    if (pass.length < 8) return window.qored.showAlert("alertBox", "Пароль должен быть не менее 8 символов");

    try {
      sendBtn && (sendBtn.disabled = true);
      sendBtn && (sendBtn.textContent = "Переходим...");

      // сохраняем email + flow, чтобы verify.html отправил код ОДИН раз
      localStorage.setItem("auth_email", email);
      localStorage.setItem("auth_flow", "login");

      // сбрасываем флаг "код уже отправлен" для нового захода
      localStorage.removeItem("auth_code_sent_for");
      localStorage.removeItem("auth_code_sent_at");

      const exists = await window.qored.probeEmailExists(email);

if (!exists) {
  sendBtn.disabled = false;
  sendBtn.textContent = "Продолжить";
  return window.qored.showAlert(
    "alertBox",
    "Аккаунт с такой почтой не найден"
  );
}

localStorage.setItem("auth_email", email);
localStorage.setItem("auth_flow", "login");
localStorage.removeItem("auth_code_sent_for");
localStorage.removeItem("auth_code_sent_at");

window.location.href = "verify.html";

    } catch (err) {
      console.error(err);
      window.qored.showAlert("alertBox", err?.message || "Ошибка входа");
      sendBtn && (sendBtn.disabled = false);
      sendBtn && (sendBtn.textContent = "Продолжить");
    }
  });


// Forgot password link -> open reset-request page (separate page, not modal)
const forgotLink = document.querySelector(".forgot");
if (forgotLink) {
  // if it's not an <a>, emulate navigation; if it is, keep default behavior
  forgotLink.addEventListener("click", (e) => {
    const tag = (forgotLink.tagName || "").toLowerCase();
    if (tag !== "a") {
      e.preventDefault();
      window.location.href = "reset-request.html";
    }
  });
}

})();
