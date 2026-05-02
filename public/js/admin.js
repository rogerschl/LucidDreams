const courseForm = document.getElementById("courseForm");
const moduleForm = document.getElementById("moduleForm");
const lessonForm = document.getElementById("lessonForm");

const courseTitle = document.getElementById("courseTitle");
const courseDescription = document.getElementById("courseDescription");
const courseOrder = document.getElementById("courseOrder");

const moduleCourse = document.getElementById("moduleCourse");
const moduleTitle = document.getElementById("moduleTitle");
const moduleOrder = document.getElementById("moduleOrder");

const lessonCourse = document.getElementById("lessonCourse");
const lessonModule = document.getElementById("lessonModule");
const lessonTitle = document.getElementById("lessonTitle");
const lessonOrder = document.getElementById("lessonOrder");
const lessonContent = document.getElementById("lessonContent");

const courseOverview = document.getElementById("courseOverview");
const saveMessage = document.getElementById("saveMessage");

let currentUser = null;
let currentProfile = null;
let courses = [];
let modules = [];
let lessons = [];

let editingCourseId = null;
let editingModuleId = null;
let editingLessonId = null;

async function protectAdminPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  currentUser = data.session.user;

  const { data: profile, error: profileError } = await lucidSupabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (profileError || !profile) {
    alert("Profil konnte nicht geladen werden.");
    window.location.href = "./dashboard.html";
    return null;
  }

  if (profile.role !== "admin") {
    alert("Kein Zugriff. Du bist kein Admin.");
    window.location.href = "./dashboard.html";
    return null;
  }

  currentProfile = profile;
  return profile;
}

function showMessage(text) {
  saveMessage.textContent = text;

  setTimeout(() => {
    saveMessage.textContent = "";
  }, 2500);
}

async function loadData() {
  const { data: courseData, error: courseError } = await lucidSupabase
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });

  if (courseError) {
    console.error(courseError);
    showMessage("Kurse konnten nicht geladen werden.");
    return;
  }

  const { data: moduleData, error: moduleError } = await lucidSupabase
    .from("modules")
    .select("*")
    .order("sort_order", { ascending: true });

  if (moduleError) {
    console.error(moduleError);
    showMessage("Module konnten nicht geladen werden.");
    return;
  }

  const { data: lessonData, error: lessonError } = await lucidSupabase
    .from("lessons")
    .select("*")
    .order("sort_order", { ascending: true });

  if (lessonError) {
    console.error(lessonError);
    showMessage("Lektionen konnten nicht geladen werden.");
    return;
  }

  courses = courseData || [];
  modules = moduleData || [];
  lessons = lessonData || [];

  renderCourseSelects();
  renderModuleSelect();
  renderOverview();
}

function renderCourseSelects() {
  moduleCourse.innerHTML = `<option value="">Bitte Kurs auswählen</option>`;
  lessonCourse.innerHTML = `<option value="">Bitte Kurs auswählen</option>`;

  courses.forEach((course) => {
    const option1 = document.createElement("option");
    option1.value = course.id;
    option1.textContent = course.title;
    moduleCourse.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = course.id;
    option2.textContent = course.title;
    lessonCourse.appendChild(option2);
  });
}

function renderModuleSelect() {
  const selectedCourseId = lessonCourse.value;

  lessonModule.innerHTML = `<option value="">Bitte Modul auswählen</option>`;

  const filteredModules = modules.filter((module) => {
    return module.course_id === selectedCourseId;
  });

  filteredModules.forEach((module) => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = module.title;
    lessonModule.appendChild(option);
  });
}

