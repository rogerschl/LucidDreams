const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Bitte E-Mail und Passwort eingeben.");
    return;
  }

  const { data, error } = await lucidSupabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
    return;
  }

  window.location.href = "./dashboard.html";
});