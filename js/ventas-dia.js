/* --- VENTAS DEL DÍA --- */
// Devuelve "YYYY-MM-DD" en hora local
function claveDia(valor) {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toggleVentaDiaManual() {
    const m = document.getElementById('vd-es-manual').checked;
    document.getElementById('vd-campo-select').style.display = m ? 'none' : 'block';
    document.getElementById('vd-campo-manual').style.display = m ? 'block' : 'none';
    document.getElementById('vd-monto').value = '';
    if (!m) autofillVentaDia();
}

function autofillVentaDia() {
    if (document.getElementById('vd-es-manual').checked) return;
    const prod = DB.inventario.find(p => p.id === parseInt(document.getElementById('vd-producto').value));
    const cant = parseInt(document.getElementById('vd-cantidad').value) || 1;
    document.getElementById('vd-monto').value = prod ? prod.precio * cant : '';
}

function agregarVentaDia() {
    if (!DB.ventasDia) DB.ventasDia = [];
    const esManual = document.getElementById('vd-es-manual').checked;
    const cant = parseInt(document.getElementById('vd-cantidad').value) || 0;
    const monto = parseFloat(document.getElementById('vd-monto').value);
    const metodo = document.getElementById('vd-metodo').value;
    let prodId = null, nombre = '';

    if (cant <= 0) return alert('La cantidad debe ser mayor a cero');
    if (isNaN(monto) || monto < 0) return alert('Ingresa un monto válido');

    if (esManual) {
        nombre = document.getElementById('vd-nombre-manual').value.trim();
        if (!nombre) return alert('Escribe el nombre del producto');
    } else {
        const prod = DB.inventario.find(p => p.id === parseInt(document.getElementById('vd-producto').value));
        if (!prod) return alert('Selecciona un producto');
        const pendiente = DB.ventasDia.filter(v => v.prodId === prod.id).reduce((s, v) => s + v.cantidad, 0);
        if (pendiente + cant > prod.cantidad) return alert('Stock insuficiente');
        prodId = prod.id;
        nombre = prod.nombre;
    }

    DB.ventasDia.push({ id: Date.now(), prodId, prodNombre: nombre, cantidad: cant, monto, metodo, fecha: new Date().toISOString() });
    guardarDB();

    document.getElementById('vd-producto').value = '';
    document.getElementById('vd-nombre-manual').value = '';
    document.getElementById('vd-cantidad').value = '1';
    document.getElementById('vd-monto').value = '';
}

function renderVentasDia() {
    const sel = document.getElementById('vd-producto');
    if (!sel) return;
    const val = sel.value;
    sel.innerHTML = '<option value="">Selecciona Producto</option>' +
        DB.inventario.map(p => `<option value="${p.id}">${p.nombre} (${formatoMoneda(p.precio)})</option>`).join('');
    if (val) sel.value = val;

    const lista = [...(DB.ventasDia || [])].sort((a, b) => timestampItem(a) - timestampItem(b));
    const tbody = document.getElementById('tabla-ventas-dia');
    const tbodyRes = document.getElementById('tabla-resumen-dia');

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">Aún no hay ventas anotadas.</td></tr>';
        tbodyRes.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">Nada por guardar.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(v => `
        <tr>
            <td style="font-size:0.75rem;">${new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${v.prodNombre}</td>
            <td>${v.cantidad}</td>
            <td><strong>${formatoMoneda(v.monto)}</strong></td>
            <td>${v.metodo}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-warning" onclick="abrirModalEditarVentaDia(${v.id})">✏️</button>
                    <button class="btn btn-danger" onclick="eliminarVentaDia(${v.id})">🗑️</button>
                </div>
            </td>
        </tr>`).join('');

    const grupos = {};
    lista.forEach(v => {
        const k = (v.prodId || ('m:' + v.prodNombre)) + '|' + v.metodo;
        if (!grupos[k]) grupos[k] = { nombre: v.prodNombre, metodo: v.metodo, cantidad: 0, monto: 0 };
        grupos[k].cantidad += v.cantidad;
        grupos[k].monto += v.monto;
    });
    const filas = Object.values(grupos).map(g => `
        <tr><td>${g.nombre}</td><td>${g.metodo}</td><td>${g.cantidad}</td><td><strong>${formatoMoneda(g.monto)}</strong></td></tr>`).join('');
    const total = lista.reduce((s, v) => s + v.monto, 0);
    tbodyRes.innerHTML = filas + `
        <tr style="background-color:#111;"><td colspan="3"><strong>TOTAL DEL DÍA</strong></td><td style="color:#ffd700;"><strong>${formatoMoneda(total)}</strong></td></tr>`;
}

function eliminarVentaDia(id) {
    if (!confirm('¿Borrar esta venta de la lista de hoy?')) return;
    DB.ventasDia = DB.ventasDia.filter(v => v.id !== id);
    guardarDB();
}

function abrirModalEditarVentaDia(id) {
    const v = DB.ventasDia.find(x => x.id === id);
    if (!v) return;
    document.getElementById('edit-vd-id').value = v.id;
    document.getElementById('edit-vd-nombre').value = v.prodNombre;
    document.getElementById('edit-vd-cantidad').value = v.cantidad;
    document.getElementById('edit-vd-monto').value = v.monto;
    document.getElementById('edit-vd-metodo').value = v.metodo;
    document.getElementById('modal-editar-ventadia').style.display = 'flex';
}

function cerrarModalEditarVentaDia() {
    document.getElementById('modal-editar-ventadia').style.display = 'none';
}

function autofillEditVentaDia() {
    const v = DB.ventasDia.find(x => x.id === parseInt(document.getElementById('edit-vd-id').value));
    if (!v || !v.prodId) return;
    const prod = DB.inventario.find(p => p.id === v.prodId);
    const cant = parseInt(document.getElementById('edit-vd-cantidad').value) || 1;
    if (prod) document.getElementById('edit-vd-monto').value = prod.precio * cant;
}

function guardarEdicionVentaDia() {
    const v = DB.ventasDia.find(x => x.id === parseInt(document.getElementById('edit-vd-id').value));
    if (!v) return;
    const cant = parseInt(document.getElementById('edit-vd-cantidad').value) || 0;
    const monto = parseFloat(document.getElementById('edit-vd-monto').value);
    if (cant <= 0) return alert('La cantidad debe ser mayor a cero');
    if (isNaN(monto) || monto < 0) return alert('Ingresa un monto válido');

    if (v.prodId) {
        const prod = DB.inventario.find(p => p.id === v.prodId);
        const otras = DB.ventasDia.filter(x => x.prodId === v.prodId && x.id !== v.id).reduce((s, x) => s + x.cantidad, 0);
        if (prod && otras + cant > prod.cantidad) return alert('Stock insuficiente');
    }
    v.cantidad = cant;
    v.monto = monto;
    v.metodo = document.getElementById('edit-vd-metodo').value;
    guardarDB();
    cerrarModalEditarVentaDia();
}

// Suma por producto (y método de pago) y lo manda al historial con la fecha de ese día a las 11:00 pm.
// Aquí sí se descuenta el stock y se suma a la caja.
function consolidarVentasDia(lista) {
    const porDia = {};
    lista.forEach(v => {
        const k = claveDia(v.fecha) || claveDia(new Date());
        (porDia[k] = porDia[k] || []).push(v);
    });

    let n = 0;
    Object.keys(porDia).sort().forEach(k => {
        const [y, m, d] = k.split('-').map(Number);
        const fechaIso = new Date(y, m - 1, d, 23, 0, 0).toISOString();

        const grupos = {};
        porDia[k].forEach(v => {
            const gk = (v.prodId || ('m:' + v.prodNombre)) + '|' + v.metodo;
            if (!grupos[gk]) grupos[gk] = { prodId: v.prodId, nombre: v.prodNombre, metodo: v.metodo, cantidad: 0, monto: 0 };
            grupos[gk].cantidad += v.cantidad;
            grupos[gk].monto += v.monto;
        });

        Object.values(grupos).forEach(g => {
            let costo = 0;
            if (g.prodId) {
                const prod = DB.inventario.find(p => p.id === g.prodId);
                if (prod) {
                    costo = prod.costo || 0;
                    prod.cantidad = Math.max(0, prod.cantidad - g.cantidad);
                }
            }
            if (g.metodo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + g.monto;
            else DB.caja.nequi = (DB.caja.nequi || 0) + g.monto;

            const registro = {
                id: Date.now() + (n++),
                prodId: g.prodId,
                prodNombre: g.nombre,
                cantidad: g.cantidad,
                costoUnitario: costo,
                monto: g.monto,
                metodo: g.metodo,
                fecha: fechaIso
            };
            if (!g.prodId) registro.sinInventario = true;
            DB.ventas.unshift(registro);
        });
    });
}

// Se revisa cada 30 segundos y cada vez que llegan datos
function revisarCierreDia() {
    if (!dbCargada || !DB.ventasDia || DB.ventasDia.length === 0) return;
    const ahora = new Date();
    const hoy = claveDia(ahora);
    const pasaron11 = ahora.getHours() >= 23;

    const listas = DB.ventasDia.filter(v => {
        const k = claveDia(v.fecha);
        return k && (k < hoy || (k === hoy && pasaron11));
    });
    if (listas.length === 0) return;

    consolidarVentasDia(listas);
    const ids = new Set(listas.map(v => v.id));
    DB.ventasDia = DB.ventasDia.filter(v => !ids.has(v.id));
    guardarDB();
}

function cerrarDiaAhora() {
    if (!DB.ventasDia || DB.ventasDia.length === 0) return alert('No hay ventas por guardar');
    if (!confirm('¿Guardar ahora las ventas en el Historial? Se sumarán por producto y se borrarán de esta lista.')) return;
    consolidarVentasDia([...DB.ventasDia]);
    DB.ventasDia = [];
    guardarDB();
    alert('Ventas guardadas en el Historial.');
}

setInterval(() => { revisarCierreDia(); revisarEnvioSheets(); }, 30000);

