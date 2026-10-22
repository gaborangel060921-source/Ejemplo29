/* ==========================================================================
   escanear-qr.js
   Lógica específica de la página escanear-qr.html:

     - Base de datos de usuarios de prueba. En producción, esto vendría de
       la API/backend real. IMPORTANTE: cada usuario ahora puede tener
       VARIOS computadores y VARIOS vehículos registrados (arreglos, ya no
       un solo objeto), y un campo `ingresoActivo` que representa el
       MOVIMIENTO (ingreso) que tiene abierto en este momento, si lo tiene.

     - Generación de un QR real (librería qrcodejs) para poder probar el
       flujo completo sin necesidad de un QR físico.

     - Búsqueda de usuario por código manual o por "escaneo simulado".

     - Panel derecho dinámico:
         · Si el usuario NO tiene un ingreso activo -> flujo de INGRESO:
           se listan todos sus computadores/vehículos registrados como
           tarjetas seleccionables (checkbox), el portero marca cuáles
           entran físicamente y confirma.
         · Si el usuario SÍ tiene un ingreso activo -> flujo de SALIDA:
           se muestra la hora de ingreso y los elementos con los que
           entró, ya marcados por defecto; el portero puede desmarcar los
           que no está sacando y confirma la salida.
         · Si el usuario no tiene computadores ni vehículos registrados,
           no se pide ninguna selección: el ingreso/salida se confirma
           directo.

   NOTA DE DISEÑO (preparación para backend):
     Un "movimiento" (ingreso o salida) se modela conceptualmente como:
       {
         usuarioId, tipo: 'ingreso' | 'salida', fechaHora,
         computadores: [idComputador, ...],
         vehiculos: [idVehiculo, ...],
         porteroResponsable
       }
     Por ahora esto vive solo en memoria (usuario.ingresoActivo), pero la
     forma de los datos ya está pensada para mapear 1:1 con lo que
     mandaría/recibiría una API real.
   ========================================================================== */

/* --------------------------------------------------------------------------
   BASE DE DATOS DE PRUEBA
   -------------------------------------------------------------------------- */
