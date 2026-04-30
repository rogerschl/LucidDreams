async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

const dashboardGreeting = document.getElementById("dashboardGreeting");
const profileName = document.getElementById("profileName");
const profileInitial = document.getElementById("profileInitial");

const totalDreams = document.getElementById("totalDreams");
const lucidDreams = document.getElementById("lucidDreams");
const realityProgress = document.getElementById("realityProgress");
const weeklyDreamProgress = document.getElementById("weeklyDreamProgress");
const recentDreamList = document.getElementById("recentDreamList");
const personalGoal = document.getElementById("personalGoal");

const dashboardCoursePercent = document.getElementById("dashboardCoursePercent");
const dashboardCourseProgress = document.getElementById("dashboardCourseProgress");
const dashboardNextLessonNumber = document.getElementById("dashboardNextLessonNumber");
const dashboardNextLessonTitle = document.getElementById("dashboardNextLessonTitle");
const dashboardNextLessonText = document.getElementById("dashboardNextLessonText");

const app = document.querySelector(".app");
const sidebarToggle = document.getElementById("sidebarToggle");

let currentUser = null;
let currentProfile = null;
let dreams = [];

async function loadProfileFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Profil konnte nicht geladen werden:", error);

    return {
      display_name: "User",
      email: currentUser.email,
      reality_goal: 8,
      dream_goal: 5,
      personal_goal: "Ich möchte bewusster träumen und meine Traumzeichen erkennen."
    };
  }

  return data;
}

async function loadDreamsFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("dreams")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("archived", false)
    .order("dream_date", { ascending: false });

  if (error) {
    console.error("Träume konnten nicht geladen werden:", error);
    return [];
  }

  return data || [];
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

async function getTodayRealityChecks() {
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
  return dreams.filter((dream) => {
    return isDateInCurrentWeek(dream.dream_date);
  }).length;
}

function updateProfile() {
  const name = currentProfile.display_name || "User";

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
      currentProfile.personal_goal ||
      "Ich möchte bewusster träumen und meine Traumzeichen erkennen.";
  }
}

function updateDreamStats() {
  const lucidCount = dreams.filter((dream) => {
    return dream.is_lucid === true || dream.dream_type === "Luzider Traum";
  }).length;

  const weeklyDreams = getWeeklyDreamCount();
  const weeklyDreamGoal = Number(currentProfile.dream_goal) || 5;

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

async function updateRealityStats() {
  const doneToday = await getTodayRealityChecks();
  const dailyGoal = Number(currentProfile.reality_goal) || 8;

  if (realityProgress) {
    realityProgress.textContent = `${doneToday}/${dailyGoal}`;
  }
}

function renderRecentDreams() {
  if (!recentDreamList) return;

  recentDreamList.innerHTML = "";

  if (dreams.length === 0) {
    recentDreamList.innerHTML = `
      <p class="empty-state">Noch keine Träume gespeichert.</p>
    `;
    return;
  }

  dreams.slice(0, 3).forEach((dream) => {
    const dreamItem = document.createElement("div");
    dreamItem.classList.add("dream-item");

    if (dream.is_lucid === true || dream.dream_type === "Luzider Traum") {
      dreamItem.classList.add("lucid");
    }

    dreamItem.innerHTML = `
      <h3>${dream.title || "Ohne Titel"}</h3>
      <p>${dream.dream_type || "Normaler Traum"} · ${dream.mood || "Neutral"} · ${dream.dream_date || "Kein Datum"}</p>
    `;

    recentDreamList.appendChild(dreamItem);
  });
}

function updateCourseDashboard() {
  if (dashboardCoursePercent) {
    dashboardCoursePercent.textContent = "0%";
  }

  if (dashboardCourseProgress) {
    dashboardCourseProgress.style.width = "0%";
  }

  if (dashboardNextLessonNumber) {
    dashboardNextLessonNumber.textContent = "—";
  }

  if (dashboardNextLessonTitle) {
    dashboardNextLessonTitle.textContent = "Noch keine Lektion geladen";
  }

  if (dashboardNextLessonText) {
    dashboardNextLessonText.textContent =
      "Die Kursinhalte werden später über den Adminbereich erstellt.";
  }
}

if (sidebarToggle && app) {
  sidebarToggle.addEventListener("click", () => {
    app.classList.toggle("sidebar-collapsed");
  });
}

async function initDashboard() {
  currentUser = await protectPage();

  if (!currentUser) return;

  currentProfile = await loadProfileFromSupabase();
  dreams = await loadDreamsFromSupabase();

  updateProfile();
  updateDreamStats();
  await updateRealityStats();
  renderRecentDreams();
  updateCourseDashboard();
}

initDashboard();