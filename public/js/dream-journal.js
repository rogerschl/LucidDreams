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

/* ALLE AKTUELLEN TAG-BUTTONS HOLEN */

function getTagButtons() {
  return document.querySelectorAll(".dream-tag");
}

/* AKTIVE TAGS ANZEIGEN */

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

/* BUTTONS AKTIV / INAKTIV SETZEN */

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

/* EINEN TAG AUSWÄHLEN */

function toggleTag(tag) {
  if (selectedTags.includes(tag)) {
    selectedTags = selectedTags.filter((item) => item !== tag);
  } else {
    selectedTags.push(tag);
  }

  updateActiveButtons();
  renderSelectedTags();
}

/* TAG-BUTTON ERSTELLEN */

function createTagButton(tagName) {
  const existingButtons = Array.from(getTagButtons());
  const alreadyExists = existingButtons.some((button) => {
    return button.textContent.trim().toLowerCase() === tagName.toLowerCase();
  });

  if (alreadyExists) return;

  const firstTagButton = document.querySelector(".dream-tag");

  if (!firstTagButton) return;

  const tagContainer = firstTagButton.parentElement;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("dream-tag");
  button.textContent = tagName;

  button.addEventListener("click", () => {
    toggleTag(tagName);
  });

  tagContainer.appendChild(button);
}

/* BESTEHENDE STATISCHE TAGS AKTIVIEREN */

function activateExistingTagButtons() {
  getTagButtons().forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.textContent.trim();
      toggleTag(tag);
    });
  });
}

/* TRAUMZEICHEN AUS SUPABASE LADEN */

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

/* TRAUMZEICHEN IN SUPABASE SPEICHERN */

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

/* NEUES TRAUMZEICHEN MANUELL HINZUFÜGEN */

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
  const isLucid = dreamType.toLowerCase().includes("luzid");

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

  alert("Traum gespeichert!");
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