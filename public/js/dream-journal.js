const dreamForm = document.getElementById("dreamForm");

const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const clarityInput = document.getElementById("clarity");
const moodInput = document.getElementById("mood");
const sleepInput = document.getElementById("sleep");
const descriptionInput = document.getElementById("description");
const notesInput = document.getElementById("notes");

const selectedTagsContainer = document.getElementById("selectedTags");
const newTagInput = document.getElementById("newTagInput");
const addTagBtn = document.getElementById("addTagBtn");

const successModalOverlay = document.getElementById("successModalOverlay");
const successCloseBtn = document.getElementById("successCloseBtn");
const successStayBtn = document.getElementById("successStayBtn");

let selectedTags = [];
let currentUser = null;

/* HEUTIGES DATUM AUTOMATISCH SETZEN */

const today = new Date().toISOString().split("T")[0];

if (dateInput && !dateInput.value) {
  dateInput.value = today;
}

/* LOGIN-SCHUTZ */

async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

/* SUCCESS MODAL */

function openSuccessModal() {
  if (!successModalOverlay) return;
  successModalOverlay.classList.remove("hidden");
}

function closeSuccessModal() {
  if (!successModalOverlay) return;
  successModalOverlay.classList.add("hidden");
}

if (successCloseBtn) {
  successCloseBtn.addEventListener("click", closeSuccessModal);
}

if (successStayBtn) {
  successStayBtn.addEventListener("click", closeSuccessModal);
}

if (successModalOverlay) {
  successModalOverlay.addEventListener("click", (event) => {
    if (event.target === successModalOverlay) {
      closeSuccessModal();
    }
  });
}

/* TAGS */

function getTagButtons() {
  return document.querySelectorAll(".dream-tag");
}

function renderSelectedTags() {
  selectedTagsContainer.innerHTML = "";

  selectedTags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.classList.add("selected-tag");
    tagElement.textContent = tag + " ×";

    tagElement.addEventListener("click", () => {
      selectedTags = selectedTags.filter((item) => item !== tag);
      updateActiveButtons();
      renderSelectedTags();
    });

    selectedTagsContainer.appendChild(tagElement);
  });
}

function updateActiveButtons() {
  getTagButtons().forEach((button) => {
    const tag = button.textContent.trim();

    if (selectedTags.includes(tag)) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function toggleTag(tag) {
  if (selectedTags.includes(tag)) {
    selectedTags = selectedTags.filter((item) => item !== tag);
  } else {
    selectedTags.push(tag);
  }

  updateActiveButtons();
  renderSelectedTags();
}

function createTagButton(tagName) {
  const existingButtons = Array.from(getTagButtons());

  const alreadyExists = existingButtons.some((button) => {
    return button.textContent.trim().toLowerCase() === tagName.toLowerCase();
  });

  if (alreadyExists) return;

  const tagContainer = document.getElementById("tagOptions");

  if (!tagContainer) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("dream-tag");
  button.textContent = tagName;

  button.addEventListener("click", () => {
    toggleTag(tagName);
  });

  tagContainer.appendChild(button);
}

function activateExistingTagButtons() {
  getTagButtons().forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.textContent.trim();
      toggleTag(tag);
    });
  });
}

async function loadDreamSigns() {
  const { data, error } = await lucidSupabase
    .from("dream_signs")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Traumzeichen konnten nicht geladen werden:", error);
    return;
  }

  data.forEach((dreamSign) => {
    createTagButton(dreamSign.name);
  });
}

async function saveDreamSign(tagName) {
  const { data, error } = await lucidSupabase
    .from("dream_signs")
    .upsert(
      {
        user_id: currentUser.id,
        name: tagName
      },
      {
        onConflict: "user_id,name"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Traumzeichen konnte nicht gespeichert werden:", error);
    return null;
  }

  return data;
}

addTagBtn.addEventListener("click", async () => {
  const newTag = newTagInput.value.trim();

  if (newTag === "") return;

  const savedTag = await saveDreamSign(newTag);

  if (!savedTag) {
    alert("Traumzeichen konnte nicht gespeichert werden.");
    return;
  }

  createTagButton(savedTag.name);

  if (!selectedTags.includes(savedTag.name)) {
    selectedTags.push(savedTag.name);
  }

  newTagInput.value = "";
  updateActiveButtons();
  renderSelectedTags();
});

newTagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTagBtn.click();
  }
});

/* TRAUM SPEICHERN */

dreamForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (title === "" || description === "") {
    alert("Bitte gib mindestens einen Titel und eine Beschreibung ein.");
    return;
  }

  const dreamType = clarityInput.value;
  const isLucid = dreamType === "Luzider Traum";

  const { data: dream, error: dreamError } = await lucidSupabase
    .from("dreams")
    .insert({
      user_id: currentUser.id,
      title: title,
      dream_date: dateInput.value,
      dream_type: dreamType,
      mood: moodInput.value,
      sleep_quality: sleepInput.value,
      description: description,
      notes: notesInput.value.trim(),
      is_lucid: isLucid
    })
    .select()
    .single();

  if (dreamError) {
    console.error("Traum konnte nicht gespeichert werden:", dreamError);
    alert("Traum konnte nicht gespeichert werden.");
    return;
  }

  for (const tagName of selectedTags) {
    const dreamSign = await saveDreamSign(tagName);

    if (!dreamSign) continue;

    const { error: linkError } = await lucidSupabase
      .from("dream_dream_signs")
      .insert({
        user_id: currentUser.id,
        dream_id: dream.id,
        dream_sign_id: dreamSign.id
      });

    if (linkError) {
      console.error("Traumzeichen-Verknüpfung fehlgeschlagen:", linkError);
    }
  }

  dreamForm.reset();

  if (dateInput) {
    dateInput.value = today;
  }

  selectedTags = [];
  updateActiveButtons();
  renderSelectedTags();

  openSuccessModal();
});

/* START */

async function initDreamJournal() {
  currentUser = await protectPage();

  if (!currentUser) return;

  activateExistingTagButtons();
  await loadDreamSigns();
  renderSelectedTags();
}

initDreamJournal();