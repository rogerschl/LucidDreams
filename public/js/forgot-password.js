const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetEmailInput = document.getElementById("resetEmail");
const resetMessage = document.getElementById("resetMessage");

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = resetEmailInput.value.trim();

    if(!email) {
        resetMessage.textContent = "Bitte gib deine E-Mail-Adresse ein.";
        return;
    }

    const redirectUrl = new URL("./reset-password.html", window.location.href).href;

    const { error } = await lucidSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl

    });

    if(error){
        console.error("Reset-Mail konnte nicht gesendet werden; ",error);
        resetMessage.textContent = "Die Anfrage konnte nicht gesendet werden";
        return;
    }
    resetMessage.textContent = 
    "Wenn diese E-Mail registriert ist, erhältst du gleich einen Link zum Zurücksetzen";

    forgotPasswordForm.reset()
}) ;