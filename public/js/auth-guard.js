async function getCurrentSession() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error) {
    console.error("Session konnte nicht geprüft werden:", error);
    return null;
  }

  return data.session;
}
async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    window.location.href = "./login.html";
    return null;
  }

  return session.user;
}
async function redirectIfLoggedIn() {
  const session = await getCurrentSession();

  if (session) {
    window.location.href = "./dashboard.html";
  }
}