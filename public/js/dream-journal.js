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

const dreamSignConfirmOverlay = document.getElementById("dreamSignConfirmOverlay");
const dreamSignConfirmClose = document.getElementById("dreamSignConfirmClose");
const dreamSignCancelBtn = document.getElementById("dreamSignCancelBtn");
const dreamSignDeleteBtn = document.getElementById("dreamSignDeleteBtn");
const dreamSignConfirmText = document.getElementById("dreamSignConfirmText");

const journalMessageOverlay = document.getElementById("journalMessageOverlay");
const journalMessageCloseBtn = document.getElementById("journalMessageCloseBtn");
const journalMessageOkBtn = document.getElementById("journalMessageOkBtn");
const journalMessageTitle = document.getElementById("journalMessageTitle");
const journalMessageText = document.getElementById("journalMessageText");

let selectedTags = [];
let currentUser = null;
let allDreamSigns = [];
let pendingDreamSignDelete = null;

let datePicker = null;
let clarityChoice = null;
let moodChoice = null;
let sleepChoice = null;

const today = new Date().toISOString().split("T")[0];

/* PRETTY INPUTS */

function initPrettyInputs() {
  if (dateInput && window.flatpickr) {
    datePicker = flatpickr(dateInput, {
  locale: "de",
  dateFormat: "Y-m-d",
  altInput: true,
  altFormat: "d.m.Y",
  defaultDate: today,
  allowInput: false,
  monthSelectorType: "static",
  position: "auto center",
  disableMobile: true
});
  }

  if (window.Choices) {
    clarityChoice = new Choices(clarityInput, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    moodChoice = new Choices(moodInput, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    sleepChoice = new Choices(sleepInput, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });
  }
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

/* MESSAGE MODAL */

function openJournalMessage(text, title = "Hinweis") {
  if (!journalMessageOverlay) return;

  journalMessageTitle.textContent = title;
  journalMessageText.textContent = text;
  journalMessageOverlay.classList.remove("hidden");
}

function closeJournalMessage() {
  if (!journalMessageOverlay) return;

  journalMessageOverlay.classList.add("hidden");
}

if (journalMessageCloseBtn) {
  journalMessageCloseBtn.addEventListener("click", closeJournalMessage);
}

if (journalMessageOkBtn) {
  journalMessageOkBtn.addEventListener("click", closeJournalMessage);
}

if (journalMessageOverlay) {
  journalMessageOverlay.addEventListener("click", (event) => {
    if (event.target === journalMessageOverlay) {
      closeJournalMessage();
    }
  });
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

function openDreamSignConfirmModal(dreamSignId, dreamSignName) {
  pendingDreamSignDelete = {
    id: dreamSignId,
    name: dreamSignName
  };

  dreamSignConfirmText.textContent =
    `Möchtest du das Traumzeichen „${dreamSignName}“ wirklich löschen? Es wird auch aus allen anderen Träumen entfernt.`;

  dreamSignConfirmOverlay.classList.remove("hidden");
}

function closeDreamSignConfirmModal() {
  dreamSignConfirmOverlay.classList.add("hidden");
  pendingDreamSignDelete = null;
}

async function confirmDreamSignDelete() {
  if (!pendingDreamSignDelete) return;

  const { id, name } = pendingDreamSignDelete;

  const { error } = await lucidSupabase
    .from("dream_signs")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Traumzeichen konnte nicht gelöscht werden:", error);
    openJournalMessage("Traumzeichen konnte nicht gelöscht werden.");
    return;
  }

  selectedTags = selectedTags.filter((tag) => tag !== name);

  const tagContainer = document.getElementById("tagOptions");
  tagContainer.innerHTML = "";

  await loadDreamSigns();

  updateActiveButtons();
  renderSelectedTags();
  closeDreamSignConfirmModal();
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

if (dreamSignConfirmClose) {
  dreamSignConfirmClose.addEventListener("click", closeDreamSignConfirmModal);
}

if (dreamSignCancelBtn) {
  dreamSignCancelBtn.addEventListener("click", closeDreamSignConfirmModal);
}

if (dreamSignConfirmOverlay) {
  dreamSignConfirmOverlay.addEventListener("click", (event) => {
    if (event.target === dreamSignConfirmOverlay) {
      closeDreamSignConfirmModal();
    }
  });
}

if (dreamSignDeleteBtn) {
  dreamSignDeleteBtn.addEventListener("click", confirmDreamSignDelete);
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

function createTagButton(dreamSign) {
  const tagName = dreamSign.name;

  const existingButtons = Array.from(getTagButtons());

  const alreadyExists = existingButtons.some((button) => {
    return button.textContent.trim().replace("×", "").trim().toLowerCase() === tagName.toLowerCase();
  });

  if (alreadyExists) return;

  const tagContainer = document.getElementById("tagOptions");

  if (!tagContainer) return;

  const wrapper = document.createElement("div");
  wrapper.classList.add("tag-wrapper");

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("dream-tag");
  button.textContent = tagName;

  button.addEventListener("click", () => {
    toggleTag(tagName);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.classList.add("delete-tag-btn");
  deleteBtn.textContent = "×";

  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openDreamSignConfirmModal(dreamSign.id, dreamSign.name);
  });

  wrapper.appendChild(button);
  wrapper.appendChild(deleteBtn);

  tagContainer.appendChild(wrapper);
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
    allDreamSigns = [];
    return;
  }

  allDreamSigns = data || [];

  allDreamSigns.forEach((dreamSign) => {
    createTagButton(dreamSign);
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
    openJournalMessage("Traumzeichen konnte nicht gespeichert werden.");
    return;
  }

  createTagButton(savedTag);

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
    openJournalMessage("Bitte gib mindestens einen Titel und eine Beschreibung ein.");
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
    openJournalMessage("Traum konnte nicht gespeichert werden.");
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

  if (datePicker) {
    datePicker.setDate(today, true);
  } else if (dateInput) {
    dateInput.value = today;
  }

  if (clarityChoice) clarityChoice.setChoiceByValue("Normaler Traum");
  if (moodChoice) moodChoice.setChoiceByValue("Neutral");
  if (sleepChoice) sleepChoice.setChoiceByValue("Gut");

  selectedTags = [];
  updateActiveButtons();
  renderSelectedTags();

  openSuccessModal();
});

/* START */

async function initDreamJournal() {
  initPrettyInputs();

  currentUser = await protectPage();

  if (!currentUser) return;

  activateExistingTagButtons();
  await loadDreamSigns();
  renderSelectedTags();
}

initDreamJournal();