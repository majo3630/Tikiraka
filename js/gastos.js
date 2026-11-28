/* --- EDICIÓN Y ELIMINACIÓN DE GASTOS / COMPRAS --- */
function eliminarGasto(id) {
    const index = DB.gastos.findIndex(g => g.id === id);
    if (index === -1) return;

    const gasto = DB.gastos[index];

    // Gasto de otro mes: solo se borra del historial, sin tocar caja ni stock
    if (gasto.historica) {
        if (!confirm('¿Eliminar este gasto de otro mes? No cambiará la caja ni el inventario.')) return;
        DB.gastos.splice(index, 1);
        guardarDB();
        alert('Gasto eliminado del historial.');
        return;
    }

    if (!confirm('¿Estás seguro de eliminar este gasto/compra? Esto reajustará la caja y el inventario si aplica.')) return;

    const montoGasto = gasto.monto !== undefined ? gasto.monto : (gasto.montoTotal || 0);
    const metodoGasto = gasto.metodo || gasto.metodoPago || 'Efectivo';

    // Devolver el dinero a la caja (el gasto lo había restado)
    if (metodoGasto === 'Efectivo') {
        DB.caja.efectivo = (DB.caja.efectivo || 0) + montoGasto;
    } else {
        DB.caja.nequi = (DB.caja.nequi || 0) + montoGasto;
    }

    // Si era compra de stock, revertir el inventario agregado
    if (gasto.esStock && gasto.prodId) {
        const prod = DB.inventario.find(p => p.id === gasto.prodId);
        if (prod) prod.cantidad -= (gasto.cantidadStock || 0);
    }

    DB.gastos.splice(index, 1);

    guardarDB();
    alert('Gasto/compra eliminado y saldos/inventario reajustados.');
}

function toggleEditGastoStock() {
    const esStock = document.getElementById('edit-gasto-es-stock').checked;
    document.getElementById('edit-gasto-simple-fields').style.display = esStock ? 'none' : 'block';
    document.getElementById('edit-gasto-stock-fields').style.display = esStock ? 'block' : 'none';
}

