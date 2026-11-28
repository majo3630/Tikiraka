/* --- GOOGLE SHEETS --- */
// Pega aquí el link que te da Google Apps Script (termina en /exec)
const SHEETS_URL_CODIGO = 'https://script.google.com/macros/s/AKfycbyaEEtm8JLg7aq0Jw5V6bFugMa7ZPXi9_vFJ63SOqGClpPhF4QdYjeubkWrfvtK46ITDw/exec';   // (opcional) también puedes pegarlo aquí
function urlSheets() {
    return (DB.config && DB.config.sheetsUrl) || SHEETS_URL_CODIGO;
}
let sheetsTimer = null;
let enviandoSheets = false;
let ultimoFalloSheets = 0;

function renderConfigSheets() {
    const i = document.getElementById('sheets-url-input');
    if (i && document.activeElement !== i) i.value = urlSheets();
    const u = document.getElementById('sheets-ultimo');
    if (!u) return;
    let t = 0;
    try { t = parseInt(localStorage.getItem('tikiraka_ultimo_envio_sheets')) || 0; } catch (e) {}
    u.innerText = t ? 'Último envío desde este aparato: ' + new Date(t).toLocaleString('es-CO') : 'Todavía no se ha enviado nada desde este aparato.';
}

function guardarUrlSheets() {
    const url = document.getElementById('sheets-url-input').value.trim();
    if (!url.includes('/macros/') || !url.endsWith('/exec')) {
        return alert('Ese no es el link correcto. Debe empezar con https://script.google.com y terminar en /exec (no es el link del editor).');
    }
    if (!DB.config) DB.config = {};
    DB.config.sheetsUrl = url;
    guardarDB();
    alert('Link guardado. Toca "Probar link" para revisar que funcione.');
}

async function probarUrlSheets() {
    const estado = document.getElementById('sheets-estado');
    const url = urlSheets();
    if (!url) { estado.innerText = 'Primero pega el link y toca Guardar link.'; return; }
    estado.innerText = 'Probando...';
    try {
        const r = await fetch(url);
        const t = (await r.text()).trim();
        estado.innerText = t.includes('funcionando')
            ? '✅ El link funciona. Ya puedes tocar "Enviar a Google Sheets".'
            : '❌ Google respondió otra cosa. Publica una versión nueva (Implementar > Administrar implementaciones > lápiz > Nueva versión) y revisa que "Quién tiene acceso" diga "Cualquier persona".';
    } catch (e) {
        estado.innerText = '❌ No se pudo abrir el link. Revisa tu internet, que sea el link /exec y que el acceso sea "Cualquier persona".';
    }
}

// Convierte cualquier fecha guardada (nueva o antigua) a "YYYY-MM-DD".
// Entiende: ISO (2026-11-24T...), "2026-11-24" y "24/11/2026, 3:45 p. m." (día/mes/año)
function fechaADia(x) {
    if (!x) return '';
    const t = String(x).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return claveDia(t) || t.slice(0, 10);
    const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return claveDia(t) || '';
}

// Última vez que pasaron las 11:30 pm (hoy si ya son las 11:30 pm, si no, ayer)
function ultimoCorteSheets() {
    const d = new Date();
    const corte = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 30, 0);
    if (d < corte) corte.setDate(corte.getDate() - 1);
    return corte;
}

// Cargue automático: si desde las 11:30 pm no se ha enviado nada, envía ahora.
// Corre cada 30 segundos. Si la app estaba cerrada a las 11:30 pm, envía al abrirla.
function revisarEnvioSheets() {
    if (!urlSheets() || !dbCargada || enviandoSheets || Date.now() - ultimoFalloSheets < 300000) return;
    let ultimo = 0;
    try { ultimo = parseInt(localStorage.getItem('tikiraka_ultimo_envio_sheets')) || 0; } catch (e) {}
    if (ultimo < ultimoCorteSheets().getTime()) enviarASheets(false);
}

// Envía solo, 10 segundos después del último cambio
function programarEnvioSheets() {
    if (!urlSheets()) return;
    clearTimeout(sheetsTimer);
    sheetsTimer = setTimeout(() => {
        if (enviandoSheets) return programarEnvioSheets();   // si ya está enviando, espera
        enviarASheets(false);
    }, 10000);
}

