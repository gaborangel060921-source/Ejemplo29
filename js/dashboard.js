/* ==========================================================================
   dashboard.js
   Lógica específica de la página dashboard.html
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. FECHA ACTUAL
   Usamos el objeto Date de JavaScript junto con toLocaleDateString() para
   mostrar la fecha de hoy en español, con el formato "Sábado, 8 de agosto
   de 2026" (igual al diseño de Figma).
   -------------------------------------------------------------------------- */
const hoy = new Date();
const opcionesFecha = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
let fechaTexto = hoy.toLocaleDateString("es-ES", opcionesFecha);

// Pone en mayúscula la primera letra (el navegador la devuelve en minúscula)
fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

document.getElementById("fechaHoy").textContent = fechaTexto;


/* --------------------------------------------------------------------------
   2. GRÁFICO DE BARRAS — Actividad semanal (ingresos y salidas)
   Se usa la librería Chart.js, cargada por CDN en dashboard.html.
   -------------------------------------------------------------------------- */
const ctxActividad = document.getElementById("graficoActividad");

new Chart(ctxActividad, {
    type: "bar",
    data: {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
            {
                label: "Ingresos",
                data: [95, 120, 105, 140, 115, 40, 10],
                backgroundColor: "#00304d", // Azul oscuro SENA
                borderRadius: 4,
            },
            {
                label: "Salidas",
                data: [80, 105, 90, 125, 100, 30, 8],
                backgroundColor: "#39a900", // Verde SENA
                borderRadius: 4,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "top", align: "end", labels: { boxWidth: 10, usePointStyle: true } },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
            x: { grid: { display: false } },
        },
    },
});


/* --------------------------------------------------------------------------
   4. TABLA — Últimos registros de acceso
   Igual que en usuarios.js, estos datos simulan lo que vendría de un
   backend real (por ejemplo: fetch("/api/registros-acceso")).
   -------------------------------------------------------------------------- */
// Mismos registros que aparecen en Historial de Movimientos (no se
// duplica el historial completo aquí, solo un subconjunto reciente
// para el vistazo rápido del dashboard).
const registrosAcceso = [
    { nombre: "Carlos Andrés Rodríguez", hora: "07:48", documento: "12345667", evento: "Ingreso", centro: "CTGI", registro: "Permanente", portero: "Mauricio", estado: "completo" },
    { nombre: "Laura Ríos", hora: "08:03", documento: "7654321", evento: "Ingreso", centro: "CTGI", registro: "Permanente", portero: "Carlos", estado: "pendiente" },
    { nombre: "Laura Ríos", hora: "16:00", documento: "12312323", evento: "salida", centro: "CTGI", registro: "Permanente", portero: "Andrés", estado: "pendiente" }
];

function obtenerIniciales(nombreCompleto) {
    const partes = nombreCompleto.trim().split(" ");
    const primeras = partes[0][0];
    const segundas = partes.length > 1 ? partes[1][0] : "";
    return (primeras + segundas).toUpperCase();
}

// Mismo criterio que en Historial de Movimientos: "completo" = ya
// salieron todos los elementos de ese ingreso, "pendiente" = alguno
// sigue dentro. Reutiliza las mismas clases de badge (badge-activo /
// badge-pendiente) para que se vea igual en ambas pantallas.
function crearBadgeEstadoElementos(estado) {
    if (estado === "pendiente") {
        return '<span class="badge-estado badge-pendiente">Pendientes</span>';
    }
    return '<span class="badge-estado badge-activo">Completo</span>';
}

function crearFilaRegistro(registro) {
    const claseBadge = registro.evento === "Ingreso" ? "badge-ingreso" : "badge-salida";

    return `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="avatar-sm">${obtenerIniciales(registro.nombre)}</div>
                    <span class="fw-semibold">${registro.nombre}</span>
                </div>
            </td>
            <td>${registro.hora}</td>
            <td>${registro.documento}</td>
            <td><span class="badge-estado ${claseBadge}">${registro.evento}</span></td>
            <td>${crearBadgeEstadoElementos(registro.estado)}</td>
            <td><span">${registro.centro}</span></td>
            <td><span">${registro.portero}</span></td>
        </tr>
    `;
}

document.getElementById("cuerpoTablaRegistros").innerHTML =
    registrosAcceso.map(crearFilaRegistro).join("");