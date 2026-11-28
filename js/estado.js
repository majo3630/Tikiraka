let DB = {
    inventario: [],
    caja: { efectivo: 0, nequi: 0 },
    historialBase: [],
    ventas: [],
    gastos: [],
    socios: [],
    ventasDia: [],
    config: {}
};

let dbCargada = false;
let charts = {};

// Devuelve la fecha de un registro como número (para poder ordenar).
// Si no tiene fecha válida devuelve 0 y queda al final.
function timestampItem(item) {
    const d = new Date(item.fecha || item.isoFecha);
    return isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatoMoneda(valor) {
    return '$ ' + Number(valor || 0).toLocaleString('es-CO');
}

// Devuelve un identificador "YYYY-MM" en HORA LOCAL a partir de una fecha
// ISO (o de un objeto Date). Se usa tanto para construir el filtro de meses
// como para decidir a qué mes pertenece cada venta/gasto, así ambos
// procesos quedan siempre sincronizados y usan el mismo criterio de fecha.
function obtenerAnioMesLocal(fechaValor) {
    if (!fechaValor) return null;
    const d = new Date(fechaValor);
    if (isNaN(d.getTime())) return null;
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
}

// Convierte un valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:MM")
// a un ISOString válido en hora local, o devuelve la fecha/hora actual si
// el campo viene vacío. Así toda operación siempre queda con una fecha.
function obtenerFechaOperacionISO(inputId) {
    const valor = document.getElementById(inputId) ? document.getElementById(inputId).value : '';
    if (!valor) return new Date().toISOString();
    const d = new Date(valor);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
}

// Formatea una fecha ISO al formato "YYYY-MM-DDTHH:MM" que requiere
// <input type="datetime-local"> para mostrar la fecha en hora local.
function isoAFechaLocalInput(fechaIso) {
    const d = fechaIso ? new Date(fechaIso) : new Date();
    if (isNaN(d.getTime())) return '';
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${anio}-${mes}-${dia}T${hora}:${min}`;
}

// Rellena el campo de fecha/hora de "Registrar Operación" con el momento
// actual, para que siempre tenga un valor por defecto editable.
function inicializarFechaOperacion() {
    const input = document.getElementById('operacion-fecha');
    if (input) input.value = isoAFechaLocalInput(new Date().toISOString());
}