const usuariosDB = [
    // Caso 5: computadores Y vehículos, sin ingreso activo (caso "normal")
    {
        codigo: "34567",
        documento: "1032456789",
        nombre: "Laura Fernanda Ríos",
        programa: "Tecnología en Análisis y Desarrollo de Software",
        rol: "Aprendiz",
        computadores: [
            { id: "c-laura-1", marca: "Dell", modelo: "Latitude 5420", serial: "DL5420-88231", icono: "bi-laptop", estado: "disponible" }
        ],
        vehiculos: [
            { id: "v-laura-1", tipo: "Motocicleta", marca: "Yamaha", modelo: "FZ", placa: "ABC123", icono: "bi-scooter", estado: "disponible" }
        ],
        ingresoActivo: null
    },

    // Caso 2: varios computadores, ningún vehículo
    {
        codigo: "11111",
        documento: "1098765432",
        nombre: "Carlos Andrés Rodríguez",
        programa: "Tecnología en Gestión Industrial",
        rol: "Aprendiz",
        computadores: [
            { id: "c-carlos-1", marca: "Dell", modelo: "Latitude 5420", serial: "DL5420-99001", icono: "bi-laptop", estado: "disponible" },
            { id: "c-carlos-2", marca: "Lenovo", modelo: "ThinkPad E14", serial: "LNV-83921", icono: "bi-laptop", estado: "disponible" },
            { id: "c-carlos-3", marca: "HP", modelo: "250 G8", serial: "HP-55231", icono: "bi-laptop", estado: "inactivo" }
        ],
        vehiculos: [],
        ingresoActivo: null
    },

    // Caso 3: un vehículo, ningún computador
    {
        codigo: "22222",
        documento: "1076543211",
        nombre: "Mariana Gómez Pérez",
        programa: "Contrato de Aprendizaje",
        rol: "Aprendiz",
        computadores: [],
        vehiculos: [
            { id: "v-mariana-1", tipo: "Carro", marca: "Chevrolet", modelo: "Spark", placa: "XYZ789", icono: "bi-car-front", estado: "disponible" }
        ],
        ingresoActivo: null
    },

    // Caso 4: varios vehículos
    {
        codigo: "33333",
        documento: "1045678902",
        nombre: "Andrés Felipe Martínez",
        programa: "Instructor",
        rol: "Instructor",
        computadores: [],
        vehiculos: [
            { id: "v-andres-1", tipo: "Motocicleta", marca: "Yamaha", modelo: "FZ", placa: "GHI321", icono: "bi-scooter", estado: "disponible" },
            { id: "v-andres-2", tipo: "Carro", marca: "Renault", modelo: "Logan", placa: "JKL654", icono: "bi-car-front", estado: "disponible" }
        ],
        ingresoActivo: null
    },

    // Caso: sin computadores ni vehículos registrados
    {
        codigo: "55555",
        documento: "1090001122",
        nombre: "Sofía Valentina Cruz",
        programa: "Visitante",
        rol: "Visitante",
        computadores: [],
        vehiculos: [],
        ingresoActivo: null
    },

    // Caso: usuario que YA está dentro (para probar el flujo de SALIDA
    // sin tener que registrar un ingreso primero). Entró con su único
    // computador; su vehículo registrado no forma parte de este ingreso.
    {
        codigo: "66666",
        documento: "1067788990",
        nombre: "Diego Alejandro Torres",
        programa: "Tecnología en Sistemas",
        rol: "Aprendiz",
        computadores: [
            { id: "c-diego-1", marca: "HP", modelo: "250 G8", serial: "HP-77410", icono: "bi-laptop", estado: "disponible" }
        ],
        vehiculos: [
            { id: "v-diego-1", tipo: "Motocicleta", marca: "Suzuki", modelo: "Gixxer", placa: "MNO987", icono: "bi-scooter", estado: "disponible" }
        ],
        ingresoActivo: {
            hora: "08:03 AM",
            computadores: ["c-diego-1"],
            vehiculos: []
        }
    }
];

/* --------------------------------------------------------------------------
   REFERENCIAS AL DOM
   -------------------------------------------------------------------------- */
const inputCodigoQR = document.getElementById("inputCodigoQR");
const btnBuscarQR = document.getElementById("btnBuscarQR");
const avisoNoEncontrado = document.getElementById("avisoNoEncontrado");

const selectUsuarioPrueba = document.getElementById("selectUsuarioPrueba");
const btnGenerarQR = document.getElementById("btnGenerarQR");
const qrGeneradoWrapper = document.getElementById("qrGeneradoWrapper");
const qrGeneradoCanvas = document.getElementById("qrGeneradoCanvas");
const qrGeneradoCodigo = document.getElementById("qrGeneradoCodigo");
const btnSimularEscaneo = document.getElementById("btnSimularEscaneo");

const listaUsuariosPrueba = document.getElementById("listaUsuariosPrueba");
const resultadoUsuario = document.getElementById("resultadoUsuario");
const plantillaResultado = document.getElementById("plantillaResultado");

// NUEVO: modal compartido de "Ver imagen" (computador/vehículo)
const modalVerImagenEl = document.getElementById("modalVerImagenElemento");
// eslint-disable-next-line no-undef
const modalVerImagen = new bootstrap.Modal(modalVerImagenEl);
const modalVerImagenTitulo = document.getElementById("modalVerImagenTitulo");
const modalVerImagenContenedor = document.getElementById("modalVerImagenContenedor");
const modalVerImagenIcono = document.getElementById("modalVerImagenIcono");
const modalVerImagenLabel1 = document.getElementById("modalVerImagenLabel1");
const modalVerImagenValor1 = document.getElementById("modalVerImagenValor1");
const modalVerImagenLabel2 = document.getElementById("modalVerImagenLabel2");
const modalVerImagenValor2 = document.getElementById("modalVerImagenValor2");

let codigoQRActivo = ""; // último código generado, listo para "simular escaneo"

