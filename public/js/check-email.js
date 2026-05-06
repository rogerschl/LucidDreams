const resendEmailBtn = document.getElementById("resendEmailBtn");
const resendMessage = document.getElementById("resendMessage");
const pendingEmailText = document.getElementById("pendingEmailText");

const pendingEmail = localStorage.getItem("pendingEmail");

if (pendingEmailText && pendingEmail) {
  pendingEmailText.textContent = `Gesendet an: ${pendingEmail}`;
}

function showResendMessage(text, isError = false) {
  if (!resendMessage) return;

  resendMessage.textContent = text;
  resendMessage.classList.add("show");

  if (isError) {
    resendMessage.classList.add("error");
  } else {
    resendMessage.classList.remove("error");
  }

  setTimeout(() => {
    resendMessage.classList.remove("show");
    resendMessage.classList.remove("error");
    resendMessage.textContent = "";
  }, 4000);
}

async function resendConfirmationEmail() {
  const email = localStorage.getItem("pendingEmail");

  if (!email) {
    showResendMessage(
      "Keine E-Mail gefunden. Bitte registriere dich erneut.",
      true
    );
    return;
  }

  resendEmailBtn.disabled = true;
  resendEmailBtn.textContent = "Wird gesendet...";

  const { error } = await lucidSupabase.auth.resend({
    type: "signup",
    email: email
  });

  if (error) {
    console.error("Bestätigungs-Mail konnte nicht erneut gesendet werden:", error);

    showResendMessage(
      "Die E-Mail konnte nicht erneut gesendet werden. Bitte versuche es gleich nochmal.",
      true
    );

    resendEmailBtn.disabled = false;
    resendEmailBtn.textContent = "E-Mail erneut senden";
    return;
  }

  showResendMessage("Bestätigungs-Mail wurde erneut gesendet.");

  resendEmailBtn.disabled = false;
  resendEmailBtn.textContent = "E-Mail erneut senden";
}

if (resendEmailBtn) {
  resendEmailBtn.addEventListener("click", resendConfirmationEmail);
}