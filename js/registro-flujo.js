/* ==========================================================================
   registro-flujo.js
   Lógica compartida por registrar_general.html (panel administrativo) y
   registrar-usuario.html (panel de portería).

   Reemplaza el asistente de pasos 1-2-3 por un selector directo:
   Sidebar → Registrar → Usuario / Computador / Portero / Vehículo

   Todavía NO envía nada a un backend real: los registros permanentes,
   de computador, de vehículo y de portero solo muestran la confirmación
   en pantalla (puntos de conexión marcados con // TODO backend).

   Los usuarios TEMPORALES sí se guardan (en localStorage, como
   simulación de base de datos) porque el propio flujo depende de poder
   buscarlos otra vez por su código para registrar entrada/salida.
   ========================================================================== */

(function () {

    const LS_KEY = "sena_registros_temporales";

    // =========================
    // UTILIDADES GENERALES
    // =========================

    function esAdmin() {
        return document.body.getAttribute("data-user-role") === "admin";
    }

    function $(id) {
        return document.getElementById(id);
    }

    function formatearFecha(fecha) {
        return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }) +
            " " + fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    }

    // =========================
    // ALMACENAMIENTO DE TEMPORALES (localStorage como simulación de BD)
    // =========================

    function leerTemporales() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function guardarTemporales(lista) {
        localStorage.setItem(LS_KEY, JSON.stringify(lista));
    }

    function generarCodigoTemporal() {
        const existentes = leerTemporales().map(r => r.codigo);
        let codigo;
        do {
            const numero = Math.floor(100000 + Math.random() * 900000);
            codigo = "TEMP-" + numero;
        } while (existentes.includes(codigo));
        return codigo;
    }

    function crearRegistroTemporal(datos) {
        const lista = leerTemporales();
        const codigo = generarCodigoTemporal();

        const registro = {
            codigo: codigo,
            nombre: datos.nombre,
            documento: datos.documento,
            serial: datos.serial || "",
            placa: datos.placa || "",
            tieneFoto: !!datos.tieneFoto,
            fechaCreacion: new Date().toISOString(),
            fechaEntrada: null,
            fechaSalida: null,
            // Estados posibles: creado | dentro | salio
            estado: "creado"
        };

        lista.push(registro);
        guardarTemporales(lista);
        // TODO backend: reemplazar el guardado en localStorage por un
        // POST al endpoint de registros temporales cuando exista la API.
        return registro;
    }

    function buscarTemporalPorCodigo(codigo) {
        const normalizado = (codigo || "").trim().toUpperCase();
        return leerTemporales().find(r => r.codigo === normalizado);
    }

    function registrarEntradaTemporal(codigo) {
        const lista = leerTemporales();
        const registro = lista.find(r => r.codigo === (codigo || "").trim().toUpperCase());
        if (!registro) return null;
        registro.estado = "dentro";
        registro.fechaEntrada = new Date().toISOString();
        guardarTemporales(lista);
        return registro;
    }

    function registrarSalidaTemporal(codigo) {
        const lista = leerTemporales();
        const registro = lista.find(r => r.codigo === (codigo || "").trim().toUpperCase());
        if (!registro) return null;
        registro.estado = "salio";
        registro.fechaSalida = new Date().toISOString();
        guardarTemporales(lista);
        return registro;
    }

    // =========================
    // NAVEGACIÓN ENTRE PANELES
    // =========================

    const PANELES = ["usuario", "computador", "portero", "vehiculo"];

    function ocultarTodo() {
        const grid = $("registroSelectorGrid");
        if (grid) grid.classList.add("d-none");

        PANELES.forEach(tipo => {
            const panel = $("panel" + capitalizar(tipo));
            if (panel) panel.classList.add("d-none");
        });

        const confirmacion = $("confirmacionCard");
        if (confirmacion) confirmacion.classList.add("d-none");

        const codigoCard = $("codigoTemporalCard");
        if (codigoCard) codigoCard.classList.add("d-none");
    }

    function capitalizar(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function mostrarSelector() {
        ocultarTodo();
        const grid = $("registroSelectorGrid");
        if (grid) grid.classList.remove("d-none");

        // Limpia el ?tipo= de la URL para que "volver" sea consistente,
        // sin recargar la página.
        if (window.history && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete("tipo");
            window.history.replaceState({}, "", url);
        }
    }

    function mostrarPanel(tipo) {
        if (!PANELES.includes(tipo)) {
            mostrarSelector();
            return;
        }

        if (tipo === "portero" && !esAdmin()) {
            // Seguridad en el cliente: si alguien fuerza ?tipo=portero
            // sin ser administrador, lo mandamos de vuelta al selector.
            mostrarSelector();
            return;
        }

        const panel = $("panel" + capitalizar(tipo));
        if (!panel) {
            mostrarSelector();
            return;
        }

        ocultarTodo();
        panel.classList.remove("d-none");
    }

    function leerTipoDesdeURL() {
        const parametros = new URLSearchParams(window.location.search);
        return parametros.get("tipo");
    }

    // =========================
    // CONFIRMACIÓN GENÉRICA (permanente / computador / vehículo / portero)
    // =========================

    function mostrarConfirmacion(titulo, subtitulo) {
        ocultarTodo();
        const card = $("confirmacionCard");
        if (!card) return;

        $("confirmacionTitulo").textContent = titulo;
        $("confirmacionSubtitulo").textContent = subtitulo;
        card.classList.remove("d-none");
    }

    // =========================
    // PANTALLA DE CÓDIGO TEMPORAL
    // =========================

    function mostrarCodigoTemporal(registro) {
        ocultarTodo();
        const card = $("codigoTemporalCard");
        if (!card) return;

        $("codigoTemporalValor").textContent = registro.codigo;
        card.classList.remove("d-none");
    }

    function copiarCodigo() {
        const texto = $("codigoTemporalValor").textContent.trim();
        const boton = $("btnCopiarCodigo");

        function marcarCopiado() {
            if (!boton) return;
            const original = boton.innerHTML;
            boton.innerHTML = '<i class="bi bi-check-lg"></i> Copiado';
            setTimeout(() => { boton.innerHTML = original; }, 1800);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(marcarCopiado).catch(() => {
                window.prompt("Copia el código manualmente:", texto);
            });
        } else {
            window.prompt("Copia el código manualmente:", texto);
        }
    }

    function imprimirCodigo() {
        const codigo = $("codigoTemporalValor").textContent.trim();
        const ventana = window.open("", "_blank", "width=420,height=300");
        if (!ventana) return;

        ventana.document.write(`
            <html>
                <head><title>Código de ingreso</title></head>
                <body style="font-family:sans-serif; text-align:center; padding:40px;">
                    <p style="font-size:16px; margin-bottom:8px;">Código de ingreso/salida</p>
                    <h1 style="font-size:40px; letter-spacing:2px;">${codigo}</h1>
                    <p style="color:#666; font-size:13px;">Preséntalo en portería para tu entrada y tu salida.</p>
                </body>
            </html>
        `);
        ventana.document.close();
        ventana.focus();
        ventana.print();
    }

    // =========================
    // USAR CÓDIGO (ENTRADA / SALIDA)
    // =========================

    function pintarResultadoCodigo(registro) {
        const contenedor = $("resultadoCodigoUsar");
        if (!contenedor) return;

        if (!registro) {
            contenedor.classList.remove("d-none");
            contenedor.innerHTML = `<div class="alert-mensaje" style="color:#b02a37;">
                No se encontró ningún registro temporal con ese código.
            </div>`;
            return;
        }

        const etiquetasEstado = {
            creado: '<span class="estado-badge estado-creado">Pendiente de entrada</span>',
            dentro: '<span class="estado-badge estado-dentro">Dentro</span>',
            salio: '<span class="estado-badge estado-salio">Salió / finalizado</span>'
        };

        let botonAccion = "";
        if (registro.estado === "creado") {
            botonAccion = `<button type="button" class="btn-registrar-custom mt-3" id="btnMarcarEntrada">
                <i class="bi bi-box-arrow-in-right"></i> Registrar entrada
            </button>`;
        } else if (registro.estado === "dentro") {
            botonAccion = `<button type="button" class="btn-registrar-custom mt-3" id="btnMarcarSalida">
                <i class="bi bi-box-arrow-right"></i> Registrar salida
            </button>`;
        } else {
            botonAccion = `<p class="text-muted mt-3 mb-0">Esta visita ya finalizó.</p>`;
        }

        contenedor.classList.remove("d-none");
        contenedor.innerHTML = `
            <div class="fw-bold">${registro.nombre}</div>
            <div class="text-muted" style="font-size:0.9rem;">Doc. ${registro.documento} · ${registro.codigo}</div>
            <div class="mt-2">${etiquetasEstado[registro.estado]}</div>
            ${botonAccion}
        `;

        const btnEntrada = $("btnMarcarEntrada");
        if (btnEntrada) {
            btnEntrada.addEventListener("click", function () {
                const actualizado = registrarEntradaTemporal(registro.codigo);
                pintarResultadoCodigo(actualizado);
            });
        }

        const btnSalida = $("btnMarcarSalida");
        if (btnSalida) {
            btnSalida.addEventListener("click", function () {
                const actualizado = registrarSalidaTemporal(registro.codigo);
                pintarResultadoCodigo(actualizado);
            });
        }
    }

    // =========================
    // INICIALIZACIÓN
    // =========================

    document.addEventListener("DOMContentLoaded", function () {

        // Oculta la tarjeta "Portero" del selector si no es administrador.
        document.querySelectorAll('.registro-selector-card[data-admin-only="true"]').forEach(el => {
            if (!esAdmin()) el.remove();
        });

        // --- Selector de tarjetas ---
        document.querySelectorAll(".registro-selector-card[data-registro]").forEach(card => {
            card.addEventListener("click", function () {
                mostrarPanel(card.dataset.registro);
            });
        });

        // --- Botones "volver" en cada panel ---
        document.querySelectorAll(".btn-volver-selector").forEach(btn => {
            btn.addEventListener("click", mostrarSelector);
        });

        // --- Toggle Permanente / Temporal dentro de "Usuario" ---
        const btnTipoPermanente = $("btnTipoPermanente");
        const btnTipoTemporal = $("btnTipoTemporal");
        const wrapPermanente = $("formUsuarioPermanenteWrap");
        const wrapTemporal = $("formUsuarioTemporalWrap");

        function mostrarTipoUsuario(tipo) {
            const esTemporal = tipo === "temporal";
            if (btnTipoPermanente) btnTipoPermanente.classList.toggle("active", !esTemporal);
            if (btnTipoTemporal) btnTipoTemporal.classList.toggle("active", esTemporal);
            if (wrapPermanente) wrapPermanente.classList.toggle("d-none", esTemporal);
            if (wrapTemporal) wrapTemporal.classList.toggle("d-none", !esTemporal);
        }

        if (btnTipoPermanente && btnTipoTemporal) {
            btnTipoPermanente.addEventListener("click", () => mostrarTipoUsuario("permanente"));
            btnTipoTemporal.addEventListener("click", () => mostrarTipoUsuario("temporal"));
            mostrarTipoUsuario("permanente");
        }

        // --- Registrar usuario permanente ---
        const btnRegistrarPersona = $("btnRegistrarPersona");
        if (btnRegistrarPersona) {
            btnRegistrarPersona.addEventListener("click", function () {
                const nombre = $("ruNombre").value.trim();
                const documento = $("ruDocumento").value.trim();

                if (!nombre || !documento) {
                    alert("Nombre y documento son obligatorios.");
                    return;
                }

                // TODO backend: enviar { nombre, documento, centro, password }
                // al endpoint de creación de usuarios permanentes.
                mostrarConfirmacion("Usuario registrado correctamente", nombre + " quedó registrado como usuario permanente.");
            });
        }

        // --- Registrar usuario temporal ---
        const btnRegistrarTemporal = $("btnRegistrarTemporal");
        if (btnRegistrarTemporal) {
            btnRegistrarTemporal.addEventListener("click", function () {
                const nombre = $("rtNombre").value.trim();
                const documento = $("rtDocumento").value.trim();

                if (!nombre || !documento) {
                    alert("Nombre y documento son obligatorios.");
                    return;
                }

                const serial = $("rtSerial") ? $("rtSerial").value.trim() : "";
                const placa = $("rtPlaca") ? $("rtPlaca").value.trim() : "";

                const registro = crearRegistroTemporal({ nombre, documento, serial, placa });
                mostrarCodigoTemporal(registro);
            });
        }

        // --- Registrar computador ---
        const btnRegistrarComputador = $("btnRegistrarComputador");
        if (btnRegistrarComputador) {
            btnRegistrarComputador.addEventListener("click", function () {
                const documento = $("rdDocumentoPropietario").value.trim();
                if (!documento) {
                    alert("El documento del propietario es obligatorio.");
                    return;
                }
                // TODO backend: enviar los datos del computador al backend.
                mostrarConfirmacion("Computador registrado correctamente", "El equipo quedó asociado al documento " + documento + ".");
            });
        }

        // --- Registrar vehículo ---
        const btnRegistrarVehiculo = $("btnRegistrarVehiculo");
        if (btnRegistrarVehiculo) {
            btnRegistrarVehiculo.addEventListener("click", function () {
                const documento = $("rvDocumentoPropietario").value.trim();
                const placa = $("rvPlaca").value.trim();
                if (!documento || !placa) {
                    alert("Documento del propietario y placa son obligatorios.");
                    return;
                }
                // TODO backend: enviar los datos del vehículo al backend.
                mostrarConfirmacion("Vehículo registrado correctamente", "La placa " + placa.toUpperCase() + " quedó asociada al documento " + documento + ".");
            });
        }

        // --- Registrar portero (solo administrador) ---
        const btnRegistrarPaso4 = $("btnRegistrarPaso4");
        if (btnRegistrarPaso4) {
            btnRegistrarPaso4.addEventListener("click", function () {
                const nombre = $("rpNombre").value.trim();
                const documento = $("rpDocumento").value.trim();
                if (!nombre || !documento) {
                    alert("Nombre y documento son obligatorios.");
                    return;
                }
                // TODO backend: enviar los datos del portero al backend.
                mostrarConfirmacion("Portero registrado correctamente", nombre + " quedó registrado como portero.");
            });
        }

        // --- Botones de la confirmación genérica ---
        const btnConfirmOtro = $("btnConfirmOtro");
        if (btnConfirmOtro) btnConfirmOtro.addEventListener("click", mostrarSelector);

        // --- Botones de la pantalla de código temporal ---
        const btnCopiarCodigo = $("btnCopiarCodigo");
        if (btnCopiarCodigo) btnCopiarCodigo.addEventListener("click", copiarCodigo);

        const btnImprimirCodigo = $("btnImprimirCodigo");
        if (btnImprimirCodigo) btnImprimirCodigo.addEventListener("click", imprimirCodigo);

        const btnCodigoOtro = $("btnCodigoOtro");
        if (btnCodigoOtro) btnCodigoOtro.addEventListener("click", mostrarSelector);

        // --- Caja "usar código" (entrada / salida) ---
        const btnToggleUsarCodigo = $("btnToggleUsarCodigo");
        const usarCodigoContenido = $("usarCodigoContenido");
        if (btnToggleUsarCodigo && usarCodigoContenido) {
            btnToggleUsarCodigo.addEventListener("click", function () {
                usarCodigoContenido.classList.toggle("d-none");
            });
        }

        const btnBuscarCodigo = $("btnBuscarCodigo");
        if (btnBuscarCodigo) {
            btnBuscarCodigo.addEventListener("click", function () {
                const codigo = $("inputCodigoUsar").value;
                const registro = buscarTemporalPorCodigo(codigo);
                pintarResultadoCodigo(registro);
            });
        }

        // --- Al cargar la página: si viene ?tipo= en la URL, abrir
        //     directamente ese panel (esto es lo que usa el submenú del
        //     sidebar para "llevar al formulario correspondiente"). ---
        const tipoInicial = leerTipoDesdeURL();
        if (tipoInicial) {
            mostrarPanel(tipoInicial);
        } else {
            mostrarSelector();
        }
    });

})();