/* --------------------------------------------------------------------------
   INICIALIZACIÓN: llena el select y la lista de códigos de prueba
   -------------------------------------------------------------------------- */
function inicializarListasDePrueba() {
    usuariosDB.forEach((usuario) => {
        const option = document.createElement("option");
        option.value = usuario.codigo;
        option.textContent = `${usuario.nombre} (${usuario.codigo})`;
        selectUsuarioPrueba.appendChild(option);

        const etiquetaEstado = usuario.ingresoActivo ? " · dentro" : "";
        const fila = document.createElement("div");
        fila.className = "demo-row";
        fila.innerHTML = `
            <span>${usuario.nombre} — <strong>${usuario.codigo}</strong>${etiquetaEstado}</span>
            <button type="button" class="btn-demo-usar" data-codigo="${usuario.codigo}">Usar</button>
        `;
        listaUsuariosPrueba.appendChild(fila);
    });
}
inicializarListasDePrueba();

// Botones "Usar" de la lista de prueba: colocan el código en el input y buscan
listaUsuariosPrueba.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".btn-demo-usar");
    if (!boton) return;
    inputCodigoQR.value = boton.dataset.codigo;
    buscarPorCodigo(boton.dataset.codigo);
});

/* --------------------------------------------------------------------------
   GENERAR QR DE PRUEBA (código real, escaneable con el celular)
   -------------------------------------------------------------------------- */
btnGenerarQR.addEventListener("click", () => {
    const codigoSeleccionado = selectUsuarioPrueba.value;

    if (!codigoSeleccionado) {
        selectUsuarioPrueba.classList.add("border", "border-danger");
        setTimeout(() => selectUsuarioPrueba.classList.remove("border", "border-danger"), 1200);
        return;
    }

    // Limpia el QR anterior antes de dibujar el nuevo
    qrGeneradoCanvas.innerHTML = "";
    // eslint-disable-next-line no-undef
    new QRCode(qrGeneradoCanvas, {
        text: codigoSeleccionado,
        width: 150,
        height: 150,
        colorDark: "#0a1a3d",
        colorLight: "#ffffff"
    });

    qrGeneradoCodigo.textContent = codigoSeleccionado;
    qrGeneradoWrapper.classList.remove("d-none");
    codigoQRActivo = codigoSeleccionado;
});

// "Simular Escaneo de este QR": toma el código recién generado y dispara
// la misma búsqueda que haría una cámara real al leerlo
btnSimularEscaneo.addEventListener("click", () => {
    if (!codigoQRActivo) return;
    inputCodigoQR.value = codigoQRActivo;
    buscarPorCodigo(codigoQRActivo);
});

/* --------------------------------------------------------------------------
   BÚSQUEDA MANUAL
   -------------------------------------------------------------------------- */
btnBuscarQR.addEventListener("click", () => buscarPorCodigo(inputCodigoQR.value));
inputCodigoQR.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") buscarPorCodigo(inputCodigoQR.value);
});

function buscarPorCodigo(valorCrudo) {
    const valor = (valorCrudo || "").trim().toLowerCase();
    avisoNoEncontrado.style.display = "none";

    if (!valor) return;

    const usuario = usuariosDB.find((u) =>
        u.codigo.toLowerCase() === valor ||
        u.documento.toLowerCase() === valor ||
        u.vehiculos.some((v) => v.placa.toLowerCase() === valor)
    );

    if (!usuario) {
        avisoNoEncontrado.style.display = "block";
        renderizarEstadoVacio();
        return;
    }

    renderizarUsuario(usuario);
}

/* --------------------------------------------------------------------------
   RENDER: estado vacío
   -------------------------------------------------------------------------- */
function renderizarEstadoVacio() {
    resultadoUsuario.innerHTML = `
        <div class="qr-side-panel" id="estadoVacio">
            <i class="bi bi-person-fill"></i>
            <p>Escanea o ingresa un código QR para ver la información del usuario</p>
        </div>
    `;
}

