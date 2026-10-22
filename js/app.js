/* ==========================================================================
   app.js
   Este archivo, por ahora, SOLO contiene interacciones puramente visuales
   (cosas que no dependen de un backend): cambiar de pestaña entre
   "Iniciar Sesión" y "Registrarse".

   A propósito NO incluye:
   - Validación de los formularios.
   - Autenticación / inicio de sesión real.
   - Registro real de usuarios.
   Esa lógica la agregarás tú más adelante, probablemente conectando estos
   formularios a una API con fetch(), por ejemplo:

   formLogin.addEventListener("submit", (evento) => {
       evento.preventDefault();
       // fetch("/api/login", { method: "POST", body: ... }) ...
   });
   ========================================================================== */

/* --------------------------------------------------------------------------
   CAMBIO ENTRE PESTAÑAS: INICIAR SESIÓN / REGISTRARSE
   -------------------------------------------------------------------------- */
const btnTabLogin = document.getElementById("btnTabLogin");
const btnTabRegister = document.getElementById("btnTabRegister");
const panelLogin = document.getElementById("panelLogin");
const panelRegister = document.getElementById("panelRegister");

function mostrarPestana(pestana) {
    const esLogin = pestana === "login";

    btnTabLogin.classList.toggle("active", esLogin);
    btnTabRegister.classList.toggle("active", !esLogin);

    panelLogin.classList.toggle("d-none", !esLogin);
    panelRegister.classList.toggle("d-none", esLogin);
}

btnTabLogin.addEventListener("click", () => mostrarPestana("login"));
btnTabRegister.addEventListener("click", () => mostrarPestana("register"));


/* --------------------------------------------------------------------------
   Evita que los formularios recarguen la página al enviarlos (comportamiento
   por defecto del HTML). No hacen nada más todavía: ni validan ni envían
   datos a ningún lado.
   -------------------------------------------------------------------------- */
document.getElementById("formLogin").addEventListener("submit", (evento) => {
    evento.preventDefault();
    // TODO: aquí conectarás la lógica real de inicio de sesión.
});

document.getElementById("formRegister").addEventListener("submit", (evento) => {
    evento.preventDefault();
    // TODO: aquí conectarás la lógica real de registro.
});
