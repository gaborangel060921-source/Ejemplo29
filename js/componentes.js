document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // CARGAR SIDEBAR
    // =========================

    fetch("componentes/sidebar.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo cargar el sidebar");
            }

            return response.text();
        })
        .then(data => {

            document.getElementById("sidebar-container").innerHTML = data;

            activarPaginaActual();
            inicializarMenuRegistrar();

        })
        .catch(error => {
            console.error("Error:", error);
        });


    // =========================
    // ACTIVAR PÁGINA ACTUAL
    // =========================

    function activarPaginaActual() {

        const paginaActual = window.location.pathname
            .split("/")
            .pop()
            .replace(".html", "");

        const enlaces = document.querySelectorAll(".nav-link");

        enlaces.forEach(enlace => {

            const pagina = enlace.getAttribute("data-page");

            if (pagina === paginaActual) {
                enlace.classList.add("active");
            }

        });

    }


    // =========================
    // SUBMENÚ "REGISTRAR" (NUEVO)
    // =========================
    // Se encarga de 3 cosas:
    //  1) Ocultar la opción "Portero" cuando el usuario conectado no es
    //     administrador (se lee de <body data-user-role="admin|portero">).
    //  2) Abrir/cerrar el submenú al hacer clic (funciona igual en
    //     computador y en celular, con targets grandes y fáciles de tocar).
    //  3) Dejar el submenú abierto y marcar la opción activa cuando ya
    //     estamos dentro de registrar_general.html / registrar-usuario.html,
    //     usando el parámetro ?tipo= de la URL.
    //
    // Esta misma función se puede llamar tanto después de inyectar el
    // sidebar por fetch (páginas de administrador) como directamente en
    // páginas que ya traen el sidebar en el HTML (ej. registrar-usuario.html
    // del panel de portería), por eso valida que los elementos existan
    // antes de usarlos.
    window.inicializarMenuRegistrar = function inicializarMenuRegistrar() {

        const esAdmin = document.body.getAttribute("data-user-role") === "admin";

        document.querySelectorAll('[data-admin-only="true"]').forEach(el => {
            if (!esAdmin) {
                el.remove();
            }
        });

        const btnDropdown = document.getElementById("btnRegistrarDropdown");
        const submenu = document.getElementById("registrarSubmenu");

        if (!btnDropdown || !submenu) {
            return;
        }

        // Evita registrar el mismo listener dos veces si la función
        // se llama más de una vez en la misma página.
        if (btnDropdown.dataset.registrarInit === "true") {
            return;
        }
        btnDropdown.dataset.registrarInit = "true";

        const paginaActual = window.location.pathname.split("/").pop();
        const estamosEnRegistro = paginaActual === "registrar_general.html" ||
            paginaActual === "registrar-usuario.html";

        if (estamosEnRegistro) {
            submenu.classList.add("open");
            btnDropdown.setAttribute("aria-expanded", "true");
            btnDropdown.classList.add("active");

            const parametros = new URLSearchParams(window.location.search);
            const tipoActual = parametros.get("tipo");

            submenu.querySelectorAll(".nav-sublink").forEach(link => {
                link.classList.toggle("active", link.dataset.registroTipo === tipoActual);
            });
        }

        btnDropdown.addEventListener("click", function () {
            const abierto = submenu.classList.toggle("open");
            btnDropdown.setAttribute("aria-expanded", abierto ? "true" : "false");
        });
    };

    // Para páginas donde el sidebar ya viene en el HTML (no se carga por
    // fetch), inicializamos el submenú apenas el DOM está listo.
    if (document.getElementById("registrarSubmenu")) {
        inicializarMenuRegistrar();
    }

});
