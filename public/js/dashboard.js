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

const dashboardCoursePercent = document.getElementById("dashboardCoursePercent");
const dashboardCourseProgress = document.getElementById("dashboardCourseProgress");
const dashboardNextLessonNumber = document.getElementById("dashboardNextLessonNumber");
const dashboardNextLessonTitle = document.getElementById("dashboardNextLessonTitle");
const dashboardNextLessonText = document.getElementById("dashboardNextLessonText");

const favoriteRealityCheck = document.getElementById("favoriteRealityCheck");
const dashboardDreamSigns = document.getElementById("dashboardDreamSigns");

const app = document.querySelector(".app");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");

let currentUser = null;
let currentProfile = null;
let dreams = [];

let courses = [];
let modules = [];
let lessons = [];
let completedLessonIds = [];

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
    .select(`
      *,
      dream_dream_signs (
        dream_signs (
          name
        )
      )
    `)
    .eq("user_id", currentUser.id)
    .eq("archived", false)
    .order("dream_date", { ascending: false });

  if (error) {
    console.error("Träume konnten nicht geladen werden:", error);
    return [];
  }

  return data || [];
}

async function loadCoursesFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Kurse konnten nicht geladen werden:", error);
    return [];
  }

  return data || [];
}

async function loadModulesFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("modules")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Module konnten nicht geladen werden:", error);
    return [];
  }

  return data || [];
}

async function loadLessonsFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("lessons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Lektionen konnten nicht geladen werden:", error);
    return [];
  }

  return data || [];
}

async function loadLessonProgressFromSupabase() {
  const { data, error } = await lucidSupabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", currentUser.id)
    .eq("completed", true);

  if (error) {
    console.error("Kursfortschritt konnte nicht geladen werden:", error);
    return [];
  }

  return (data || []).map((item) => item.lesson_id);
}

async function renderFavoriteRealityCheck() {
  if (!favoriteRealityCheck || !currentUser) return;

  const { data, error } = await lucidSupabase
    .from("custom_reality_checks")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("is_favorite", true)
    .maybeSingle();

  if (error) {
    console.error("Favorit-Reality-Check konnte nicht geladen werden:", error);
    favoriteRealityCheck.innerHTML = `
      <p class="empty-state">Favorit konnte nicht geladen werden.</p>
    `;
    return;
  }

  if (!data) {
    favoriteRealityCheck.innerHTML = `
      <p class="empty-state">Noch kein Favorit-Reality-Check ausgewählt.</p>
    `;
    return;
  }

  favoriteRealityCheck.innerHTML = `
    <span class="favorite-label">Favorit</span>
    <h3>${data.title}</h3>
    <p>${data.text}</p>
  `;
}

function renderDreamSigns() {
  if (!dashboardDreamSigns) return;

  const tagCounts = {};

  dreams.forEach((dream) => {
    const signs = dream.dream_dream_signs || [];

    signs.forEach((entry) => {
      const tag = entry.dream_signs?.name;

      if (!tag) return;

      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sortedTags.length === 0) {
    dashboardDreamSigns.innerHTML = `
      <p class="empty-state">Noch keine Traumzeichen vorhanden.</p>
    `;
    return;
  }

  dashboardDreamSigns.innerHTML = "";

  sortedTags.forEach(([tag, count]) => {
    const chip = document.createElement("span");
    chip.classList.add("dream-sign-chip");
    chip.textContent = `${tag} x${count}`;
    dashboardDreamSigns.appendChild(chip);
  });
}

function getMainCourse() {
  return courses[0] || null;
}

function getLessonsForCourse(courseId) {
  const courseModules = modules.filter((module) => {
    return module.course_id === courseId;
  });

  const moduleIds = courseModules.map((module) => module.id);

  return lessons.filter((lesson) => {
    return moduleIds.includes(lesson.module_id);
  });
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
  const course = getMainCourse();

  if (!course) {
    dashboardCoursePercent.textContent = "0%";
    dashboardCourseProgress.style.width = "0%";
    dashboardNextLessonNumber.textContent = "—";
    dashboardNextLessonTitle.textContent = "Noch kein Kurs vorhanden";
    dashboardNextLessonText.textContent =
      "Erstelle im Adminbereich zuerst einen Kurs.";
    return;
  }

  const courseLessons = getLessonsForCourse(course.id);

  if (courseLessons.length === 0) {
    dashboardCoursePercent.textContent = "0%";
    dashboardCourseProgress.style.width = "0%";
    dashboardNextLessonNumber.textContent = "—";
    dashboardNextLessonTitle.textContent = "Noch keine Lektion vorhanden";
    dashboardNextLessonText.textContent =
      "Füge im Adminbereich Lektionen zu deinem Kurs hinzu.";
    return;
  }

  const completedCount = courseLessons.filter((lesson) => {
    return completedLessonIds.includes(lesson.id);
  }).length;

  const totalCount = courseLessons.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const nextLesson =
    courseLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ||
    courseLessons[courseLessons.length - 1];

  const nextLessonIndex = courseLessons.findIndex((lesson) => {
    return lesson.id === nextLesson.id;
  });

  dashboardCoursePercent.textContent = `${percentage}%`;
  dashboardCourseProgress.style.width = `${percentage}%`;

  if (completedCount === totalCount) {
    dashboardNextLessonNumber.textContent = "✓";
    dashboardNextLessonTitle.textContent = "Kurs abgeschlossen";
    dashboardNextLessonText.textContent =
      "Du hast alle aktuellen Lektionen abgeschlossen.";
  } else {
    dashboardNextLessonNumber.textContent = String(nextLessonIndex + 1).padStart(2, "0");
    dashboardNextLessonTitle.textContent = nextLesson.title;
    dashboardNextLessonText.textContent = `Weiter mit: ${course.title}`;
  }
}

/* SIDEBAR EVENTS */

if (sidebarToggle && app) {
  sidebarToggle.addEventListener("click", () => {
    app.classList.toggle("sidebar-collapsed");
  });
}

if (mobileMenuBtn && app) {
  mobileMenuBtn.addEventListener("click", () => {
    app.classList.add("sidebar-collapsed");
  });
}

if (sidebarOverlay && app) {
  sidebarOverlay.addEventListener("click", () => {
    app.classList.remove("sidebar-collapsed");
  });
}

async function initDashboard() {
  currentUser = await protectPage();

  if (!currentUser) return;

  currentProfile = await loadProfileFromSupabase();
  dreams = await loadDreamsFromSupabase();

  courses = await loadCoursesFromSupabase();
  modules = await loadModulesFromSupabase();
  lessons = await loadLessonsFromSupabase();
  completedLessonIds = await loadLessonProgressFromSupabase();

  updateProfile();
  updateDreamStats();
  await updateRealityStats();
  renderRecentDreams();
  updateCourseDashboard();
  await renderFavoriteRealityCheck();
  renderDreamSigns();
}

initDashboard();