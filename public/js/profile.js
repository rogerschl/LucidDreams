const profileForm = document.getElementById("profileForm");
const goalsForm = document.getElementById("goalsForm");

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const realityGoalInput = document.getElementById("realityGoalInput");
const dreamGoalInput = document.getElementById("dreamGoalInput");
const personalGoalInput = document.getElementById("personalGoalInput");

const saveMessage = document.getElementById("saveMessage");

function getProfile() {
  return JSON.parse(localStorage.getItem("profile")) || {
    name: "Roger",
    email: "",
    password: "",
    realityGoal: 8,
    dreamGoal: 5,
    personalGoal: "Ich möchte bewusster träumen und meine Traumzeichen erkennen."
  };
}

function saveProfile(profile) {
  localStorage.setItem("profile", JSON.stringify(profile));
}

function loadProfile() {
  const profile = getProfile();

  nameInput.value = profile.name || "";
  emailInput.value = profile.email || "";
  passwordInput.value = profile.password || "";

  realityGoalInput.value = profile.realityGoal || 8;
  dreamGoalInput.value = profile.dreamGoal || 5;
  personalGoalInput.value = profile.personalGoal || "";
}

function showMessage(text) {
  saveMessage.textContent = text;

  setTimeout(() => {
    saveMessage.textContent = "";
  }, 2500);
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const profile = getProfile();

  profile.name = nameInput.value.trim() || "Roger";
  profile.email = emailInput.value.trim();
  profile.password = passwordInput.value.trim();

  saveProfile(profile);
  showMessage("Profil gespeichert.");
});

goalsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const profile = getProfile();

  profile.realityGoal = Number(realityGoalInput.value) || 8;
  profile.dreamGoal = Number(dreamGoalInput.value) || 5;
  profile.personalGoal = personalGoalInput.value.trim();

  saveProfile(profile);
  showMessage("Ziele gespeichert.");
});

loadProfile();