function renderOverview() {
  courseOverview.innerHTML = "";

  if (courses.length === 0) {
    courseOverview.innerHTML = `<p class="empty-state">Noch keine Kurse vorhanden.</p>`;
    return;
  }

  courses.forEach((course) => {
    const courseElement = document.createElement("article");
    courseElement.classList.add("overview-course");

    const courseModules = modules.filter((module) => module.course_id === course.id);

    let modulesHtml = "";

    courseModules.forEach((module) => {
      const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);

      const lessonsHtml = moduleLessons.length === 0
        ? `<div class="overview-lesson">Keine Lektionen vorhanden</div>`
        : moduleLessons.map((lesson) => {
            return `
              <div class="overview-lesson">
                <span>${lesson.sort_order}. ${lesson.title}</span>

                <div class="lesson-actions-small">
                  <button type="button" onclick="editLesson('${lesson.id}')">
                    Bearbeiten
                  </button>

                  <button type="button" class="danger" onclick="deleteLesson('${lesson.id}')">
                    Löschen
                  </button>
                </div>
              </div>
            `;
          }).join("");

      modulesHtml += `
        <div class="overview-module">
          <div class="overview-row">
            <h4>${module.sort_order}. ${module.title}</h4>

            <div class="lesson-actions-small">
              <button type="button" onclick="editModule('${module.id}')">
                Bearbeiten
              </button>

              <button type="button" class="danger" onclick="deleteModule('${module.id}')">
                Löschen
              </button>
            </div>
          </div>

          ${lessonsHtml}
        </div>
      `;
    });

    courseElement.innerHTML = `
      <div class="overview-row">
        <div>
          <h3>${course.sort_order}. ${course.title}</h3>
          <p>${course.description || "Keine Beschreibung"}</p>
        </div>

        <div class="lesson-actions-small">
          <button type="button" onclick="editCourse('${course.id}')">
            Bearbeiten
          </button>

          <button type="button" class="danger" onclick="deleteCourse('${course.id}')">
            Löschen
          </button>
        </div>
      </div>

      ${modulesHtml || `<p class="empty-state">Noch keine Module vorhanden.</p>`}
    `;

    courseOverview.appendChild(courseElement);
  });
}

/* KURS BEARBEITEN / LÖSCHEN */

