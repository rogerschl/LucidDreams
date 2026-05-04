const checkStatus = document.getElementById("checkStatus");

async function checkSession() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error) {
    console.error("Session konnte nicht geprüft werden:", error);
    return;
  }

  if (data.session) {
    checkStatus.textContent = "E-Mail bestätigt. Du wirst nun weitergeleitet...";
    window.location.href = "./dashboard.html";
  }
}

lucidSupabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    checkStatus.textContent = "E-Mail bestätigt. Du wirst nun weitergeleitet...";
    window.location.href = "./dashboard.html";
  }
});

checkSession();

setInterval(() => {
  checkSession();
}, 3000);