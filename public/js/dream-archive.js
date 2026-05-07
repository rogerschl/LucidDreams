const board = document.getElementById("board");

const filterToggle = document.getElementById("filterToggle");
const archiveFilters = document.getElementById("archiveFilters");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const dreamSignFilter = document.getElementById("dreamSignFilter");
const dateFilter = document.getElementById("dateFilter");
const sortFilter = document.getElementById("sortFilter");
const resetFilters = document.getElementById("resetFilters");

const dreamModalOverlay = document.getElementById("dreamModalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");

const modalMenuBtn = document.getElementById("modalMenuBtn");
const modalMenu = document.getElementById("modalMenu");
const editDreamBtn = document.getElementById("editDreamBtn");
const deleteDreamBtn = document.getElementById("deleteDreamBtn");

const modalView = document.getElementById("modalView");
const modalCategory = document.getElementById("modalCategory");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalMeta = document.getElementById("modalMeta");
const modalDescription = document.getElementById("modalDescription");
const modalTags = document.getElementById("modalTags");
const modalNotes = document.getElementById("modalNotes");

const editForm = document.getElementById("editForm");
const editTitle = document.getElementById("editTitle");
const editDate = document.getElementById("editDate");
const editClarity = document.getElementById("editClarity");
const editMood = document.getElementById("editMood");
const editSleep = document.getElementById("editSleep");
const editDescription = document.getElementById("editDescription");
const editNotes = document.getElementById("editNotes");

const editSelectedTagsContainer = document.getElementById("editSelectedTags");
const editTagOptions = document.getElementById("editTagOptions");
const editNewTagInput = document.getElementById("editNewTagInput");
const editAddTagBtn = document.getElementById("editAddTagBtn");

const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const deleteModalOverlay = document.getElementById("deleteModalOverlay");
const deleteCloseBtn = document.getElementById("deleteCloseBtn");
const deleteStayBtn = document.getElementById("deleteStayBtn");

const dreamDeleteConfirmOverlay = document.getElementById("dreamDeleteConfirmOverlay");
const dreamDeleteConfirmClose = document.getElementById("dreamDeleteConfirmClose");
const dreamDeleteCancelBtn = document.getElementById("dreamDeleteCancelBtn");
const dreamDeleteConfirmBtn = document.getElementById("dreamDeleteConfirmBtn");

const dreamSignConfirmOverlay = document.getElementById("dreamSignConfirmOverlay");
const dreamSignConfirmClose = document.getElementById("dreamSignConfirmClose");
const dreamSignCancelBtn = document.getElementById("dreamSignCancelBtn");
const dreamSignDeleteBtn = document.getElementById("dreamSignDeleteBtn");
const dreamSignConfirmText = document.getElementById("dreamSignConfirmText");

const archiveMessageOverlay = document.getElementById("archiveMessageOverlay");
const archiveMessageCloseBtn = document.getElementById("archiveMessageCloseBtn");
const archiveMessageOkBtn = document.getElementById("archiveMessageOkBtn");
const archiveMessageTitle = document.getElementById("archiveMessageTitle");
const archiveMessageText = document.getElementById("archiveMessageText");

let pendingDreamDelete = null;
let pendingDreamSignDelete = null;

let currentUser = null;
let dreams = [];
let currentDream = null;

let allDreamSigns = [];
let selectedEditTags = [];

let dateFilterPicker = null;
let editDatePicker = null;
let typeFilterChoice = null;
let dreamSignFilterChoice = null;
let sortFilterChoice = null;
let editClarityChoice = null;
let editMoodChoice = null;
let editSleepChoice = null;

const columns = [
  { key: "Luzider Traum", className: "column-lucid" },
  { key: "Normaler Traum", className: "column-normal" },
  { key: "Kurzer Traum", className: "column-short" },
  { key: "Albtraum", className: "column-nightmare" }
];

/* HELPERS */

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "Kein Datum";

  const parts = dateString.split("-");

  if (parts.length !== 3) return dateString;

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function parseDateValue(dateString) {
  if (!dateString) return 0;

  const time = new Date(dateString).getTime();

  return Number.isNaN(time) ? 0 : time;
}

