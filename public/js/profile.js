const profileForm = document.getElementById("profileForm");
const goalsForm = document.getElementById("goalsForm");

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const realityGoalInput = document.getElementById("realityGoalInput");
const dreamGoalInput = document.getElementById("dreamGoalInput");
const personalGoalInput = document.getElementById("personalGoalInput");

const saveMessage = document.getElementById("saveMessage");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
let currentProfile = null;

async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

function showMessage(text) {
  if (!saveMessage) return;

  saveMessage.textContent = text;

  setTimeout(() => {
    saveMessage.textContent = "";
  }, 2500);
}

async function loadProfile() {
  currentUser = await protectPage();

  if (!currentUser) return;

  const { data, error } = await lucidSupabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Profil konnte nicht geladen werden:", error);
    showMessage("Profil konnte nicht geladen werden.");
    return;
  }

  currentProfile = data;

  nameInput.value = data.display_name || "";
  emailInput.value = data.email || currentUser.email || "";
  passwordInput.value = "";

  realityGoalInput.value = data.reality_goal || 8;
  dreamGoalInput.value = data.dream_goal || 5;
  personalGoalInput.value = data.personal_goal || "";
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const displayName = nameInput.value.trim() || "User";
  const email = emailInput.value.trim();
  const newPassword = passwordInput.value.trim();

  const { error: profileError } = await lucidSupabase
    .from("profiles")
    .update({
      display_name: displayName,
      email: email
    })
    .eq("id", currentUser.id);

  if (profileError) {
    console.error("Profil konnte nicht gespeichert werden:", profileError);
    showMessage("Profil konnte nicht gespeichert werden.");
    return;
  }

  if (email && email !== currentUser.email) {
    const { error: emailError } = await lucidSupabase.auth.updateUser({
      email: email
    });

    if (emailError) {
      console.error("E-Mail konnte nicht geändert werden:", emailError);
      showMessage("Profil gespeichert, aber E-Mail konnte nicht geändert werden.");
      return;
    }
  }

  if (newPassword.length > 0) {
    if (newPassword.length < 6) {
      showMessage("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    const { error: passwordError } = await lucidSupabase.auth.updateUser({
      password: newPassword
    });

    if (passwordError) {
      console.error("Passwort konnte nicht geändert werden:", passwordError);
      showMessage("Passwort konnte nicht geändert werden.");
      return;
    }

    passwordInput.value = "";
  }

  showMessage("Profil gespeichert.");
});

goalsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const realityGoal = Number(realityGoalInput.value) || 8;
  const dreamGoal = Number(dreamGoalInput.value) || 5;
  const personalGoal = personalGoalInput.value.trim();

  const { error } = await lucidSupabase
    .from("profiles")
    .update({
      reality_goal: realityGoal,
      dream_goal: dreamGoal,
      personal_goal: personalGoal
    })
    .eq("id", currentUser.id);

  if (error) {
    console.error("Ziele konnten nicht gespeichert werden:", error);
    showMessage("Ziele konnten nicht gespeichert werden.");
    return;
  }

  showMessage("Ziele gespeichert.");
});

logoutBtn.addEventListener("click", async () => {
  await lucidSupabase.auth.signOut();
  window.location.href = "./index.html";
});

loadProfile();