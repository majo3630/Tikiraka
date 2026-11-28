/* --- CAJA --- */
function renderCaja() {
    const ef = DB.caja.efectivo || 0;
    const nq = DB.caja.nequi || 0;
    document.getElementById('total-efectivo').innerText = formatoMoneda(ef);
    document.getElementById('total-nequi').innerText = formatoMoneda(nq);
    document.getElementById('total-general').innerText = formatoMoneda(ef + nq);
}

function modificarSaldoBase(tipo, accion) {
    const inputId = tipo === 'efectivo' ? 'base-efectivo' : 'base-nequi';
    const monto = parseFloat(document.getElementById(inputId).value);

    if (isNaN(monto) || monto <= 0) return alert('Ingresa un valor numérico válido mayor a 0');

    let accionEtiqueta = '';
    let saldoFinal = 0;
    
    if (tipo === 'efectivo') {
        if (accion === 'fijar') {
            DB.caja.efectivo = monto;
            accionEtiqueta = 'Fijar Base';
        } else if (accion === 'sumar') {
            DB.caja.efectivo = (DB.caja.efectivo || 0) + monto;
            accionEtiqueta = 'Agregó (+)';
        } else if (accion === 'restar') {
            DB.caja.efectivo = (DB.caja.efectivo || 0) - monto;
            accionEtiqueta = 'Disminuyó (-)';
        }
        saldoFinal = DB.caja.efectivo;
    } else {
        if (accion === 'fijar') {
            DB.caja.nequi = monto;
            accionEtiqueta = 'Fijar Base';
        } else if (accion === 'sumar') {
            DB.caja.nequi = (DB.caja.nequi || 0) + monto;
            accionEtiqueta = 'Agregó (+)';
        } else if (accion === 'restar') {
            DB.caja.nequi = (DB.caja.nequi || 0) - monto;
            accionEtiqueta = 'Disminuyó (-)';
        }
        saldoFinal = DB.caja.nequi;
    }

    if (!DB.historialBase) DB.historialBase = [];
    const fechaHora = new Date().toISOString();
    DB.historialBase.unshift({
        fecha: fechaHora,
        tipo: tipo.toUpperCase(),
        accion: accionEtiqueta,
        monto: monto,
        saldoResultante: saldoFinal
    });

    guardarDB();
    document.getElementById(inputId).value = '';
    alert(`Saldo de ${tipo.toUpperCase()} actualizado correctamente`);
}

function renderHistorialBase() {
    const tbody = document.getElementById('tabla-historial-base');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (!DB.historialBase || DB.historialBase.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">Sin registros de cambios en base.</td></tr>';
        return;
    }

    [...DB.historialBase].sort((a, b) => timestampItem(b) - timestampItem(a)).forEach(h => {
        let colorAccion = '#fff';
        if (h.accion.includes('+')) colorAccion = 'var(--success)';
        if (h.accion.includes('-')) colorAccion = 'var(--danger)';
        if (h.accion.includes('Fijar')) colorAccion = 'var(--warning)';

        const fechaMostrar = h.fecha ? (typeof h.fecha === 'string' && h.fecha.includes('T') ? new Date(h.fecha).toLocaleString('es-CO') : h.fecha) : 'Sin fecha';

        tbody.innerHTML += `
            <tr>
                <td style="font-size:0.75rem;">${fechaMostrar}</td>
                <td><strong>${h.tipo}</strong></td>
                <td style="color:${colorAccion}; font-weight:bold;">${h.accion}</td>
                <td>${formatoMoneda(h.monto)}</td>
                <td><strong>${formatoMoneda(h.saldoResultante)}</strong></td>
            </tr>
        `;
    });
}

