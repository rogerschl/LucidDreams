const dreamForm = document.getElementById("dreamForm");

const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];

if (dateInput && !dateInput.value) {
  dateInput.value = today;
}
const clarityInput = document.getElementById("clarity");
const moodInput = document.getElementById("mood");
const sleepInput = document.getElementById("sleep");
const descriptionInput = document.getElementById("description");
const notesInput = document.getElementById("notes");

const tagOptions = document.querySelectorAll(".dream-tag");
const selectedTagsContainer = document.getElementById("selectedTags");
const newTagInput = document.getElementById("newTagInput");
const addTagBtn = document.getElementById("addTagBtn");

let selectedTags = [];

function getDreams() {
  return JSON.parse(localStorage.getItem("dreams")) || [];
}

function saveDreams(dreams) {
  localStorage.setItem("dreams", JSON.stringify(dreams));
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
  tagOptions.forEach((button) => {
    const tag = button.textContent.trim();

    if (selectedTags.includes(tag)) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

tagOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const tag = button.textContent.trim();

    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((item) => item !== tag);
    } else {
      selectedTags.push(tag);
    }

    updateActiveButtons();
    renderSelectedTags();
  });
});

addTagBtn.addEventListener("click", () => {
  const newTag = newTagInput.value.trim();

  if (newTag === "") return;

  if (!selectedTags.includes(newTag)) {
    selectedTags.push(newTag);
  }

  newTagInput.value = "";
  renderSelectedTags();
});

newTagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTagBtn.click();
  }
});

dreamForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (title === "" || description === "") {
    alert("Bitte gib mindestens einen Titel und eine Beschreibung ein.");
    return;
  }

  const newDream = {
    title: title,
    date: dateInput.value,
    clarity: clarityInput.value,
    mood: moodInput.value,
    sleep: sleepInput.value,
    description: description,
    notes: notesInput.value.trim(),
    tags: selectedTags
  };

  const dreams = getDreams();
  dreams.push(newDream);
  saveDreams(dreams);

  dreamForm.reset();
  selectedTags = [];
  updateActiveButtons();
  renderSelectedTags();

  alert("Traum gespeichert!");
});

renderSelectedTags();