/* PRETTY INPUTS */

function initPrettyInputs() {
  if (dateFilter && window.flatpickr) {
    dateFilterPicker = flatpickr(dateFilter, {
      locale: "de",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d.m.Y",
      allowInput: false,
      monthSelectorType: "static",
      onChange: renderBoard,
      position: "auto center",
      disableMobile: true
    });
  }

  if (editDate && window.flatpickr) {
    editDatePicker = flatpickr(editDate, {
      locale: "de",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d.m.Y",
      allowInput: false,
      monthSelectorType: "static",
      position: "auto center",
      disableMobile: true
    });
  }

  if (window.Choices) {
    typeFilterChoice = new Choices(typeFilter, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    dreamSignFilterChoice = new Choices(dreamSignFilter, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    sortFilterChoice = new Choices(sortFilter, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    editClarityChoice = new Choices(editClarity, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    editMoodChoice = new Choices(editMood, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });

    editSleepChoice = new Choices(editSleep, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });
  }
}

/* MESSAGE MODAL */

function openArchiveMessage(text, title = "Hinweis") {
  if (!archiveMessageOverlay) return;

  archiveMessageTitle.textContent = title;
  archiveMessageText.textContent = text;
  archiveMessageOverlay.classList.remove("hidden");
}

function closeArchiveMessage() {
  if (!archiveMessageOverlay) return;

  archiveMessageOverlay.classList.add("hidden");
}

if (archiveMessageCloseBtn) {
  archiveMessageCloseBtn.addEventListener("click", closeArchiveMessage);
}

if (archiveMessageOkBtn) {
  archiveMessageOkBtn.addEventListener("click", closeArchiveMessage);
}

if (archiveMessageOverlay) {
  archiveMessageOverlay.addEventListener("click", (event) => {
    if (event.target === archiveMessageOverlay) {
      closeArchiveMessage();
    }
  });
}

/* LOGIN */

async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

/* MODALS */

function openDeleteModal() {
  if (!deleteModalOverlay) return;
  deleteModalOverlay.classList.remove("hidden");
}

function closeDeleteModal() {
  if (!deleteModalOverlay) return;
  deleteModalOverlay.classList.add("hidden");
}

function openDreamDeleteConfirmModal() {
  if (!currentDream) return;
  pendingDreamDelete = currentDream;
  dreamDeleteConfirmOverlay.classList.remove("hidden");
}

function closeDreamDeleteConfirmModal() {
  dreamDeleteConfirmOverlay.classList.add("hidden");
  pendingDreamDelete = null;
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

/* LOAD DATA */

function normalizeDream(dream) {
  const tags =
    dream.dream_dream_signs?.map((link) => link.dream_signs?.name).filter(Boolean) || [];

  return {
    id: dream.id,
    title: dream.title,
    date: dream.dream_date,
    clarity: dream.dream_type,
    mood: dream.mood,
    sleep: dream.sleep_quality,
    description: dream.description,
    notes: dream.notes,
    isLucid: dream.is_lucid,
    tags: tags
  };
}

async function loadDreams() {
  const { data, error } = await lucidSupabase
    .from("dreams")
    .select(`
      *,
      dream_dream_signs (
        dream_signs (
          id,
          name
        )
      )
    `)
    .eq("user_id", currentUser.id)
    .eq("archived", false)
    .order("dream_date", { ascending: false });

  if (error) {
    console.error("Träume konnten nicht geladen werden:", error);
    board.innerHTML = `<p class="empty-column">Träume konnten nicht geladen werden.</p>`;
    return;
  }

  dreams = data.map(normalizeDream);
}

async function loadAllDreamSigns() {
  const { data, error } = await lucidSupabase
    .from("dream_signs")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Traumzeichen konnten nicht geladen werden:", error);
    allDreamSigns = [];
    return;
  }

  allDreamSigns = data || [];
  renderDreamSignFilter();
}

function renderDreamSignFilter() {
  if (!dreamSignFilter) return;

  const currentValue = dreamSignFilter.value || "Alle";

  dreamSignFilter.innerHTML = `<option value="Alle">Alle</option>`;

  allDreamSigns.forEach((sign) => {
    const option = document.createElement("option");
    option.value = sign.name;
    option.textContent = sign.name;
    dreamSignFilter.appendChild(option);
  });

  if (dreamSignFilterChoice) {
    dreamSignFilterChoice.destroy();

    dreamSignFilterChoice = new Choices(dreamSignFilter, {
      searchEnabled: false,
      shouldSort: false,
      itemSelectText: ""
    });
  }

  if ([...dreamSignFilter.options].some((option) => option.value === currentValue)) {
    dreamSignFilter.value = currentValue;

    if (dreamSignFilterChoice) {
      dreamSignFilterChoice.setChoiceByValue(currentValue);
    }
  }
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

/* DREAM SIGNS */

async function deleteDreamSign(dreamSignId, dreamSignName) {
  openDreamSignConfirmModal(dreamSignId, dreamSignName);
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
    openArchiveMessage("Traumzeichen konnte nicht gelöscht werden.");
    return;
  }

  selectedEditTags = selectedEditTags.filter((tag) => tag !== name);

  await loadAllDreamSigns();
  await loadDreams();

  renderEditTagOptions();
  renderEditSelectedTags();
  renderBoard();

  closeDreamSignConfirmModal();
}

/* RENDER BOARD */

function getDreamCategory(dream) {
  if (!dream) return "Normaler Traum";

  if (dream.clarity === "Luzider Traum" || dream.clarity === "Luzid") {
    return "Luzider Traum";
  }

  if (dream.clarity === "Kurzer Traum") {
    return "Kurzer Traum";
  }

  if (dream.clarity === "Albtraum") {
    return "Albtraum";
  }

  return "Normaler Traum";
}

function truncateText(text, maxLength = 90) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function createDreamCard(dream) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "dream-card";

  const tags = (dream.tags || []).slice(0, 3);

  card.innerHTML = `
    <h3>${escapeHTML(dream.title || "Ohne Titel")}</h3>

    <div class="card-meta">
      <span class="card-badge">${escapeHTML(dream.mood || "Neutral")}</span>
      <span class="card-badge">${formatDate(dream.date)}</span>
    </div>

    <p class="card-preview">${escapeHTML(truncateText(dream.description || "Keine Beschreibung"))}</p>

    <div class="card-tags">
      ${tags.map(tag => `<span class="card-tag">${escapeHTML(tag)}</span>`).join("")}
    </div>
  `;

  card.addEventListener("click", () => openDreamModal(dream));

  return card;
}

function getFilteredDreams() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;
  const selectedDreamSign = dreamSignFilter.value;
  const selectedDate = dateFilter.value;

  let result = dreams.filter((dream) => {
    const searchableText = `
      ${dream.title || ""}
      ${dream.description || ""}
      ${dream.notes || ""}
      ${(dream.tags || []).join(" ")}
      ${dream.mood || ""}
      ${dream.clarity || ""}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(searchText);
    const dreamCategory = getDreamCategory(dream);

    const matchesType =
      selectedType === "Alle" || dreamCategory === selectedType;

    const matchesDreamSign =
      selectedDreamSign === "Alle" || (dream.tags || []).includes(selectedDreamSign);

    const dreamDate = dream.date || "";

    const matchesDate =
      selectedDate === "" || dreamDate === selectedDate;

    return matchesSearch && matchesType && matchesDreamSign && matchesDate;
  });

  result = sortDreams(result);

  return result;
}

function sortDreams(dreamList) {
  const selectedSort = sortFilter.value;

  return [...dreamList].sort((a, b) => {
    if (selectedSort === "date-asc") {
      return parseDateValue(a.date) - parseDateValue(b.date);
    }

    if (selectedSort === "title-asc") {
      return String(a.title || "").localeCompare(String(b.title || ""), "de");
    }

    if (selectedSort === "title-desc") {
      return String(b.title || "").localeCompare(String(a.title || ""), "de");
    }

    return parseDateValue(b.date) - parseDateValue(a.date);
  });
}

function renderBoard() {
  const filteredDreams = getFilteredDreams();
  const selectedType = typeFilter.value;

  board.innerHTML = "";

  columns.forEach((columnConfig) => {
    if (selectedType !== "Alle" && columnConfig.key !== selectedType) {
      return;
    }

    const columnDreams = filteredDreams.filter((dream) => {
      return getDreamCategory(dream) === columnConfig.key;
    });

    const column = document.createElement("section");
    column.className = `column ${columnConfig.className}`;

    column.innerHTML = `
      <div class="column-header">
        <div class="column-title">
          <span>${columnConfig.key}</span>
        </div>
        <div class="column-count">${columnDreams.length}</div>
      </div>

      <div class="column-body"></div>
    `;

    const columnBody = column.querySelector(".column-body");

    if (columnDreams.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-column";
      empty.textContent = "Keine Träume vorhanden";
      columnBody.appendChild(empty);
    } else {
      columnDreams.forEach((dream) => {
        columnBody.appendChild(createDreamCard(dream));
      });
    }

    board.appendChild(column);
  });
}

/* DREAM MODAL */

function openDreamModal(dream) {
  currentDream = dream;

  modalMenu.classList.add("hidden");
  editForm.classList.add("hidden");
  modalView.classList.remove("hidden");

  modalCategory.textContent = getDreamCategory(dream);
  modalTitle.textContent = dream.title || "Ohne Titel";
  modalDate.textContent = formatDate(dream.date);

  modalMeta.innerHTML = `
    <span>${escapeHTML(dream.clarity || "Keine Traumart")}</span>
    <span>${escapeHTML(dream.mood || "Keine Stimmung")}</span>
    <span>${escapeHTML(dream.sleep || "Keine Schlafqualität")}</span>
  `;

  modalDescription.textContent = dream.description || "Keine Beschreibung vorhanden.";

  modalTags.innerHTML = "";

  if (dream.tags && dream.tags.length > 0) {
    dream.tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.textContent = tag;
      modalTags.appendChild(tagElement);
    });
  } else {
    const emptyTag = document.createElement("span");
    emptyTag.textContent = "Keine Traumzeichen";
    modalTags.appendChild(emptyTag);
  }

  modalNotes.textContent =
    dream.notes && dream.notes.trim() !== ""
      ? dream.notes
      : "Keine zusätzlichen Notizen.";

  dreamModalOverlay.classList.add("active");
}

function closeDreamModal() {
  dreamModalOverlay.classList.remove("active");
  modalMenu.classList.add("hidden");
  editForm.classList.add("hidden");
  modalView.classList.remove("hidden");
  currentDream = null;
  selectedEditTags = [];
}

/* EDIT TAGS */

function renderEditSelectedTags() {
  editSelectedTagsContainer.innerHTML = "";

  selectedEditTags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.classList.add("selected-tag");
    tagElement.textContent = tag + " ×";

    tagElement.addEventListener("click", () => {
      selectedEditTags = selectedEditTags.filter((item) => item !== tag);
      renderEditTagOptions();
      renderEditSelectedTags();
    });

    editSelectedTagsContainer.appendChild(tagElement);
  });
}

function renderEditTagOptions() {
  editTagOptions.innerHTML = "";

  allDreamSigns.forEach((dreamSign) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("edit-tag-wrapper");

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("edit-dream-tag");
    button.textContent = dreamSign.name;

    if (selectedEditTags.includes(dreamSign.name)) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      if (selectedEditTags.includes(dreamSign.name)) {
        selectedEditTags = selectedEditTags.filter((item) => item !== dreamSign.name);
      } else {
        selectedEditTags.push(dreamSign.name);
      }

      renderEditTagOptions();
      renderEditSelectedTags();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.classList.add("delete-dream-sign-btn");
    deleteBtn.textContent = "×";

    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteDreamSign(dreamSign.id, dreamSign.name);
    });

    wrapper.appendChild(button);
    wrapper.appendChild(deleteBtn);
    editTagOptions.appendChild(wrapper);
  });
}

async function addEditTag() {
  const newTag = editNewTagInput.value.trim();

  if (!newTag) return;

  const savedTag = await saveDreamSign(newTag);

  if (!savedTag) {
    openArchiveMessage("Traumzeichen konnte nicht gespeichert werden.");
    return;
  }

  const existsInAll = allDreamSigns.some((sign) => sign.id === savedTag.id);

  if (!existsInAll) {
    allDreamSigns.push(savedTag);
  }

  if (!selectedEditTags.includes(savedTag.name)) {
    selectedEditTags.push(savedTag.name);
  }

  editNewTagInput.value = "";

  renderDreamSignFilter();
  renderEditTagOptions();
  renderEditSelectedTags();
}

/* EDIT DREAM */

function openEditForm() {
  if (!currentDream) return;

  editTitle.value = currentDream.title || "";

  if (editDatePicker) {
    editDatePicker.setDate(currentDream.date || "", true);
  } else {
    editDate.value = currentDream.date || "";
  }

  editClarity.value = currentDream.clarity || "Normaler Traum";
  editMood.value = currentDream.mood || "Neutral";
  editSleep.value = currentDream.sleep || "Gut";

  if (editClarityChoice) editClarityChoice.setChoiceByValue(editClarity.value);
  if (editMoodChoice) editMoodChoice.setChoiceByValue(editMood.value);
  if (editSleepChoice) editSleepChoice.setChoiceByValue(editSleep.value);

  editDescription.value = currentDream.description || "";
  editNotes.value = currentDream.notes || "";

  selectedEditTags = currentDream.tags ? [...currentDream.tags] : [];

  renderEditTagOptions();
  renderEditSelectedTags();

  modalMenu.classList.add("hidden");
  modalView.classList.add("hidden");
  editForm.classList.remove("hidden");
}

async function saveEditedDream() {
  if (!currentDream) return;

  const title = editTitle.value.trim();
  const description = editDescription.value.trim();

  if (!title || !description) {
    openArchiveMessage("Bitte gib mindestens einen Titel und eine Beschreibung ein.");
    return;
  }

  const updatedDream = {
    title: title,
    dream_date: editDate.value,
    dream_type: editClarity.value,
    mood: editMood.value,
    sleep_quality: editSleep.value,
    description: description,
    notes: editNotes.value.trim(),
    is_lucid: editClarity.value === "Luzider Traum"
  };

  const { error } = await lucidSupabase
    .from("dreams")
    .update(updatedDream)
    .eq("id", currentDream.id)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Traum konnte nicht aktualisiert werden:", error);
    openArchiveMessage("Traum konnte nicht gespeichert werden.");
    return;
  }

  const { error: deleteLinksError } = await lucidSupabase
    .from("dream_dream_signs")
    .delete()
    .eq("dream_id", currentDream.id)
    .eq("user_id", currentUser.id);

  if (deleteLinksError) {
    console.error("Alte Traumzeichen konnten nicht entfernt werden:", deleteLinksError);
  }

  for (const tagName of selectedEditTags) {
    const dreamSign = await saveDreamSign(tagName);

    if (!dreamSign) continue;

    const { error: linkError } = await lucidSupabase
      .from("dream_dream_signs")
      .insert({
        user_id: currentUser.id,
        dream_id: currentDream.id,
        dream_sign_id: dreamSign.id
      });

    if (linkError) {
      console.error("Traumzeichen-Verknüpfung fehlgeschlagen:", linkError);
    }
  }

  await loadDreams();
  await loadAllDreamSigns();

  const refreshedDream = dreams.find((dream) => dream.id === currentDream.id);

  editForm.classList.add("hidden");
  modalView.classList.remove("hidden");

  if (refreshedDream) {
    openDreamModal(refreshedDream);
  }

  renderBoard();
}

/* DELETE DREAM */

async function deleteCurrentDream() {
  openDreamDeleteConfirmModal();
}

async function confirmDreamDelete() {
  if (!pendingDreamDelete) return;

  const { error } = await lucidSupabase
    .from("dreams")
    .delete()
    .eq("id", pendingDreamDelete.id)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Traum konnte nicht gelöscht werden:", error);
    openArchiveMessage("Traum konnte nicht gelöscht werden.");
    return;
  }

  await loadDreams();
  await loadAllDreamSigns();

  closeDreamDeleteConfirmModal();
  closeDreamModal();
  renderBoard();
  openDeleteModal();
}

/* EVENTS */

if (filterToggle && archiveFilters) {
  filterToggle.addEventListener("click", () => {
    archiveFilters.classList.toggle("hidden");

    if (archiveFilters.classList.contains("hidden")) {
      filterToggle.textContent = "Filter anzeigen";
    } else {
      filterToggle.textContent = "Filter ausblenden";
    }
  });
}

searchInput.addEventListener("input", renderBoard);
typeFilter.addEventListener("change", renderBoard);
dreamSignFilter.addEventListener("change", renderBoard);
dateFilter.addEventListener("change", renderBoard);
sortFilter.addEventListener("change", renderBoard);

resetFilters.addEventListener("click", () => {
  searchInput.value = "";
  typeFilter.value = "Alle";
  dreamSignFilter.value = "Alle";
  sortFilter.value = "date-desc";

  if (typeFilterChoice) typeFilterChoice.setChoiceByValue("Alle");
  if (dreamSignFilterChoice) dreamSignFilterChoice.setChoiceByValue("Alle");
  if (sortFilterChoice) sortFilterChoice.setChoiceByValue("date-desc");

  if (dateFilterPicker) {
    dateFilterPicker.clear();
  } else {
    dateFilter.value = "";
  }

  renderBoard();
});

modalMenuBtn.addEventListener("click", () => {
  modalMenu.classList.toggle("hidden");
});

editDreamBtn.addEventListener("click", openEditForm);
deleteDreamBtn.addEventListener("click", deleteCurrentDream);
saveEditBtn.addEventListener("click", saveEditedDream);

editAddTagBtn.addEventListener("click", addEditTag);

editNewTagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addEditTag();
  }
});

cancelEditBtn.addEventListener("click", () => {
  editForm.classList.add("hidden");
  modalView.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", closeDreamModal);

dreamModalOverlay.addEventListener("click", (event) => {
  if (event.target === dreamModalOverlay) {
    closeDreamModal();
  }
});

if (deleteCloseBtn) {
  deleteCloseBtn.addEventListener("click", closeDeleteModal);
}

if (deleteStayBtn) {
  deleteStayBtn.addEventListener("click", closeDeleteModal);
}

if (deleteModalOverlay) {
  deleteModalOverlay.addEventListener("click", (event) => {
    if (event.target === deleteModalOverlay) {
      closeDeleteModal();
    }
  });
}

if (dreamDeleteConfirmClose) {
  dreamDeleteConfirmClose.addEventListener("click", closeDreamDeleteConfirmModal);
}

if (dreamDeleteCancelBtn) {
  dreamDeleteCancelBtn.addEventListener("click", closeDreamDeleteConfirmModal);
}

if (dreamDeleteConfirmOverlay) {
  dreamDeleteConfirmOverlay.addEventListener("click", (event) => {
    if (event.target === dreamDeleteConfirmOverlay) {
      closeDreamDeleteConfirmModal();
    }
  });
}

if (dreamDeleteConfirmBtn) {
  dreamDeleteConfirmBtn.addEventListener("click", confirmDreamDelete);
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDreamModal();
    closeDeleteModal();
    closeDreamDeleteConfirmModal();
    closeDreamSignConfirmModal();
    closeArchiveMessage();
  }
});

/* START */

async function initDreamArchive() {
  initPrettyInputs();

  currentUser = await protectPage();

  if (!currentUser) return;

  await loadDreams();
  await loadAllDreamSigns();
  renderBoard();
}

initDreamArchive();