function editCourse(courseId) {
  const course = courses.find((item) => item.id === courseId);

  if (!course) return;

  editingCourseId = course.id;

  courseTitle.value = course.title || "";
  courseDescription.value = course.description || "";
  courseOrder.value = course.sort_order || 1;

  courseForm.querySelector(".save-btn").textContent = "Änderungen speichern";

  courseForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function deleteCourse(courseId) {
  const confirmDelete = confirm(
    "Möchtest du diesen Kurs wirklich löschen? Alle Module und Lektionen darin werden ebenfalls gelöscht."
  );

  if (!confirmDelete) return;

  const { error } = await lucidSupabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (error) {
    console.error(error);
    showMessage("Kurs konnte nicht gelöscht werden.");
    return;
  }

  showMessage("Kurs gelöscht.");
  await loadData();
}

/* MODUL BEARBEITEN / LÖSCHEN */

function editModule(moduleId) {
  const module = modules.find((item) => item.id === moduleId);

  if (!module) return;

  editingModuleId = module.id;

  moduleCourse.value = module.course_id;
  moduleTitle.value = module.title || "";
  moduleOrder.value = module.sort_order || 1;

  moduleForm.querySelector(".save-btn").textContent = "Änderungen speichern";

  moduleForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function deleteModule(moduleId) {
  const confirmDelete = confirm(
    "Möchtest du dieses Modul wirklich löschen? Alle Lektionen darin werden ebenfalls gelöscht."
  );

  if (!confirmDelete) return;

  const { error } = await lucidSupabase
    .from("modules")
    .delete()
    .eq("id", moduleId);

  if (error) {
    console.error(error);
    showMessage("Modul konnte nicht gelöscht werden.");
    return;
  }

  showMessage("Modul gelöscht.");
  await loadData();
}

/* LEKTION BEARBEITEN / LÖSCHEN */

function editLesson(lessonId) {
  const lesson = lessons.find((item) => item.id === lessonId);

  if (!lesson) return;

  const module = modules.find((item) => item.id === lesson.module_id);

  if (!module) return;

  editingLessonId = lesson.id;

  lessonCourse.value = module.course_id;
  renderModuleSelect();

  lessonModule.value = lesson.module_id;
  lessonTitle.value = lesson.title || "";
  lessonContent.value = lesson.content || "";
  lessonOrder.value = lesson.sort_order || 1;

  lessonForm.querySelector(".save-btn").textContent = "Änderungen speichern";

  lessonForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function deleteLesson(lessonId) {
  const confirmDelete = confirm("Möchtest du diese Lektion wirklich löschen?");

  if (!confirmDelete) return;

  const { error } = await lucidSupabase
    .from("lessons")
    .delete()
    .eq("id", lessonId);

  if (error) {
    console.error(error);
    showMessage("Lektion konnte nicht gelöscht werden.");
    return;
  }

  showMessage("Lektion gelöscht.");
  await loadData();
}

/* FORM SUBMITS */

courseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const courseData = {
    title: courseTitle.value.trim(),
    description: courseDescription.value.trim(),
    sort_order: Number(courseOrder.value) || 1,
    is_active: true
  };

  let error;

  if (editingCourseId) {
    const response = await lucidSupabase
      .from("courses")
      .update(courseData)
      .eq("id", editingCourseId);

    error = response.error;
  } else {
    const response = await lucidSupabase
      .from("courses")
      .insert(courseData);

    error = response.error;
  }

  if (error) {
    console.error(error);
    showMessage("Kurs konnte nicht gespeichert werden.");
    return;
  }

  editingCourseId = null;
  courseForm.querySelector(".save-btn").textContent = "Kurs speichern";

  courseForm.reset();
  courseOrder.value = 1;

  showMessage("Kurs gespeichert.");
  await loadData();
});

moduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const moduleData = {
    course_id: moduleCourse.value,
    title: moduleTitle.value.trim(),
    sort_order: Number(moduleOrder.value) || 1,
    is_active: true
  };

  let error;

  if (editingModuleId) {
    const response = await lucidSupabase
      .from("modules")
      .update(moduleData)
      .eq("id", editingModuleId);

    error = response.error;
  } else {
    const response = await lucidSupabase
      .from("modules")
      .insert(moduleData);

    error = response.error;
  }

  if (error) {
    console.error(error);
    showMessage("Modul konnte nicht gespeichert werden.");
    return;
  }

  editingModuleId = null;
  moduleForm.querySelector(".save-btn").textContent = "Modul speichern";

  moduleForm.reset();
  moduleOrder.value = 1;

  showMessage("Modul gespeichert.");
  await loadData();
});

lessonCourse.addEventListener("change", renderModuleSelect);

lessonForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const lessonData = {
    module_id: lessonModule.value,
    title: lessonTitle.value.trim(),
    content: lessonContent.value.trim(),
    sort_order: Number(lessonOrder.value) || 1,
    is_active: true
  };

  let error;

  if (editingLessonId) {
    const response = await lucidSupabase
      .from("lessons")
      .update(lessonData)
      .eq("id", editingLessonId);

    error = response.error;
  } else {
    const response = await lucidSupabase
      .from("lessons")
      .insert(lessonData);

    error = response.error;
  }

  if (error) {
    console.error(error);
    showMessage("Lektion konnte nicht gespeichert werden.");
    return;
  }

  editingLessonId = null;
  lessonForm.querySelector(".save-btn").textContent = "Lektion speichern";

  lessonForm.reset();
  lessonOrder.value = 1;
  lessonModule.innerHTML = `<option value="">Bitte Modul auswählen</option>`;

  showMessage("Lektion gespeichert.");
  await loadData();
});

/* START */

async function initAdmin() {
  const profile = await protectAdminPage();

  if (!profile) return;

  await loadData();
}

initAdmin();