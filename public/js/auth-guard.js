async function guardPage() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const publicPages = [
    "index.html",
    "login.html",
    "register.html",
    "forgot-password.html",
    "reset-password.html",
    "check-email.html"
  ];

  const redirectIfLoggedInPages = [
    "index.html",
    "login.html",
    "register.html",
    "forgot-password.html",
    "check-email.html"
  ];

  const { data, error } = await lucidSupabase.auth.getSession();
  const isLoggedIn = !error && data.session;

  if (publicPages.includes(currentPage)) {
    document.body.classList.remove("auth-loading");

    if (isLoggedIn && redirectIfLoggedInPages.includes(currentPage)) {
      window.location.replace("./dashboard.html");
    }

    return;
  }

  if (!isLoggedIn) {
    window.location.replace("./login.html");
    return;
  }

  document.body.classList.remove("auth-loading");
}

guardPage();