const completeCheckBtn = document.getElementById("completeCheckBtn");
const checksDone = document.getElementById("checksDone");
const checksGoal = document.getElementById("checksGoal");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

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
  const { error } = await lucidSupabase
    .from("reality_checks")
    .insert({
      user_id: currentUser.id,
      note: "Reality Check abgeschlossen"
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
  } else {
    completeCheckBtn.classList.remove("done");
    completeCheckBtn.textContent = "Reality Check abgeschlossen";
  }
}

completeCheckBtn.addEventListener("click", async () => {
  const goal = Number(currentProfile.reality_goal) || 8;
  const done = await getTodayChecks();

  if (done >= goal) return;

  const saved = await saveRealityCheck();

  if (saved) {
    await updateProgress();
  }
});

async function initRealityCheck() {
  currentUser = await protectPage();

  if (!currentUser) return;

  currentProfile = await loadProfileFromSupabase();

  await updateProgress();
}

initRealityCheck();