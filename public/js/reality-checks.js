const completeCheckBtn = document.getElementById("completeCheckBtn");
const checksDone = document.getElementById("checksDone");
const checksGoal = document.getElementById("checksGoal");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

function getProfile() {
  return JSON.parse(localStorage.getItem("profile")) || {
    name: "Roger",
    realityGoal: 8,
    dreamGoal: 5
  };
}

function getTodayKey() {
  const today = new Date().toISOString().split("T")[0];
  return `realityChecks_${today}`;
}

function getTodayChecks() {
  return Number(localStorage.getItem(getTodayKey())) || 0;
}

function saveTodayChecks(count) {
  localStorage.setItem(getTodayKey(), String(count));
}

function updateProgress() {
  const profile = getProfile();
  const goal = Number(profile.realityGoal) || 8;
  const done = getTodayChecks();

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

completeCheckBtn.addEventListener("click", () => {
  const profile = getProfile();
  const goal = Number(profile.realityGoal) || 8;
  const done = getTodayChecks();

  if (done >= goal) {
    return;
  }

  saveTodayChecks(done + 1);
  updateProgress();
});

updateProgress();