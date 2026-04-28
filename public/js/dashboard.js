const dashboardGreeting = document.getElementById("dashboardGreeting");
const profileName = document.getElementById("profileName");
const profileInitial = document.getElementById("profileInitial");

const totalDreams = document.getElementById("totalDreams");
const lucidDreams = document.getElementById("lucidDreams");
const realityProgress = document.getElementById("realityProgress");
const weeklyDreamProgress = document.getElementById("weeklyDreamProgress");
const recentDreamList = document.getElementById("recentDreamList");
const personalGoal = document.getElementById("personalGoal");

function getProfile() {
  return JSON.parse(localStorage.getItem("profile")) || {
    name: "Roger",
    email: "",
    password: "",
    realityGoal: 8,
    dreamGoal: 5,
    personalGoal: "Ich möchte bewusster träumen und meine Traumzeichen erkennen."
  };
}

function getDreams() {
  return JSON.parse(localStorage.getItem("dreams")) || [];
}

function getTodayKey() {
  const today = new Date().toISOString().split("T")[0];
  return `realityChecks_${today}`;
}

function getTodayRealityChecks() {
  return Number(localStorage.getItem(getTodayKey())) || 0;
}

function getStartOfWeek(date) {
  const currentDate = new Date(date);
  const day = currentDate.getDay();

  const diffToMonday = day === 0 ? -6 : 1 - day;

  currentDate.setDate(currentDate.getDate() + diffToMonday);
  currentDate.setHours(0, 0, 0, 0);

  return currentDate;
}

function getEndOfWeek(date) {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);

  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return endOfWeek;
}

function isDateInCurrentWeek(dateString) {
  if (!dateString) return false;

  const dreamDate = new Date(dateString);
  const now = new Date();

  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);

  return dreamDate >= startOfWeek && dreamDate <= endOfWeek;
}

function getWeeklyDreamCount() {
  const dreams = getDreams();

  return dreams.filter((dream) => {
    return isDateInCurrentWeek(dream.date);
  }).length;
}

function updateProfile() {
  const profile = getProfile();
  const name = profile.name || "Roger";

  if (dashboardGreeting) {
    dashboardGreeting.innerHTML = `
      Hallo <span id="dashboardNameHighlight">${name}</span>! Hast du dich heute schon an einen Traum erinnert?
    `;
  }

  if (profileName) {
    profileName.textContent = name;
  }

  if (profileInitial) {
    profileInitial.textContent = name.charAt(0).toUpperCase();
  }

  if (personalGoal) {
    personalGoal.textContent =
      profile.personalGoal || "Ich möchte bewusster träumen und meine Traumzeichen erkennen.";
  }
}

function updateDreamStats() {
  const profile = getProfile();
  const dreams = getDreams();

  const lucidCount = dreams.filter((dream) => {
    return dream.clarity === "Luzid";
  }).length;

  const weeklyDreams = getWeeklyDreamCount();
  const weeklyDreamGoal = Number(profile.dreamGoal) || 5;

  if (totalDreams) {
    totalDreams.textContent = dreams.length;
  }

  if (lucidDreams) {
    lucidDreams.textContent = lucidCount;
  }

  if (weeklyDreamProgress) {
    weeklyDreamProgress.textContent = `${weeklyDreams}/${weeklyDreamGoal}`;
  }
}

function updateRealityStats() {
  const profile = getProfile();

  const doneToday = getTodayRealityChecks();
  const dailyGoal = Number(profile.realityGoal) || 8;

  if (realityProgress) {
    realityProgress.textContent = `${doneToday}/${dailyGoal}`;
  }
}

function renderRecentDreams() {
  const dreams = getDreams();

  if (!recentDreamList) return;

  recentDreamList.innerHTML = "";

  if (dreams.length === 0) {
    recentDreamList.innerHTML = `
      <p class="empty-state">Noch keine Träume gespeichert.</p>
    `;
    return;
  }

  dreams
    .slice()
    .reverse()
    .slice(0, 3)
    .forEach((dream) => {
      const dreamItem = document.createElement("div");
      dreamItem.classList.add("dream-item");

      if (dream.clarity === "Luzid") {
        dreamItem.classList.add("lucid");
      }

      dreamItem.innerHTML = `
        <h3>${dream.title || "Ohne Titel"}</h3>
        <p>${dream.clarity || "Normaler Traum"} · ${dream.mood || "Neutral"} · ${dream.date || "Kein Datum"}</p>
      `;

      recentDreamList.appendChild(dreamItem);
    });
}

updateProfile();
updateDreamStats();
updateRealityStats();
renderRecentDreams();