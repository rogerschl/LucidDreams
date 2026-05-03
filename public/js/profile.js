const profileForm = document.getElementById("profileForm");
const goalsForm = document.getElementById("goalsForm");

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const realityGoalInput = document.getElementById("realityGoalInput");
const dreamGoalInput = document.getElementById("dreamGoalInput");
const personalGoalInput = document.getElementById("personalGoalInput");

const openRealityModalBtn = document.getElementById("openRealityModalBtn");
const closeRealityModalBtn = document.getElementById("closeRealityModalBtn");
const realityModalOverlay = document.getElementById("realityModalOverlay");
const realityModalTitle = document.getElementById("realityModalTitle");

const realityCheckForm = document.getElementById("realityCheckForm");
const realityTitleInput = document.getElementById("realityTitleInput");
const realityTextInput = document.getElementById("realityTextInput");
const realityActiveInput = document.getElementById("realityActiveInput");
const realityNotificationInput = document.getElementById("realityNotificationInput");
const realityFavoriteInput = document.getElementById("realityFavoriteInput");
const realitySubmitBtn = document.getElementById("realitySubmitBtn");
const realityCheckList = document.getElementById("realityCheckList");

const saveMessage = document.getElementById("saveMessage");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
let currentProfile = null;
let customRealityChecks = [];
let editingRealityCheckId = null;

const DEFAULT_REALITY_CHECKS = [
  {
    title: "Nasen-Test",
    text: "Halte dir die Nase zu und versuche zu atmen. Wenn du trotzdem atmen kannst, träumst du vielleicht.",
    is_active: false,
    use_for_notifications: true,
    is_favorite: true
  },
  {
    title: "Hände prüfen",
    text: "Schau dir deine Hände genau an. Haben sie die richtige Anzahl Finger? Sieht etwas seltsam aus?",
    is_active: true,
    use_for_notifications: true,
    is_favorite: false
  },
  {
    title: "Umgebung hinterfragen",
    text: "Frage dich bewusst: Wie bin ich hierher gekommen? Was habe ich vor 10 Minuten gemacht?",
    is_active: false,
    use_for_notifications: true,
    is_favorite: false
  },

 
];

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

async function loadCustomRealityChecks() {
  const { data, error } = await lucidSupabase
    .from("custom_reality_checks")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Reality Checks konnten nicht geladen werden:", error);
    showMessage("Reality Checks konnten nicht geladen werden.");
    return;
  }

  customRealityChecks = data || [];
  renderCustomRealityChecks();
}

async function createDefaultRealityChecksIfNeeded() {
  const existingTitles = customRealityChecks.map((check) =>
    check.title.toLowerCase().trim()
  );

  const missingDefaultChecks = DEFAULT_REALITY_CHECKS.filter((check) => {
    return !existingTitles.includes(check.title.toLowerCase().trim());
  });

  if (missingDefaultChecks.length === 0) return;

  const alreadyHasFavorite = customRealityChecks.some((check) => {
    return check.is_favorite === true;
  });

  const checksToInsert = missingDefaultChecks.map((check) => {
    return {
      user_id: currentUser.id,
      title: check.title,
      text: check.text,
      is_active: check.is_active,
      use_for_notifications: check.use_for_notifications,
      is_favorite: alreadyHasFavorite ? false : check.is_favorite
    };
  });

  const { error } = await lucidSupabase
    .from("custom_reality_checks")
    .insert(checksToInsert);

  if (error) {
    console.error("Standard-Reality-Checks konnten nicht erstellt werden:", error);
    showMessage("Standard-Reality-Checks konnten nicht erstellt werden.");
    return;
  }

  await loadCustomRealityChecks();
}

function renderCustomRealityChecks() {
  realityCheckList.innerHTML = "";

  if (customRealityChecks.length === 0) {
    realityCheckList.innerHTML = `
      <p class="empty-state">Noch keine Reality Checks erstellt.</p>
    `;
    return;
  }

  customRealityChecks.forEach((check) => {
    const item = document.createElement("article");
    item.classList.add("reality-item");

    item.innerHTML = `
      <div class="reality-item-top">
        <div class="reality-main">
          <h3>${check.title}</h3>
          <p>${check.text}</p>

          <div class="reality-badges">
            <span class="reality-badge ${check.is_active ? "active" : ""}">
              ${check.is_active ? "Aktiv" : "Inaktiv"}
            </span>

            <span class="reality-badge ${check.use_for_notifications ? "active" : ""}">
              ${check.use_for_notifications ? "Benachrichtigungen" : "Keine Benachrichtigung"}
            </span>

            <span class="reality-badge ${check.is_favorite ? "active" : ""}">
              ${check.is_favorite ? "Favorit" : "Kein Favorit"}
            </span>
          </div>
        </div>

        <div class="reality-menu-wrapper">
          <button type="button" class="dots-btn" onclick="toggleRealityMenu('${check.id}')">
            ⋮
          </button>

          <div class="reality-card-menu hidden" id="reality-menu-${check.id}">
            <button type="button" onclick="openEditRealityModal('${check.id}')">
              Bearbeiten
            </button>

            <button type="button" class="danger" onclick="deleteRealityCheck('${check.id}')">
              Löschen
            </button>
          </div>
        </div>
      </div>
    `;

    realityCheckList.appendChild(item);
  });
}