function autofillEditGastoMonto() {
    const prodId = parseInt(document.getElementById('edit-gasto-producto').value);
    const cant = parseInt(document.getElementById('edit-gasto-cantidad-stock').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    if (prod) {
        document.getElementById('edit-gasto-monto').value = prod.costo * cant;
    }
}

function abrirModalEditarGasto(id) {
    const gasto = DB.gastos.find(g => g.id === id);
    if (!gasto) return;

    const selectProd = document.getElementById('edit-gasto-producto');
    selectProd.innerHTML = '';
    DB.inventario.forEach(p => {
        selectProd.innerHTML += `<option value="${p.id}">${p.nombre} (Costo: ${formatoMoneda(p.costo)})</option>`;
    });

    document.getElementById('edit-gasto-id').value = gasto.id;
    document.getElementById('edit-gasto-es-stock').checked = !!gasto.esStock;
    document.getElementById('edit-gasto-concepto').value = gasto.esStock ? '' : (gasto.concepto || '');
    if (gasto.esStock && gasto.prodId) {
        document.getElementById('edit-gasto-producto').value = gasto.prodId;
    }
    document.getElementById('edit-gasto-cantidad-stock').value = gasto.cantidadStock || 1;
    document.getElementById('edit-gasto-monto').value = gasto.monto !== undefined ? gasto.monto : (gasto.montoTotal || 0);
    document.getElementById('edit-gasto-metodo').value = gasto.metodo || gasto.metodoPago || 'Efectivo';
    document.getElementById('edit-gasto-fecha').value = isoAFechaLocalInput(gasto.fecha || gasto.isoFecha);

    toggleEditGastoStock();

    // Gasto de otro mes: solo concepto, monto, método y fecha (sin stock)
    const esHistoricoGasto = !!gasto.historica;
    document.getElementById('edit-gasto-aviso-historica').style.display = esHistoricoGasto ? 'block' : 'none';
    document.getElementById('edit-gasto-checkbox-wrap').style.display = esHistoricoGasto ? 'none' : 'flex';
    if (esHistoricoGasto) {
        document.getElementById('edit-gasto-es-stock').checked = false;
        document.getElementById('edit-gasto-simple-fields').style.display = 'block';
        document.getElementById('edit-gasto-stock-fields').style.display = 'none';
    }

    document.getElementById('modal-editar-gasto').style.display = 'flex';
}

function cerrarModalEditarGasto() {
    document.getElementById('modal-editar-gasto').style.display = 'none';
}

function guardarEdicionGasto() {
    const id = parseInt(document.getElementById('edit-gasto-id').value);
    const gasto = DB.gastos.find(g => g.id === id);
    if (!gasto) return;

    const nuevoEsStock = document.getElementById('edit-gasto-es-stock').checked;
    const nuevoMonto = parseFloat(document.getElementById('edit-gasto-monto').value) || 0;
    const nuevoMetodo = document.getElementById('edit-gasto-metodo').value;
    const nuevaFechaIso = obtenerFechaOperacionISO('edit-gasto-fecha');

    if (nuevoMonto < 0) return alert('El monto no puede ser negativo');

    // Gasto de otro mes: se actualiza solo el registro, sin tocar caja ni stock
    if (gasto.historica) {
        const conceptoHist = document.getElementById('edit-gasto-concepto').value.trim();
        if (!conceptoHist) return alert('Ingresa un concepto del gasto');

        gasto.concepto = conceptoHist;
        gasto.monto = nuevoMonto;
        gasto.metodo = nuevoMetodo;
        gasto.fecha = nuevaFechaIso;

        guardarDB();
        cerrarModalEditarGasto();
        alert('Gasto de otro mes actualizado (sin cambios en caja ni stock)');
        return;
    }

    // Revertir efecto anterior en caja
    const montoAntiguo = gasto.monto !== undefined ? gasto.monto : (gasto.montoTotal || 0);
    const metodoAntiguo = gasto.metodo || gasto.metodoPago || 'Efectivo';
    if (metodoAntiguo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + montoAntiguo;
    else DB.caja.nequi = (DB.caja.nequi || 0) + montoAntiguo;

    // Revertir efecto anterior en inventario si era stock
    if (gasto.esStock && gasto.prodId) {
        const prodAntiguo = DB.inventario.find(p => p.id === gasto.prodId);
        if (prodAntiguo) prodAntiguo.cantidad -= (gasto.cantidadStock || 0);
    }

    let nuevoConcepto = '';
    let nuevoProdId = null;
    let nuevaCantStock = null;

    if (nuevoEsStock) {
        const prodId = parseInt(document.getElementById('edit-gasto-producto').value);
        const cant = parseInt(document.getElementById('edit-gasto-cantidad-stock').value) || 0;
        const prod = DB.inventario.find(p => p.id === prodId);

        if (!prod) return alert('Selecciona un producto para reposición');
        if (cant <= 0) return alert('La cantidad debe ser mayor a cero');

        prod.cantidad += cant;
        nuevoConcepto = `Compra Stock: ${prod.nombre} (+${cant})`;
        nuevoProdId = prod.id;
        nuevaCantStock = cant;
    } else {
        nuevoConcepto = document.getElementById('edit-gasto-concepto').value;
        if (!nuevoConcepto) return alert('Ingresa un concepto del gasto');
    }

    // Aplicar nuevo efecto en caja
    if (nuevoMetodo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) - nuevoMonto;
    else DB.caja.nequi = (DB.caja.nequi || 0) - nuevoMonto;

    gasto.concepto = nuevoConcepto;
    gasto.monto = nuevoMonto;
    gasto.metodo = nuevoMetodo;
    gasto.esStock = nuevoEsStock;
    gasto.prodId = nuevoProdId;
    gasto.cantidadStock = nuevaCantStock;
    gasto.fecha = nuevaFechaIso;

    guardarDB();
    cerrarModalEditarGasto();
    alert('Gasto/compra actualizado correctamente');
}

