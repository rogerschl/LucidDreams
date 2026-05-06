const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  if (password.length < 6) {
    alert("Das Passwort muss mindestens 6 Zeichen lang sein.");
    return;
  }

  const redirectUrl = new URL("./login.html", window.location.href).href;

  const { data, error } = await lucidSupabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        display_name: name
      }
    }
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("user already")
    ) {
      alert("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
      window.location.href = "./login.html";
      return;
    }

    alert("Registrierung fehlgeschlagen: " + error.message);
    return;
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    alert("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
    window.location.href = "./login.html";
    return;
  }

  if (data.session) {
    window.location.href = "./dashboard.html";
    return;
  }

  localStorage.setItem("pendingEmail", email);
  window.location.href = "./check-email.html";
});