function closeAllRealityMenus() {
  document.querySelectorAll(".reality-card-menu").forEach((menu) => {
    menu.classList.add("hidden");
  });
}

function toggleRealityMenu(checkId) {
  const menu = document.getElementById(`reality-menu-${checkId}`);

  if (!menu) return;

  const isHidden = menu.classList.contains("hidden");

  closeAllRealityMenus();

  if (isHidden) {
    menu.classList.remove("hidden");
  }
}

function openCreateRealityModal() {
  editingRealityCheckId = null;

  realityModalTitle.textContent = "Reality Check erstellen";
  realitySubmitBtn.textContent = "Reality Check speichern";

  realityCheckForm.reset();
  realityActiveInput.checked = true;
  realityNotificationInput.checked = true;
  realityFavoriteInput.checked = false;

  realityModalOverlay.classList.remove("hidden");
}

function openEditRealityModal(checkId) {
  const check = customRealityChecks.find((item) => item.id === checkId);

  if (!check) return;

  editingRealityCheckId = check.id;

  realityModalTitle.textContent = "Reality Check bearbeiten";
  realitySubmitBtn.textContent = "Änderungen speichern";

  realityTitleInput.value = check.title || "";
  realityTextInput.value = check.text || "";
  realityActiveInput.checked = check.is_active;
  realityNotificationInput.checked = check.use_for_notifications;
  realityFavoriteInput.checked = check.is_favorite;

  closeAllRealityMenus();
  realityModalOverlay.classList.remove("hidden");
}

function closeRealityModal() {
  realityModalOverlay.classList.add("hidden");
  editingRealityCheckId = null;
  realityCheckForm.reset();
}

async function deleteRealityCheck(checkId) {
  const confirmDelete = confirm("Möchtest du diesen Reality Check wirklich löschen?");

  if (!confirmDelete) return;

  const { error } = await lucidSupabase
    .from("custom_reality_checks")
    .delete()
    .eq("id", checkId)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Reality Check konnte nicht gelöscht werden:", error);
    showMessage("Reality Check konnte nicht gelöscht werden.");
    return;
  }

  showMessage("Reality Check gelöscht.");
  await loadCustomRealityChecks();
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

realityCheckForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const title = realityTitleInput.value.trim();
  const text = realityTextInput.value.trim();
  const wantsFavorite = realityFavoriteInput.checked;

  if (!title || !text) {
    showMessage("Bitte Titel und Anweisung ausfüllen.");
    return;
  }

  if (wantsFavorite) {
    const { error: favoriteResetError } = await lucidSupabase
      .from("custom_reality_checks")
      .update({
        is_favorite: false
      })
      .eq("user_id", currentUser.id);

    if (favoriteResetError) {
      console.error("Favoriten konnten nicht zurückgesetzt werden:", favoriteResetError);
      showMessage("Favorit konnte nicht gesetzt werden.");
      return;
    }
  }

  const checkData = {
    user_id: currentUser.id,
    title: title,
    text: text,
    is_active: realityActiveInput.checked,
    use_for_notifications: realityNotificationInput.checked,
    is_favorite: wantsFavorite
  };

  let error;

  if (editingRealityCheckId) {
    const response = await lucidSupabase
      .from("custom_reality_checks")
      .update(checkData)
      .eq("id", editingRealityCheckId)
      .eq("user_id", currentUser.id);

    error = response.error;
  } else {
    const response = await lucidSupabase
      .from("custom_reality_checks")
      .insert(checkData);

    error = response.error;
  }

  if (error) {
    console.error("Reality Check konnte nicht gespeichert werden:", error);
    showMessage("Reality Check konnte nicht gespeichert werden.");
    return;
  }

  showMessage("Reality Check gespeichert.");
  closeRealityModal();
  await loadCustomRealityChecks();
});

openRealityModalBtn.addEventListener("click", openCreateRealityModal);
closeRealityModalBtn.addEventListener("click", closeRealityModal);

realityModalOverlay.addEventListener("click", (event) => {
  if (event.target === realityModalOverlay) {
    closeRealityModal();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".reality-menu-wrapper")) {
    closeAllRealityMenus();
  }
});

logoutBtn.addEventListener("click", async () => {
  await lucidSupabase.auth.signOut();
  window.location.href = "./index.html";
});

async function initProfile() {
  await loadProfile();

  if (!currentUser) return;

  await loadCustomRealityChecks();
  await createDefaultRealityChecksIfNeeded();
}

initProfile();