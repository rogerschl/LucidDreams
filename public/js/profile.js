const profileForm = document.getElementById("profileForm");
const goalsForm = document.getElementById("goalsForm");

const nameInput = document.getElementById("nameInput");
const currentEmailText = document.getElementById("currentEmailText");

const realityGoalInput = document.getElementById("realityGoalInput");
const dreamGoalInput = document.getElementById("dreamGoalInput");

const realityGoalValue = document.getElementById("realityGoalValue");
const dreamGoalValue = document.getElementById("dreamGoalValue");

const realityGoalText = document.getElementById("realityGoalText");
const dreamGoalText = document.getElementById("dreamGoalText");

const goalToggleButtons = document.querySelectorAll("[data-goal-toggle]");

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

const deleteRealityModalOverlay = document.getElementById("deleteRealityModalOverlay");
const closeDeleteRealityModalBtn = document.getElementById("closeDeleteRealityModalBtn");
const cancelDeleteRealityBtn = document.getElementById("cancelDeleteRealityBtn");
const confirmDeleteRealityBtn = document.getElementById("confirmDeleteRealityBtn");

const openPasswordModalBtn = document.getElementById("openPasswordModalBtn");
const closePasswordModalBtn = document.getElementById("closePasswordModalBtn");
const passwordModalOverlay = document.getElementById("passwordModalOverlay");
const passwordChangeForm = document.getElementById("passwordChangeForm");
const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmNewPasswordInput = document.getElementById("confirmNewPasswordInput");
const passwordModalMessage = document.getElementById("passwordModalMessage");

const goalSaveMessage = document.getElementById("goalSaveMessage");
const profileSaveMessage = document.getElementById("profileSaveMessage");
const saveMessage = document.getElementById("saveMessage");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
let currentProfile = null;
let customRealityChecks = [];
let editingRealityCheckId = null;
let deletingRealityCheckId = null;

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
  }
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
  saveMessage.classList.add("show");

  setTimeout(() => {
    saveMessage.textContent = "";
    saveMessage.classList.remove("show");
  }, 2500);
}

function showInlineMessage(element, text, isError = false) {
  if (!element) return;

  element.textContent = text;
  element.classList.add("show");

  if (isError) {
    element.classList.add("error");
  } else {
    element.classList.remove("error");
  }

  setTimeout(() => {
    element.classList.remove("show");
    element.classList.remove("error");
    element.textContent = "";
  }, 3000);
}

function showModalMessage(element, text, isError = false) {
  if (!element) return;

  element.textContent = text;
  element.classList.add("show");

  if (isError) {
    element.classList.add("error");
  } else {
    element.classList.remove("error");
  }
}

function clearModalMessage(element) {
  if (!element) return;

  element.textContent = "";
  element.classList.remove("show");
  element.classList.remove("error");
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateSliderFill(input) {
  if (!input) return;

  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);

  const percentage = ((value - min) / (max - min)) * 100;

  input.style.setProperty("--slider-progress", `${percentage}%`);
}

function updateGoalSliderUI() {
  const realityValue = Number(realityGoalInput.value) || 8;
  const dreamValue = Math.min(Number(dreamGoalInput.value) || 5, 7);

  dreamGoalInput.value = dreamValue;

  realityGoalValue.textContent = realityValue;
  dreamGoalValue.textContent = dreamValue;

  realityGoalText.textContent =
    realityValue === 1
      ? "1 Reality Check pro Tag"
      : `${realityValue} Reality Checks pro Tag`;

  dreamGoalText.textContent =
    dreamValue === 1
      ? "1 Traumeintrag pro Woche"
      : `${dreamValue} Traumeinträge pro Woche`;

  updateSliderFill(realityGoalInput);
  updateSliderFill(dreamGoalInput);
}

function initGoalSliders() {
  realityGoalInput.addEventListener("input", updateGoalSliderUI);
  dreamGoalInput.addEventListener("input", updateGoalSliderUI);

  goalToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const cardId = button.dataset.goalToggle;
      const card = document.getElementById(cardId);

      if (!card) return;

      card.classList.toggle("open");
    });
  });

  updateGoalSliderUI();
}

