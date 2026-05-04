const resetForm = document.getElementById("resetForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetMessage = document.getElementById("resetMessage");

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!password || !confirmPassword) {
    resetMessage.textContent = "Bitte beide Passwortfelder ausfüllen.";
    return;
  }

  if (password.length < 6) {
    resetMessage.textContent = "Das Passwort muss mindestens 6 Zeichen lang sein.";
    return;
  }

  if (password !== confirmPassword) {
    resetMessage.textContent = "Die Passwörter stimmen nicht überein.";
    return;
  }

  const { error } = await lucidSupabase.auth.updateUser({
    password: password
  });

  if (error) {
    console.error("Passwort konnte nicht geändert werden:", error);
    resetMessage.textContent = "Passwort konnte nicht geändert werden. Bitte öffne den Link aus deiner E-Mail erneut.";
    return;
  }

  resetMessage.textContent = "Passwort wurde geändert. Du wirst weitergeleitet...";

  setTimeout(() => {
    window.location.href = "./login.html";
  }, 1500);
});