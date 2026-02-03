// /js/register.js
// Логика страницы register.html (регистрация)
//
// Задача: сначала все проверки, и только ПОТОМ отправка кода.
// Чтобы не ловить ожидание «повторная отправка кода через N секунд»,
// мы НЕ отправляем OTP здесь.
// Код отправляется на verify.html (один раз на вход).

(function () {
  const form = document.getElementById("registerForm");
  const emailInput = document.getElementById("emailInputReg");
  const passInput = document.getElementById("passInputReg");
  const sendBtn = document.getElementById("sendBtnReg");

  const eye = document.getElementById("eyeReg");
  const eyeOpen = document.getElementById("eyeOpenReg");
  const eyeClosed = document.getElementById("eyeClosedReg");

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

  if (passInput) {
    setEyeVisible(!!passInput.value);
    passInput.addEventListener("input", () => {
      setEyeVisible(!!passInput.value);
      window.qored.hideAlert("alertBoxReg");
    });
  }

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

  emailInput && emailInput.addEventListener("input", () => window.qored.hideAlert("alertBoxReg"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    window.qored.hideAlert("alertBoxReg");

    const email = (emailInput?.value || "").trim();
    const pass = (passInput?.value || "");

    if (!email) return window.qored.showAlert("alertBoxReg", "Электронная почта не указана");
    if (!window.qored.isValidEmail(email)) return window.qored.showAlert("alertBoxReg", "Некорректная электронная почта");
    if (!pass) return window.qored.showAlert("alertBoxReg", "Пароль не указан");
    if (pass.length < 8) return window.qored.showAlert("alertBoxReg", "Пароль должен быть не менее 8 символов");

    try {
      sendBtn && (sendBtn.disabled = true);
      sendBtn && (sendBtn.textContent = "Переходим...");

      // сохраняем email + flow, чтобы verify.html отправил код ОДИН раз
      localStorage.setItem("auth_email", email);
      localStorage.setItem("auth_flow", "register");

      // сбрасываем флаг "код уже отправлен" для нового захода
      localStorage.removeItem("auth_code_sent_for");
      localStorage.removeItem("auth_code_sent_at");

      const exists = await window.qored.probeEmailExists(email);

if (exists) {
  sendBtn.disabled = false;
  sendBtn.textContent = "Продолжить";
  return window.qored.showAlert(
    "alertBoxReg",
    "Аккаунт с такой почтой уже существует"
  );
}

localStorage.setItem("auth_email", email);
localStorage.setItem("auth_flow", "register");
localStorage.removeItem("auth_code_sent_for");
localStorage.removeItem("auth_code_sent_at");

window.location.href = "verify.html";

    } catch (err) {
      console.error(err);
      window.qored.showAlert("alertBoxReg", err?.message || "Ошибка регистрации");
      sendBtn && (sendBtn.disabled = false);
      sendBtn && (sendBtn.textContent = "Продолжить");
    }
  });
})();
