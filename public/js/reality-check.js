const completeCheckBtn = document.getElementById("completeCheckBtn");
const checksDone = document.getElementById("checksDone");
const checksGoal = document.getElementById("checksGoal");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const realityCheckList = document.getElementById("realityCheckList");
const notificationPreviewText = document.getElementById("notificationPreviewText");

let currentUser = null;
let currentProfile = null;
let activeRealityChecks = [];
let hasCompletedCheckThisVisit = false;

async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

async function loadProfileFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Profil konnte nicht geladen werden:", error);
    return {
      reality_goal: 8
    };
  }

  return data;
}

async function loadActiveRealityChecks() {
  const { data, error } = await lucidSupabase
    .from("custom_reality_checks")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Reality Checks konnten nicht geladen werden:", error);
    activeRealityChecks = [];
    return;
  }

  activeRealityChecks = data || [];
}

function renderRealityChecks() {
  realityCheckList.innerHTML = "";

  if (activeRealityChecks.length === 0) {
    realityCheckList.innerHTML = `
      <p class="empty-state">
        Keine aktiven Reality Checks vorhanden. Du kannst sie im Profil erstellen oder aktivieren.
      </p>
    `;

    if (notificationPreviewText) {
      notificationPreviewText.textContent = "Bist du gerade wirklich wach?";
    }

    return;
  }

  activeRealityChecks.forEach((check, index) => {
    const item = document.createElement("div");
    item.classList.add("question-item");

    item.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")}</span>
      <p>${check.text}</p>
    `;

    realityCheckList.appendChild(item);
  });

  const notificationChecks = activeRealityChecks.filter((check) => {
    return check.use_for_notifications;
  });

  const previewCheck = notificationChecks[0] || activeRealityChecks[0];

  if (notificationPreviewText && previewCheck) {
    notificationPreviewText.textContent = previewCheck.text;
  }
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

async function getTodayChecks() {
  const { start, end } = getTodayRange();

  const { count, error } = await lucidSupabase
    .from("reality_checks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .gte("checked_at", start)
    .lte("checked_at", end);

  if (error) {
    console.error("Reality Checks konnten nicht geladen werden:", error);
    return 0;
  }

  return count || 0;
}

async function saveRealityCheck() {
  const notificationChecks = activeRealityChecks.filter((check) => {
    return check.use_for_notifications;
  });

  const selectedCheck = notificationChecks[0] || activeRealityChecks[0] || null;

  const { error } = await lucidSupabase
    .from("reality_checks")
    .insert({
      user_id: currentUser.id,
      note: selectedCheck
        ? `${selectedCheck.title}: ${selectedCheck.text}`
        : "Reality Check abgeschlossen"
    });

  if (error) {
    console.error("Reality Check konnte nicht gespeichert werden:", error);
    alert("Reality Check konnte nicht gespeichert werden.");
    return false;
  }

  return true;
}

async function updateProgress() {
  const goal = Number(currentProfile.reality_goal) || 8;
  const done = await getTodayChecks();

  checksGoal.textContent = goal;
  checksDone.textContent = done;

  const percentage = Math.min((done / goal) * 100, 100);
  progressFill.style.width = `${percentage}%`;

  if (done === 0) {
    progressText.textContent = "Noch kein Reality Check abgeschlossen.";
  } else if (done < goal) {
    progressText.textContent = `Du hast heute ${done} von ${goal} Reality Checks abgeschlossen.`;
  } else {
    progressText.textContent = "Tagesziel erreicht. Sehr stark.";
  }

  if (done >= goal) {
    completeCheckBtn.classList.add("done");
    completeCheckBtn.textContent = "Tagesziel erreicht";
    completeCheckBtn.disabled = true;
    return;
  }

  if (hasCompletedCheckThisVisit) {
    completeCheckBtn.classList.add("done");
    completeCheckBtn.textContent = "Für diesen Besuch abgeschlossen";
    completeCheckBtn.disabled = true;
    return;
  }

  completeCheckBtn.classList.remove("done");
  completeCheckBtn.textContent = "Reality Check abgeschlossen";
  completeCheckBtn.disabled = false;
}

completeCheckBtn.addEventListener("click", async () => {
  if (hasCompletedCheckThisVisit) return;

  const goal = Number(currentProfile.reality_goal) || 8;
  const done = await getTodayChecks();

  if (done >= goal) return;

  const saved = await saveRealityCheck();

  if (saved) {
    hasCompletedCheckThisVisit = true;
    await updateProgress();
  }
});

async function initRealityCheck() {
  currentUser = await protectPage();

  if (!currentUser) return;

  currentProfile = await loadProfileFromSupabase();

  await loadActiveRealityChecks();
  renderRealityChecks();
  await updateProgress();
}

initRealityCheck();