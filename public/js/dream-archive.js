const board = document.getElementById("board");

const filterToggle = document.getElementById("filterToggle");
const archiveFilters = document.getElementById("archiveFilters");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const dateFilter = document.getElementById("dateFilter");
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

let pendingDreamDelete = null;
let pendingDreamSignDelete = null;

let currentUser = null;
let dreams = [];
let currentDream = null;

let allDreamSigns = [];
let selectedEditTags = [];

const columns = [
  { key: "Luzider Traum", className: "column-lucid" },
  { key: "Normaler Traum", className: "column-normal" },
  { key: "Kurzer Traum", className: "column-short" },
  { key: "Albtraum", className: "column-nightmare" }
];

async function protectPage() {
  const { data, error } = await lucidSupabase.auth.getSession();

  if (error || !data.session) {
    window.location.href = "./login.html";
    return null;
  }

  return data.session.user;
}

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
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Traumzeichen konnten nicht geladen werden:", error);
    allDreamSigns = [];
    return;
  }

  allDreamSigns = data || [];
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
    alert("Traumzeichen konnte nicht gelöscht werden.");
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

function openDreamModal(dream) {
  currentDream = dream;

  modalMenu.classList.add("hidden");
  editForm.classList.add("hidden");
  modalView.classList.remove("hidden");

  modalCategory.textContent = getDreamCategory(dream);
  modalTitle.textContent = dream.title || "Ohne Titel";
  modalDate.textContent = dream.date || "Kein Datum";

  modalMeta.innerHTML = `
    <span>${dream.clarity || "Keine Traumart"}</span>
    <span>${dream.mood || "Keine Stimmung"}</span>
    <span>${dream.sleep || "Keine Schlafqualität"}</span>
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

function createDreamCard(dream) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "dream-card";

  const tags = (dream.tags || []).slice(0, 3);

  card.innerHTML = `
    <h3>${dream.title || "Ohne Titel"}</h3>

    <div class="card-meta">
      <span class="card-badge">${dream.mood || "Neutral"}</span>
      <span class="card-badge">${dream.date || "Kein Datum"}</span>
    </div>

    <p class="card-preview">${truncateText(dream.description || "Keine Beschreibung")}</p>

    <div class="card-tags">
      ${tags.map(tag => `<span class="card-tag">${tag}</span>`).join("")}
    </div>
  `;

  card.addEventListener("click", () => openDreamModal(dream));

  return card;
}

function getFilteredDreams() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;
  const selectedDate = dateFilter.value;

  return dreams.filter((dream) => {
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

    const dreamDate = dream.date || "";

    const matchesDate =
      selectedDate === "" || dreamDate === selectedDate;

    return matchesSearch && matchesType && matchesDate;
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

  if (!savedTag) return;

  const existsInAll = allDreamSigns.some((sign) => sign.id === savedTag.id);

  if (!existsInAll) {
    allDreamSigns.push(savedTag);
  }

  if (!selectedEditTags.includes(savedTag.name)) {
    selectedEditTags.push(savedTag.name);
  }

  editNewTagInput.value = "";

  renderEditTagOptions();
  renderEditSelectedTags();
}

function openEditForm() {
  if (!currentDream) return;

  editTitle.value = currentDream.title || "";
  editDate.value = currentDream.date || "";
  editClarity.value = currentDream.clarity || "Normaler Traum";
  editMood.value = currentDream.mood || "Neutral";
  editSleep.value = currentDream.sleep || "Gut";
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

  const updatedDream = {
    title: editTitle.value.trim() || "Ohne Titel",
    dream_date: editDate.value,
    dream_type: editClarity.value,
    mood: editMood.value,
    sleep_quality: editSleep.value,
    description: editDescription.value.trim(),
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
    alert("Traum konnte nicht gespeichert werden.");
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
    alert("Traum konnte nicht gelöscht werden.");
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
dateFilter.addEventListener("change", renderBoard);

resetFilters.addEventListener("click", () => {
  searchInput.value = "";
  typeFilter.value = "Alle";
  dateFilter.value = "";
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
  }
});

/* START */

async function initDreamArchive() {
  currentUser = await protectPage();

  if (!currentUser) return;

  await loadDreams();
  await loadAllDreamSigns();
  renderBoard();
}

initDreamArchive();