async function enviarASheets(manual) {
    if (!urlSheets()) {
        if (manual) alert('Primero pega el link de Google en el cuadro "Link de Google Sheets" (aquí en Historial) y toca Guardar link.');
        return;
    }
    if (!urlSheets().includes('/macros/') || !urlSheets().endsWith('/exec')) {
        if (manual) alert('El link guardado no es el correcto. Debe empezar con https://script.google.com y terminar en /exec (no es el link del editor).');
        return;
    }
    if (enviandoSheets) {
        if (manual) alert('Ya se está enviando. Espera un momento y revisa la hoja.');
        return;
    }
    enviandoSheets = true;
    const boton = document.getElementById('btn-sheets');
    if (manual && boton) { boton.disabled = true; boton.innerText = 'Enviando... (puede tardar 1 minuto)'; }
    const dia = fechaADia;
    const datos = {
        ventas: DB.ventas.map(v => {
            const nom = v.prodNombre || v.productoNombre || '';
            return {
                fecha: dia(v.fecha || v.isoFecha),
                fechaTexto: String(v.fecha || v.isoFecha || ''),
                producto: nom,
                categoria: nom.startsWith('(Devolución)') ? 'Devolución' : '',
                metodo: v.metodo || v.metodoPago || 'Efectivo',
                cantidad: v.cantidad || 1,
                costo: v.costoUnitario || 0,
                total: v.monto !== undefined ? v.monto : (v.montoTotal || 0)
            };
        }),
        gastos: DB.gastos.map(g => {
            const p = DB.inventario.find(x => x.id === g.prodId);
            return {
                fecha: dia(g.fecha || g.isoFecha),
                fechaTexto: String(g.fecha || g.isoFecha || ''),
                descripcion: g.concepto || '',
                metodo: g.metodo || g.metodoPago || 'Efectivo',
                producto: p ? p.nombre : '',
                categoria: g.esStock ? 'Material' : 'Otro',
                cantidad: g.cantidadStock || 1,
                total: g.monto !== undefined ? g.monto : (g.montoTotal || 0)
            };
        }),
        inventario: DB.inventario.map(p => ({ nombre: p.nombre, cantidad: p.cantidad })),
        caja: { efectivo: DB.caja.efectivo || 0, nequi: DB.caja.nequi || 0 },
        socios: DB.socios.map(s => ({
            nombre: s.nombre,
            asistencia: (s.asistencia || []).map(fechaCortaAIso).filter(Boolean),
            gastos: (s.gastos || []).map(g => ({ fecha: g.fecha, monto: g.monto, tipo: g.tipo, nota: g.nota || '' }))
        }))
    };
    const ctrl = new AbortController();
    const corte = setTimeout(() => ctrl.abort(), 120000);
    try {
        let respuesta = null;
        try {
            const r = await fetch(urlSheets(), {
                signal: ctrl.signal,
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(datos)
            });
            respuesta = (await r.text()).trim();
        } catch (e) {
            if (e && e.name === 'AbortError') throw e;
            if (!navigator.onLine) throw e;
            respuesta = null; // se envió, pero el navegador no deja leer la respuesta
        }

        if (respuesta === 'ok' || respuesta === null) {
            try { localStorage.setItem('tikiraka_ultimo_envio_sheets', String(Date.now())); } catch (e) {}
            renderConfigSheets();
            if (manual) alert(respuesta === 'ok'
                ? 'Listo: Google recibió los datos. Revisa las pestañas Panel y Asistencia.'
                : 'Enviado. Google no confirmó la respuesta; revisa tu hoja.');
        } else if (respuesta === 'ocupado') {
            ultimoFalloSheets = Date.now() - 240000; // reintenta en ~1 minuto
            if (manual) alert('Google estaba ocupado con otro envío. Intenta de nuevo en un minuto.');
        } else {
            ultimoFalloSheets = Date.now();
            if (manual) alert('Google no aceptó el envío. Revisa que el link sea el de /exec, que "Quién tiene acceso" diga "Cualquier persona" y que hayas publicado una versión nueva.');
        }
    } catch (err) {
        ultimoFalloSheets = Date.now();
        if (manual) alert(err && err.name === 'AbortError'
            ? 'Google está tardando más de 2 minutos. Revisa tu hoja en un rato; puede que sí se haya enviado.'
            : 'No se pudo enviar. Revisa tu internet y el link.');
    } finally {
        clearTimeout(corte);
        enviandoSheets = false;
        if (boton) { boton.disabled = false; boton.innerText = 'Enviar a Google Sheets'; }
    }
}