/* --------------------------------------------------------------------------
   HELPERS: construir una tarjeta seleccionable de computador/vehículo
   -------------------------------------------------------------------------- */

// Devuelve { titulo, subtitulo } listos para mostrar según el tipo de item
function textoElemento(item, tipo) {
    if (tipo === "computador") {
        return { titulo: `${item.marca} ${item.modelo}`, subtitulo: `Serial: ${item.serial}` };
    }
    return { titulo: `${item.marca} ${item.modelo}`, subtitulo: `Placa: ${item.placa}` };
}

/**
 * Abre el modal de "Ver imagen" con la información del computador o
 * vehículo seleccionado. Si el item trae `item.imagenUrl` (vendría del
 * backend, ej. foto subida al registrar el equipo/vehículo), se muestra
 * esa imagen real; si no, se muestra el mismo placeholder con ícono que
 * ya usan los módulos de Vehículos/Dispositivos mientras no hay fotos
 * reales cargadas.
 */
function abrirModalImagenElemento(item, tipo) {
    const esComputador = tipo === "computador";

    modalVerImagenTitulo.textContent = esComputador ? "Imagen del computador" : "Imagen del vehículo";

    if (item.imagenUrl) {
        modalVerImagenContenedor.innerHTML = `<img src="${item.imagenUrl}" alt="Imagen registrada" class="img-fluid rounded">`;
    } else {
        modalVerImagenContenedor.innerHTML = `
            <i class="bi ${item.icono || (esComputador ? "bi-laptop" : "bi-car-front")}"></i>
            <span>Imagen del ${esComputador ? "computador" : "vehículo"} (vendrá del backend)</span>
        `;
    }

    if (esComputador) {
        modalVerImagenLabel1.textContent = "Equipo";
        modalVerImagenValor1.textContent = `${item.marca} ${item.modelo}`;
        modalVerImagenLabel2.textContent = "Serial";
        modalVerImagenValor2.textContent = item.serial;
    } else {
        modalVerImagenLabel1.textContent = "Vehículo";
        modalVerImagenValor1.textContent = `${item.marca} ${item.modelo} (${item.tipo})`;
        modalVerImagenLabel2.textContent = "Placa";
        modalVerImagenValor2.textContent = item.placa;
    }

    modalVerImagen.show();
}

/**
 * Crea el nodo DOM de una tarjeta seleccionable.
 * @param {object} item - computador o vehículo
 * @param {"computador"|"vehiculo"} tipo
 * @param {boolean} seleccionadoInicial
 * @param {(item, tipo, seleccionado) => void} onCambio - callback cuando cambia la selección
 */
function crearTarjetaElemento(item, tipo, seleccionadoInicial, onCambio) {
    const { titulo, subtitulo } = textoElemento(item, tipo);
    const icono = item.icono || (tipo === "computador" ? "bi-laptop" : "bi-car-front");
    const deshabilitado = item.estado === "inactivo";

    const tarjeta = document.createElement("div");
    tarjeta.className = "elemento-check-card";
    if (seleccionadoInicial) tarjeta.classList.add("seleccionado");
    if (deshabilitado) tarjeta.classList.add("deshabilitado");
    tarjeta.dataset.id = item.id;
    tarjeta.dataset.tipo = tipo;

    let badgeEstadoHtml = "";
    if (item.estado === "inactivo") {
        badgeEstadoHtml = `<span class="elemento-check-estado estado-inactivo">Inactivo</span>`;
    } else if (item.estado === "dentro") {
        badgeEstadoHtml = `<span class="elemento-check-estado estado-dentro">Ya está dentro</span>`;
    }

    tarjeta.innerHTML = `
        <div class="elemento-check-box"><i class="bi bi-check-lg"></i></div>
        <div class="elemento-check-icono"><i class="bi ${icono}"></i></div>
        <div class="elemento-check-info">
            <div class="elemento-check-titulo">${titulo}</div>
            <div class="elemento-check-subtitulo">${subtitulo}</div>
        </div>
        ${badgeEstadoHtml}
        <button type="button" class="elemento-ver-imagen-btn" data-accion="ver-imagen" title="Ver imagen" aria-label="Ver imagen">
            <i class="bi bi-image"></i>
        </button>
    `;

    // El botón "Ver imagen" no debe marcar/desmarcar la tarjeta, así que
    // detiene la propagación del clic antes de abrir el modal.
    tarjeta.querySelector('[data-accion="ver-imagen"]').addEventListener("click", (evento) => {
        evento.stopPropagation();
        abrirModalImagenElemento(item, tipo);
    });

    if (!deshabilitado) {
        tarjeta.addEventListener("click", () => {
            const nuevoValor = !tarjeta.classList.contains("seleccionado");
            tarjeta.classList.toggle("seleccionado", nuevoValor);
            onCambio(item, tipo, nuevoValor);
        });
    }

    return tarjeta;
}

