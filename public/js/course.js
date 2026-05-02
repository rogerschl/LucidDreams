const courseSelect = document.getElementById("courseSelect");
const lessonNav = document.getElementById("lessonNav");

const lessonTag = document.getElementById("lessonTag");
const lessonTitle = document.getElementById("lessonTitle");
const lessonContent = document.getElementById("lessonContent");
const lessonStatus = document.getElementById("lessonStatus");

const courseProgressText = document.getElementById("courseProgressText");
const courseProgressFill = document.getElementById("courseProgressFill");

const prevLessonBtn = document.getElementById("prevLessonBtn");
const completeLessonBtn = document.getElementById("completeLessonBtn");
const nextLessonBtn = document.getElementById("nextLessonBtn");

let currentUser = null;

let courses = [];
let modules = [];
let lessons = [];
let completedLessonIds = [];

let selectedCourseId = null;
let currentLessonIndex = 0;

async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

async function loadCourseData() {
  const { data: courseData, error: courseError } = await lucidSupabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (courseError) {
    console.error("Kurse konnten nicht geladen werden:", courseError);
    return;
  }

  const { data: moduleData, error: moduleError } = await lucidSupabase
    .from("modules")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (moduleError) {
    console.error("Module konnten nicht geladen werden:", moduleError);
    return;
  }

  const { data: lessonData, error: lessonError } = await lucidSupabase
    .from("lessons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (lessonError) {
    console.error("Lektionen konnten nicht geladen werden:", lessonError);
    return;
  }

  courses = courseData || [];
  modules = moduleData || [];
  lessons = lessonData || [];
}

async function loadProgress() {
  const { data, error } = await lucidSupabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", currentUser.id)
    .eq("completed", true);

  if (error) {
    console.error("Fortschritt konnte nicht geladen werden:", error);
    completedLessonIds = [];
    return;
  }

  completedLessonIds = (data || []).map((item) => item.lesson_id);
}

function renderCourseSelect() {
  courseSelect.innerHTML = "";

  if (courses.length === 0) {
    courseSelect.innerHTML = `<option value="">Keine Kurse vorhanden</option>`;
    return;
  }

  courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = course.title;
    courseSelect.appendChild(option);
  });

  selectedCourseId = courses[0].id;
  courseSelect.value = selectedCourseId;
}

function getModulesForSelectedCourse() {
  return modules.filter((module) => {
    return module.course_id === selectedCourseId;
  });
}

function getLessonsForModule(moduleId) {
  return lessons.filter((lesson) => {
    return lesson.module_id === moduleId;
  });
}

function getLessonsForSelectedCourse() {
  const courseModules = getModulesForSelectedCourse();
  const moduleIds = courseModules.map((module) => module.id);

  return lessons.filter((lesson) => {
    return moduleIds.includes(lesson.module_id);
  });
}

function isLessonCompleted(lessonId) {
  return completedLessonIds.includes(lessonId);
}

function renderLessonNav() {
  lessonNav.innerHTML = "";

  const courseModules = getModulesForSelectedCourse();

  if (courseModules.length === 0) {
    lessonNav.innerHTML = `<p class="empty-state">Dieser Kurs hat noch keine Module.</p>`;
    return;
  }

  courseModules.forEach((module, moduleIndex) => {
    const moduleElement = document.createElement("div");
    moduleElement.classList.add("lesson-module");

    const moduleLessons = getLessonsForModule(module.id);

    let lessonsHtml = "";

    if (moduleLessons.length === 0) {
      lessonsHtml = `<p class="empty-state">Keine Lektionen vorhanden.</p>`;
    } else {
      lessonsHtml = moduleLessons.map((lesson, lessonIndex) => {
        const globalIndex = getLessonsForSelectedCourse().findIndex((item) => item.id === lesson.id);
        const isDone = isLessonCompleted(lesson.id);

        return `
          <button class="lesson-link ${isDone ? "done" : ""}" data-lesson-index="${globalIndex}">
            <small>${moduleIndex + 1}.${lessonIndex + 1}</small>
            ${lesson.title}
          </button>
        `;
      }).join("");
    }

    moduleElement.innerHTML = `
      <button class="module-title" type="button">
        <span>${String(moduleIndex + 1).padStart(2, "0")}</span>
        ${module.title}
      </button>

      <div class="module-lessons">
        ${lessonsHtml}
      </div>
    `;

    lessonNav.appendChild(moduleElement);
  });

  document.querySelectorAll(".lesson-link").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.lessonIndex);
      renderLesson(index);
    });
  });
}

