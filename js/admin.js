/* ==========================================================================
   admin.js
   Lógica COMPARTIDA entre todas las páginas del panel administrativo
   (dashboard.html, usuarios.html, y cualquier página futura como
   dispositivos.html, vehiculos.html, etc.)
   ========================================================================== */

/* --------------------------------------------------------------------------
   SIDEBAR RESPONSIVE
   En pantallas grandes (≥992px) el sidebar siempre está visible (esto lo
   controla el CSS). En pantallas chicas está oculto por defecto y se abre
   con el botón de hamburguesa, mostrando además un fondo oscuro (backdrop)
   que al hacer clic también lo cierra.
   -------------------------------------------------------------------------- */
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");

function abrirSidebar() {
    sidebar.classList.add("sidebar-open");
    sidebarBackdrop.classList.add("show");
}

function cerrarSidebar() {
    sidebar.classList.remove("sidebar-open");
    sidebarBackdrop.classList.remove("show");
}

if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener("click", abrirSidebar);
}

if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", cerrarSidebar);
}


/* --------------------------------------------------------------------------
   PESTAÑAS DE FILTRO (Todas / Activa / Resuelta, Todos / Ingresos / Salidas)
   Esto SÍ es solo navegación visual: muestra/oculta filas que ya existen en
   el HTML según su atributo data-estado o data-tipo. No trae datos nuevos
   de ningún lado, solo filtra lo que ya está en la página.

   Cada grupo de pestañas (id del contenedor .filter-pills) se relaciona
   aquí con el <tbody> de la tabla que debe filtrar.
   -------------------------------------------------------------------------- */
const mapaFiltros = {
    filtrosAlertas: "cuerpoTablaAlertas",
    filtrosHistorial: "cuerpoTablaHistorial",
};

Object.keys(mapaFiltros).forEach((idGrupoFiltros) => {
    const grupoFiltros = document.getElementById(idGrupoFiltros);
    const cuerpoTabla = document.getElementById(mapaFiltros[idGrupoFiltros]);

    if (!grupoFiltros || !cuerpoTabla) return; // Esta página no tiene este grupo de filtros

    const botones = grupoFiltros.querySelectorAll(".filter-pill-btn");
    const filas = cuerpoTabla.querySelectorAll("tr");

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            // Marca visualmente el botón activo
            botones.forEach((b) => b.classList.remove("active"));
            boton.classList.add("active");

            const filtro = boton.dataset.filtro; // "todas", "activa", "ingreso", etc.

            filas.forEach((fila) => {
                const estadoFila = fila.dataset.estado || fila.dataset.tipo;
                const mostrar = filtro.startsWith("todo") || estadoFila === filtro;
                fila.classList.toggle("d-none", !mostrar);
            });
        });
    });
});

// Filtro de la tabla de vehículos por estado (Todos / En instalaciones / Retirados)
        document.addEventListener("DOMContentLoaded", () => {
            const filtros = document.getElementById("filtrosVehiculos");
            if (!filtros) return;

            const filas = document.querySelectorAll("#cuerpoTablaVehiculos tr[data-estado]");

            filtros.addEventListener("click", (e) => {
                const boton = e.target.closest(".filter-pill-btn");
                if (!boton) return;

                filtros.querySelectorAll(".filter-pill-btn").forEach(btn => btn.classList.remove("active"));
                boton.classList.add("active");

                const filtro = boton.dataset.filtro;
                filas.forEach(fila => {
                    fila.style.display = (filtro === "todos" || fila.dataset.estado === filtro) ? "" : "none";
                });
            });
        });

// Alterna visualmente entre el Paso 1, Paso 2 y Paso 3 del registro.
        // Esto NO guarda ni envía datos: es solo para que puedas ver cómo
        // luce cada paso. La validación y el guardado real los conecta
        // quien implemente el backend.
        //
        // Cada paso tiene su propio botón "Registrar": la idea es que, al
        // conectar el backend, ese botón dispare el envío de los datos de
        // ESE paso (usuario, dispositivo o vehículo) sin necesidad de
        // completar los pasos siguientes. El botón "Siguiente" solo cambia
        // la tarjeta visible, no guarda nada.
        (function () {
            const cards = {
                1: document.getElementById('paso1Card'),
                2: document.getElementById('paso2Card'),
                3: document.getElementById('paso3Card')
            };
            const circles = {
                1: document.getElementById('stepCircle1'),
                2: document.getElementById('stepCircle2'),
                3: document.getElementById('stepCircle3')
            };
            const labels = {
                1: document.getElementById('stepLabel1'),
                2: document.getElementById('stepLabel2'),
                3: document.getElementById('stepLabel3')
            };

            function irAlPaso(destino) {
                // Oculta todas las tarjetas y muestra solo la del paso destino
                Object.keys(cards).forEach(function (n) {
                    cards[n].style.display = (Number(n) === destino) ? 'block' : 'none';
                });

                // Actualiza el estado visual de cada círculo/etiqueta según
                // si es un paso ya completado, el paso activo o uno pendiente
                Object.keys(circles).forEach(function (nStr) {
                    const n = Number(nStr);
                    const circle = circles[n];
                    const label = labels[n];

                    circle.classList.remove('step-active', 'step-pending', 'step-complete');
                    label.classList.remove('step-label-pending');

                    if (n < destino) {
                        circle.classList.add('step-complete');
                        circle.innerHTML = '<i class="bi bi-check-lg"></i>';
                        label.classList.add('step-label-pending');
                    } else if (n === destino) {
                        circle.classList.add('step-active');
                        circle.textContent = String(n);
                    } else {
                        circle.classList.add('step-pending');
                        circle.textContent = String(n);
                        label.classList.add('step-label-pending');
                    }
                });
            }

            // Navegación entre pasos (solo cambia la vista)
            document.getElementById('btnSiguientePaso').addEventListener('click', function () { irAlPaso(2); });
            document.getElementById('btnAnteriorPaso1').addEventListener('click', function () { irAlPaso(1); });
            document.getElementById('btnSiguientePaso2').addEventListener('click', function () { irAlPaso(3); });
            document.getElementById('btnAnteriorPaso2').addEventListener('click', function () { irAlPaso(2); });

            // Botones "Registrar" de cada paso: aquí es donde, al conectar
            // el backend, se debe hacer el envío real de los datos de ese
            // paso (fetch/AJAX a la API). Por ahora solo dejamos el punto
            // de enganche.
            document.getElementById('btnRegistrarPaso1').addEventListener('click', function () {
                // TODO: enviar datos del Paso 1 (usuario) a la API
                console.log('Registrar Paso 1: datos del usuario');
            });
            document.getElementById('btnRegistrarPaso2').addEventListener('click', function () {
                // TODO: enviar datos del Paso 2 (dispositivo) a la API
                console.log('Registrar Paso 2: datos del dispositivo');
            });
            document.getElementById('btnRegistrarPaso3').addEventListener('click', function () {
                // TODO: enviar datos del Paso 3 (vehículo) a la API
                console.log('Registrar Paso 3: datos del vehículo');
            });
        })();