async function syncProfileEmailWithAuth(authEmail) {
  if (!authEmail || !currentProfile) return;

  if (currentProfile.email === authEmail) return;

  const { error } = await lucidSupabase
    .from("profiles")
    .update({
      email: authEmail
    })
    .eq("id", currentUser.id);

  if (!error) {
    currentProfile.email = authEmail;
  }
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

  await syncProfileEmailWithAuth(currentUser.email);

  nameInput.value = currentProfile.display_name || "";
  currentEmailText.textContent = currentUser.email || currentProfile.email || "Keine E-Mail gefunden";

  realityGoalInput.value = Number(currentProfile.reality_goal) || 8;
  dreamGoalInput.value = Math.min(Number(currentProfile.dream_goal) || 5, 7);

  updateGoalSliderUI();
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
  const existingTitles = customRealityChecks.map((check) => {
    return check.title.toLowerCase().trim();
  });

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

    if (check.is_favorite) {
      item.classList.add("favorite-reality-item");
    }

    item.innerHTML = `
      <div class="reality-item-top">
        <div class="reality-main">
          <h3>${escapeHTML(check.title)}</h3>
          <p>${escapeHTML(check.text)}</p>

          <div class="reality-badges">
            <span class="reality-badge ${check.is_active ? "active" : ""}">
              ${check.is_active ? "Aktiv" : "Inaktiv"}
            </span>

            <span class="reality-badge ${check.use_for_notifications ? "active" : ""}">
              ${check.use_for_notifications ? "Benachrichtigungen" : "Keine Benachrichtigung"}
            </span>

            <span class="reality-badge ${check.is_favorite ? "favorite" : ""}">
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
  const check = customRealityChecks.find((item) => {
    return item.id === checkId;
  });

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

function deleteRealityCheck(checkId) {
  deletingRealityCheckId = checkId;
  closeAllRealityMenus();
  deleteRealityModalOverlay.classList.remove("hidden");
}

function closeDeleteRealityModal() {
  deletingRealityCheckId = null;
  deleteRealityModalOverlay.classList.add("hidden");
}

async function confirmDeleteRealityCheck() {
  if (!deletingRealityCheckId || !currentUser) return;

  const { error } = await lucidSupabase
    .from("custom_reality_checks")
    .delete()
    .eq("id", deletingRealityCheckId)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Reality Check konnte nicht gelöscht werden:", error);
    showMessage("Reality Check konnte nicht gelöscht werden.");
    return;
  }

  showMessage("Reality Check gelöscht.");
  closeDeleteRealityModal();
  await loadCustomRealityChecks();
}

function openPasswordModal() {
  passwordChangeForm.reset();
  clearModalMessage(passwordModalMessage);
  passwordModalOverlay.classList.remove("hidden");
}

function closePasswordModal() {
  passwordModalOverlay.classList.add("hidden");
  passwordChangeForm.reset();
  clearModalMessage(passwordModalMessage);
}

async function verifyCurrentPassword(password) {
  if (!currentUser || !currentUser.email) {
    return false;
  }

  const { error } = await lucidSupabase.auth.signInWithPassword({
    email: currentUser.email,
    password: password
  });

  return !error;
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const displayName = nameInput.value.trim() || "User";

  const { error } = await lucidSupabase
    .from("profiles")
    .update({
      display_name: displayName,
      email: currentUser.email
    })
    .eq("id", currentUser.id);

  if (error) {
    console.error("Profil konnte nicht gespeichert werden:", error);
    showInlineMessage(profileSaveMessage, "Profil konnte nicht gespeichert werden.", true);
    return;
  }

  if (currentProfile) {
    currentProfile.display_name = displayName;
    currentProfile.email = currentUser.email;
  }

  showInlineMessage(profileSaveMessage, "Profil gespeichert.");
});

goalsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const realityGoal = Number(realityGoalInput.value) || 8;
  const dreamGoal = Math.min(Number(dreamGoalInput.value) || 5, 7);

  const { error } = await lucidSupabase
    .from("profiles")
    .update({
      reality_goal: realityGoal,
      dream_goal: dreamGoal
    })
    .eq("id", currentUser.id);

  if (error) {
    console.error("Ziele konnten nicht gespeichert werden:", error);
    showInlineMessage(goalSaveMessage, "Ziele konnten nicht gespeichert werden.", true);
    return;
  }

  dreamGoalInput.value = dreamGoal;
  updateGoalSliderUI();

  showInlineMessage(goalSaveMessage, "Ziele gespeichert.");
});

passwordChangeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmNewPassword = confirmNewPasswordInput.value.trim();

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showModalMessage(passwordModalMessage, "Bitte alle Felder ausfüllen.", true);
    return;
  }

  if (newPassword.length < 6) {
    showModalMessage(passwordModalMessage, "Das neue Passwort muss mindestens 6 Zeichen lang sein.", true);
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showModalMessage(passwordModalMessage, "Die neuen Passwörter stimmen nicht überein.", true);
    return;
  }

  if (currentPassword === newPassword) {
    showModalMessage(passwordModalMessage, "Das neue Passwort darf nicht identisch mit dem alten sein.", true);
    return;
  }

  showModalMessage(passwordModalMessage, "Aktuelles Passwort wird geprüft...");

  const passwordIsCorrect = await verifyCurrentPassword(currentPassword);

  if (!passwordIsCorrect) {
    showModalMessage(passwordModalMessage, "Aktuelles Passwort ist falsch.", true);
    return;
  }

  showModalMessage(passwordModalMessage, "Passwort wird geändert...");

  const { error } = await lucidSupabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error("Passwort konnte nicht geändert werden:", error);
    showModalMessage(passwordModalMessage, "Passwort konnte nicht geändert werden.", true);
    return;
  }

  showModalMessage(passwordModalMessage, "Passwort erfolgreich geändert.");

  setTimeout(() => {
    closePasswordModal();
  }, 1800);
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
      .insert({
        user_id: currentUser.id,
        ...checkData
      });

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

closeDeleteRealityModalBtn.addEventListener("click", closeDeleteRealityModal);
cancelDeleteRealityBtn.addEventListener("click", closeDeleteRealityModal);
confirmDeleteRealityBtn.addEventListener("click", confirmDeleteRealityCheck);

deleteRealityModalOverlay.addEventListener("click", (event) => {
  if (event.target === deleteRealityModalOverlay) {
    closeDeleteRealityModal();
  }
});

openPasswordModalBtn.addEventListener("click", openPasswordModal);
closePasswordModalBtn.addEventListener("click", closePasswordModal);

passwordModalOverlay.addEventListener("click", (event) => {
  if (event.target === passwordModalOverlay) {
    closePasswordModal();
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
  initGoalSliders();

  await loadProfile();

  if (!currentUser) return;

  await loadCustomRealityChecks();
  await createDefaultRealityChecksIfNeeded();
}

initProfile();