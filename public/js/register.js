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

  const { data, error } = await lucidSupabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        display_name: name
      }
    }
  });

  if (error) {
    alert("Registrierung fehlgeschlagen: " + error.message);
    return;
  }

  alert("Registrierung erfolgreich. Du kannst dich jetzt anmelden.");
  window.location.href = "./login.html";
});