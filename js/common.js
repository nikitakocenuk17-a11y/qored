// /js/common.js
// Общие функции: показать ошибку, отправить код, проверить код

function showAlert(boxId, message) {
  const el = document.getElementById(boxId);
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
}

function hideAlert(boxId) {
  const el = document.getElementById(boxId);
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function looksLikeUserNotFound(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("signups not allowed") ||
    msg.includes("user not found") ||
    msg.includes("not found") ||
    msg.includes("invalid login") ||
    msg.includes("no user") ||
    msg.includes("otp") && msg.includes("signup") // частый текст у Supabase
  );
}

async function sendCode(email, shouldCreateUser = true) {
  if (!window.sb) throw new Error("Supabase client не инициализирован (window.sb пуст).");

  const { error } = await window.sb.auth.signInWithOtp({
    email: email,
    options: { shouldCreateUser: !!shouldCreateUser }
  });

  if (error) throw error;
}

// "Проба" — проверка существования email без Edge Function.
// Если email уже существует, Supabase отправит OTP и вернёт success.
// Если email не существует — вернёт ошибку (обычно "Signups not allowed for otp").
async function probeEmailExists(email) {
  try {
    await sendCode(email, false);
    return true; // существует
  } catch (err) {
    if (looksLikeUserNotFound(err)) return false; // не существует
    // прочие ошибки (rate limit, сеть и т.д.) пробрасываем
    throw err;
  }
}

async function verifyCode(email, code) {
  if (!window.sb) throw new Error("Supabase client не инициализирован (window.sb пуст).");

  const { data, error } = await window.sb.auth.verifyOtp({
    email: email,
    token: code,
    type: "email"
  });

  if (error) throw error;
  return data;
}
async function updatePassword(newPassword) {
  if (!window.sb) throw new Error("Supabase client не инициализирован (window.sb пуст).");
  const { data, error } = await window.sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}


// делаем доступным для остальных файлов
window.qored = window.qored || {};
window.qored.showAlert = showAlert;
window.qored.hideAlert = hideAlert;
window.qored.isValidEmail = isValidEmail;
window.qored.sendCode = sendCode;
window.qored.probeEmailExists = probeEmailExists;
window.qored.verifyCode = verifyCode;
window.qored.updatePassword = updatePassword;
window.qored.looksLikeUserNotFound = looksLikeUserNotFound;