function updateProgress() {
  const courseLessons = getLessonsForSelectedCourse();

  const doneCount = courseLessons.filter((lesson) => {
    return completedLessonIds.includes(lesson.id);
  }).length;

  const totalCount = courseLessons.length;
  const percentage = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  courseProgressText.textContent = `${doneCount} / ${totalCount} erledigt`;
  courseProgressFill.style.width = `${percentage}%`;
}

function renderLesson(index) {
  const courseLessons = getLessonsForSelectedCourse();

  if (courseLessons.length === 0) {
    currentLessonIndex = 0;

    lessonTag.textContent = "Keine Lektion";
    lessonTitle.textContent = "Noch keine Lektionen vorhanden";
    lessonContent.innerHTML = `
      <p>Erstelle im Adminbereich zuerst Module und Lektionen für diesen Kurs.</p>
    `;

    lessonStatus.textContent = "Nicht erledigt";
    lessonStatus.classList.remove("done");

    completeLessonBtn.disabled = true;
    prevLessonBtn.disabled = true;
    nextLessonBtn.disabled = true;

    updateProgress();
    return;
  }

  currentLessonIndex = index;

  const lesson = courseLessons[index];
  const isDone = isLessonCompleted(lesson.id);

  lessonTag.textContent = `Lektion ${index + 1}`;
  lessonTitle.textContent = lesson.title;
  lessonContent.innerHTML = lesson.content;

  if (isDone) {
    lessonStatus.textContent = "Erledigt";
    lessonStatus.classList.add("done");
    completeLessonBtn.textContent = "Erledigt";
    completeLessonBtn.classList.add("done");
  } else {
    lessonStatus.textContent = "Nicht erledigt";
    lessonStatus.classList.remove("done");
    completeLessonBtn.textContent = "Als erledigt markieren";
    completeLessonBtn.classList.remove("done");
  }

  completeLessonBtn.disabled = false;
  prevLessonBtn.disabled = index === 0;
  nextLessonBtn.disabled = index === courseLessons.length - 1;

  document.querySelectorAll(".lesson-link").forEach((button) => {
    button.classList.remove("active");

    if (Number(button.dataset.lessonIndex) === index) {
      button.classList.add("active");
    }
  });

  updateProgress();
}

async function completeCurrentLesson() {
  const courseLessons = getLessonsForSelectedCourse();
  const lesson = courseLessons[currentLessonIndex];

  if (!lesson) return;

  const { error } = await lucidSupabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: currentUser.id,
        lesson_id: lesson.id,
        completed: true,
        completed_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,lesson_id"
      }
    );

  if (error) {
    console.error("Lektion konnte nicht abgeschlossen werden:", error);
    alert("Fortschritt konnte nicht gespeichert werden.");
    return;
  }

  if (!completedLessonIds.includes(lesson.id)) {
    completedLessonIds.push(lesson.id);
  }

  renderLessonNav();
  renderLesson(currentLessonIndex);
}

courseSelect.addEventListener("change", () => {
  selectedCourseId = courseSelect.value;
  currentLessonIndex = 0;

  renderLessonNav();
  renderLesson(0);
});

completeLessonBtn.addEventListener("click", completeCurrentLesson);

prevLessonBtn.addEventListener("click", () => {
  if (currentLessonIndex > 0) {
    renderLesson(currentLessonIndex - 1);
  }
});

nextLessonBtn.addEventListener("click", () => {
  const courseLessons = getLessonsForSelectedCourse();

  if (currentLessonIndex < courseLessons.length - 1) {
    renderLesson(currentLessonIndex + 1);
  }
});

async function initCourse() {
  currentUser = await protectPage();

  if (!currentUser) return;

  await loadCourseData();
  await loadProgress();

  renderCourseSelect();
  renderLessonNav();
  renderLesson(0);
}

initCourse();