/* --------------------------------------------------------------------------
   RENDER: tarjeta de usuario encontrado (flujo de INGRESO o SALIDA)
   -------------------------------------------------------------------------- */
function renderizarUsuario(usuario) {
    const modo = usuario.ingresoActivo ? "salida" : "ingreso";

    const nodo = plantillaResultado.content.cloneNode(true);
    const tarjeta = nodo.querySelector(".resultado-usuario-card");

    /* ---------- Encabezado con datos del usuario ---------- */
    const iniciales = usuario.nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0])
        .join("")
        .toUpperCase();

    tarjeta.querySelector('[data-campo="avatar"]').textContent = iniciales;
    tarjeta.querySelector('[data-campo="nombre"]').textContent = usuario.nombre;
    tarjeta.querySelector('[data-campo="meta"]').textContent =
        `CC ${usuario.documento}${usuario.programa ? " · " + usuario.programa : ""}`;
    tarjeta.querySelector('[data-campo="badgeRol"]').textContent = usuario.rol || "Usuario";

    /* ---------- Bloque "ingreso activo" (solo en SALIDA) ---------- */
    if (modo === "salida") {
        const bloque = tarjeta.querySelector('[data-campo="bloqueIngresoActivo"]');
        bloque.classList.remove("d-none");
        tarjeta.querySelector('[data-campo="horaIngresoActivo"]').textContent = usuario.ingresoActivo.hora;
    }

    /* ---------- Estado de selección en memoria ----------
       modo ingreso: arranca vacío, el portero marca lo que entra.
       modo salida: arranca con lo que quedó registrado en el ingreso
       activo, ya marcado, y el portero puede desmarcar lo que no sale. */
    const seleccion = {
        computadores: new Set(modo === "salida" ? usuario.ingresoActivo.computadores : []),
        vehiculos: new Set(modo === "salida" ? usuario.ingresoActivo.vehiculos : [])
    };

    /* ---------- Construcción de las listas de elementos ---------- */
    const contenedorListas = tarjeta.querySelector('[data-campo="listaElementos"]');

    // En modo salida solo se muestran los elementos que estaban en el
    // ingreso activo (no todo lo que el usuario tiene registrado).
    const computadoresAMostrar = modo === "salida"
        ? usuario.computadores.filter((c) => usuario.ingresoActivo.computadores.includes(c.id))
        : usuario.computadores;

    const vehiculosAMostrar = modo === "salida"
        ? usuario.vehiculos.filter((v) => usuario.ingresoActivo.vehiculos.includes(v.id))
        : usuario.vehiculos;

    const hayComputadoresRegistrados = usuario.computadores.length > 0;
    const hayVehiculosRegistrados = usuario.vehiculos.length > 0;
    const noTieneNadaRegistrado = !hayComputadoresRegistrados && !hayVehiculosRegistrados;

    function actualizarResumen() {
        actualizarResumenBox(tarjeta, usuario, seleccion, modo);
    }

    if (modo === "ingreso" && noTieneNadaRegistrado) {
        // Caso: usuario sin computadores ni vehículos -> se sigue directo,
        // sin pedir ninguna selección.
        const aviso = document.createElement("div");
        aviso.className = "elementos-vacio-msg";
        aviso.textContent = "Este usuario no tiene computadores ni vehículos registrados. Puedes continuar con el ingreso directamente.";
        contenedorListas.appendChild(aviso);
    } else {
        // Sección de computadores
        const seccionComputadores = document.createElement("div");
        seccionComputadores.className = "elementos-seccion";
        const tituloComputadores = document.createElement("div");
        tituloComputadores.className = "elementos-seccion-titulo";
        tituloComputadores.innerHTML = `<i class="bi bi-laptop"></i> ${modo === "salida" ? "Ingresó con estos computadores" : "Computadores registrados"}`;
        seccionComputadores.appendChild(tituloComputadores);

        if (computadoresAMostrar.length === 0) {
            const vacio = document.createElement("div");
            vacio.className = "elementos-vacio-msg";
            vacio.textContent = "No tiene computadores registrados.";
            seccionComputadores.appendChild(vacio);
        } else {
            computadoresAMostrar.forEach((comp) => {
                const yaSeleccionado = seleccion.computadores.has(comp.id);
                const tarjetaEl = crearTarjetaElemento(comp, "computador", yaSeleccionado, (item, tipo, valor) => {
                    if (valor) seleccion.computadores.add(item.id);
                    else seleccion.computadores.delete(item.id);
                    actualizarResumen();
                });
                seccionComputadores.appendChild(tarjetaEl);
            });
        }
        contenedorListas.appendChild(seccionComputadores);

        // Sección de vehículos
        const seccionVehiculos = document.createElement("div");
        seccionVehiculos.className = "elementos-seccion";
        const tituloVehiculos = document.createElement("div");
        tituloVehiculos.className = "elementos-seccion-titulo";
        tituloVehiculos.innerHTML = `<i class="bi bi-car-front"></i> ${modo === "salida" ? "Ingresó con estos vehículos" : "Vehículos registrados"}`;
        seccionVehiculos.appendChild(tituloVehiculos);

        if (vehiculosAMostrar.length === 0) {
            const vacio = document.createElement("div");
            vacio.className = "elementos-vacio-msg";
            vacio.textContent = "No tiene vehículos registrados.";
            seccionVehiculos.appendChild(vacio);
        } else {
            vehiculosAMostrar.forEach((veh) => {
                const yaSeleccionado = seleccion.vehiculos.has(veh.id);
                const tarjetaEl = crearTarjetaElemento(veh, "vehiculo", yaSeleccionado, (item, tipo, valor) => {
                    if (valor) seleccion.vehiculos.add(item.id);
                    else seleccion.vehiculos.delete(item.id);
                    actualizarResumen();
                });
                seccionVehiculos.appendChild(tarjetaEl);
            });
        }
        contenedorListas.appendChild(seccionVehiculos);
    }

    // Resumen inicial (ya con lo pre-seleccionado en modo salida)
    actualizarResumen();

    /* ---------- Confirmar ingreso / salida ---------- */
    const btnConfirmar = tarjeta.querySelector('[data-accion="confirmar"]');
    const btnConfirmarTexto = tarjeta.querySelector('[data-campo="btnConfirmarTexto"]');
    const mensajeExito = tarjeta.querySelector('[data-campo="mensajeExito"]');
    const btnNuevoEscaneo = tarjeta.querySelector('[data-accion="nuevoEscaneo"]');

    btnConfirmarTexto.textContent = modo === "salida" ? "Confirmar Salida" : "Confirmar Ingreso";

    btnConfirmar.addEventListener("click", () => {
        const horaActual = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
        const listaComp = [...seleccion.computadores];
        const listaVeh = [...seleccion.vehiculos];

        if (modo === "ingreso") {
            // TODO backend: aquí se enviaría el movimiento a la API:
            // { usuarioId: usuario.documento, tipo: 'ingreso', fechaHora: ...,
            //   computadores: listaComp, vehiculos: listaVeh, porteroResponsable: ... }
            usuario.ingresoActivo = { hora: horaActual, computadores: listaComp, vehiculos: listaVeh };

            mensajeExito.textContent = noTieneNadaRegistrado
                ? `Ingreso registrado para ${usuario.nombre} a las ${horaActual}, sin elementos asociados.`
                : `Ingreso registrado para ${usuario.nombre} a las ${horaActual} (${listaComp.length + listaVeh.length} elemento(s) seleccionado(s)).`;
        } else {
            // TODO backend: aquí se enviaría el movimiento de salida a la
            // API y se cerraría el ingreso activo del lado del servidor.
            const sinElementosEnIngreso = usuario.ingresoActivo.computadores.length === 0 && usuario.ingresoActivo.vehiculos.length === 0;
            mensajeExito.textContent = sinElementosEnIngreso
                ? `Salida registrada para ${usuario.nombre} a las ${horaActual}.`
                : `Salida registrada para ${usuario.nombre} a las ${horaActual} (${listaComp.length + listaVeh.length} elemento(s) verificado(s)).`;

            usuario.ingresoActivo = null;
        }

        mensajeExito.classList.remove("d-none");
        btnConfirmar.disabled = true;
        tarjeta.querySelectorAll(".elemento-check-card:not(.deshabilitado)").forEach((c) => {
            c.style.pointerEvents = "none";
        });
        btnNuevoEscaneo.classList.remove("d-none");
    });

    btnNuevoEscaneo.addEventListener("click", () => {
        renderizarEstadoVacio();
        inputCodigoQR.value = "";
        qrGeneradoWrapper.classList.add("d-none");
        selectUsuarioPrueba.value = "";
        codigoQRActivo = "";
    });

    resultadoUsuario.innerHTML = "";
    resultadoUsuario.appendChild(nodo);
}

