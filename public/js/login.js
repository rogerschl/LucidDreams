const loginForm = document.getElementById("loginForm");
const wrongLoginMessage = document.getElementById("wrongLoginMessage");

function showWrongCredentialMessage(text) {
  if (!wrongLoginMessage) return;

  wrongLoginMessage.textContent = text;
  wrongLoginMessage.classList.add("show");

  setTimeout(() => {
    wrongLoginMessage.classList.remove("show");
    wrongLoginMessage.textContent = "";
  }, 3000);
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showWrongCredentialMessage("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const { data, error } = await lucidSupabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error("Login fehlgeschlagen:", error);
      showWrongCredentialMessage("E-Mail oder Passwort ist falsch.");
      return;
    }

    window.location.href = "./dashboard.html";
  });
}