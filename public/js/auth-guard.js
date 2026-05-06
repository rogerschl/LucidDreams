async function guardProtectedPage() {
  const publicPages = [
    "index.html",
    "login.html",
    "register.html",
    "forgot-password.html",
    "reset-password.html"
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (publicPages.includes(currentPage)) {
    document.body.classList.remove("auth-loading");
    return;
  }

  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.replace("./login.html");
    return;
  }

  document.body.classList.remove("auth-loading");
}

guardProtectedPage();