/* --------------------------------------------------------------------------
   Construye/actualiza el bloque de resumen ("Elementos seleccionados: N")
   antes del botón de confirmar.
   -------------------------------------------------------------------------- */
function actualizarResumenBox(tarjeta, usuario, seleccion, modo) {
    const resumenBox = tarjeta.querySelector('[data-campo="resumenBox"]');
    const resumenTitulo = tarjeta.querySelector('[data-campo="resumenTitulo"]');
    const resumenContenido = tarjeta.querySelector('[data-campo="resumenContenido"]');

    const noTieneNadaRegistrado = usuario.computadores.length === 0 && usuario.vehiculos.length === 0;
    if (noTieneNadaRegistrado) {
        // No hay nada que resumir: ya se mostró el mensaje informativo arriba.
        resumenBox.classList.add("d-none");
        return;
    }

    resumenBox.classList.remove("d-none");

    const idsComp = [...seleccion.computadores];
    const idsVeh = [...seleccion.vehiculos];
    const total = idsComp.length + idsVeh.length;

    resumenTitulo.textContent = total > 0
        ? `Elementos seleccionados: ${total}`
        : (modo === "salida" ? "Elementos a verificar en esta salida" : "Elementos seleccionados");

    if (total === 0) {
        resumenContenido.innerHTML = `<div class="resumen-sin-elementos">La persona ${modo === "salida" ? "saldrá" : "ingresará"} sin elementos asociados.</div>`;
        return;
    }

    let html = "";

    if (idsComp.length > 0) {
        html += `<div class="resumen-elementos-grupo-titulo">Computadores</div>`;
        idsComp.forEach((id) => {
            const comp = usuario.computadores.find((c) => c.id === id);
            if (comp) html += `<div class="resumen-elementos-item">• ${comp.marca} ${comp.modelo}</div>`;
        });
    }

    if (idsVeh.length > 0) {
        html += `<div class="resumen-elementos-grupo-titulo">Vehículos</div>`;
        idsVeh.forEach((id) => {
            const veh = usuario.vehiculos.find((v) => v.id === id);
            if (veh) html += `<div class="resumen-elementos-item">• ${veh.marca} ${veh.modelo} — ${veh.placa}</div>`;
        });
    }

    resumenContenido.innerHTML = html;
}
