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
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let currentDreamIndex = null;

const columns = [
  { key: "Luzider Traum", className: "column-lucid" },
  { key: "Kurzer Traum", className: "column-short" },
  { key: "Normaler Traum", className: "column-normal" },
  { key: "Albtraum", className: "column-nightmare" }
];

function getDreams() {
  return JSON.parse(localStorage.getItem("dreams")) || [];
}

function saveDreams(dreams) {
  localStorage.setItem("dreams", JSON.stringify(dreams));
}

function getDreamCategory(dream) {
  if (!dream) return "Normaler Traum";

  if (dream.clarity === "Luzid") return "Luzider Traum";
  if (dream.clarity === "Albtraum") return "Albtraum";

  const descriptionLength = (dream.description || "").trim().length;

  if (descriptionLength > 0 && descriptionLength <= 120) {
    return "Kurzer Traum";
  }

  return "Normaler Traum";
}

function truncateText(text, maxLength = 90) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function openDreamModal(dream, index) {
  currentDreamIndex = index;

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
  currentDreamIndex = null;
}

function createDreamCard(dream, index) {
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

  card.addEventListener("click", () => openDreamModal(dream, index));

  return card;
}

function getFilteredDreams(dreams) {
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
  const dreams = getDreams();
  const filteredDreams = getFilteredDreams(dreams);
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
      columnDreams
        .slice()
        .reverse()
        .forEach((dream) => {
          const originalIndex = dreams.indexOf(dream);
          columnBody.appendChild(createDreamCard(dream, originalIndex));
        });
    }

    board.appendChild(column);
  });
}

function openEditForm() {
  const dreams = getDreams();
  const dream = dreams[currentDreamIndex];

  if (!dream) return;

  editTitle.value = dream.title || "";
  editDate.value = dream.date || "";
  editClarity.value = dream.clarity || "Normaler Traum";
  editMood.value = dream.mood || "Neutral";
  editSleep.value = dream.sleep || "Gut";
  editDescription.value = dream.description || "";
  editNotes.value = dream.notes || "";

  modalMenu.classList.add("hidden");
  modalView.classList.add("hidden");
  editForm.classList.remove("hidden");
}

function saveEditedDream() {
  const dreams = getDreams();

  if (currentDreamIndex === null || !dreams[currentDreamIndex]) return;

  dreams[currentDreamIndex] = {
    ...dreams[currentDreamIndex],
    title: editTitle.value.trim(),
    date: editDate.value,
    clarity: editClarity.value,
    mood: editMood.value,
    sleep: editSleep.value,
    description: editDescription.value.trim(),
    notes: editNotes.value.trim()
  };

  saveDreams(dreams);

  const updatedDream = dreams[currentDreamIndex];

  editForm.classList.add("hidden");
  modalView.classList.remove("hidden");

  openDreamModal(updatedDream, currentDreamIndex);
  renderBoard();
}

function deleteCurrentDream() {
  const confirmDelete = confirm("Möchtest du diesen Traum wirklich löschen?");

  if (!confirmDelete) return;

  const dreams = getDreams();

  if (currentDreamIndex === null || !dreams[currentDreamIndex]) return;

  dreams.splice(currentDreamIndex, 1);
  saveDreams(dreams);

  closeDreamModal();
  renderBoard();
}

/* EVENTS */

filterToggle.addEventListener("click", () => {
  archiveFilters.classList.toggle("hidden");

  if (archiveFilters.classList.contains("hidden")) {
    filterToggle.textContent = "Filter anzeigen";
  } else {
    filterToggle.textContent = "Filter ausblenden";
  }
});

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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDreamModal();
  }
});

renderBoard();