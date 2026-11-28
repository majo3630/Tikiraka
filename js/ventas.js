/* --- EDICIÓN Y ELIMINACIÓN DE VENTAS --- */
function eliminarVenta(id) {
    const index = DB.ventas.findIndex(v => v.id === id);
    if (index === -1) return;

    const venta = DB.ventas[index];

    // Venta de otro mes: solo se borra del historial, sin tocar caja ni stock
    if (venta.historica) {
        if (!confirm('¿Eliminar esta venta de otro mes? No cambiará la caja ni el inventario.')) return;
        DB.ventas.splice(index, 1);
        guardarDB();
        alert('Venta eliminada del historial.');
        return;
    }

    if (!confirm('¿Estás seguro de eliminar esta venta? Esto devolverá el stock al inventario y descontará el dinero de la caja.')) return;

    const pId = venta.prodId || venta.productoId;
    const cantVenta = venta.cantidad || 1;
    const montoVenta = venta.monto !== undefined ? venta.monto : (venta.montoTotal || 0);
    const metodoVenta = venta.metodo || venta.metodoPago || 'Efectivo';

    const prod = DB.inventario.find(p => p.id === pId);
    if (prod) {
        prod.cantidad += cantVenta;
    }

    if (metodoVenta === 'Efectivo') {
        DB.caja.efectivo = (DB.caja.efectivo || 0) - montoVenta;
    } else {
        DB.caja.nequi = (DB.caja.nequi || 0) - montoVenta;
    }

    DB.ventas.splice(index, 1);

    guardarDB();
    alert('Venta eliminada y saldos/inventario reajustados.');
}

function abrirModalEditarVenta(id) {
    const venta = DB.ventas.find(v => v.id === id);
    if (!venta) return;

    const selectProd = document.getElementById('edit-venta-producto');
    selectProd.innerHTML = '';
    
    DB.inventario.forEach(p => {
        selectProd.innerHTML += `<option value="${p.id}">${p.nombre} (${formatoMoneda(p.precio)})</option>`;
    });

    const esHistorica = !!venta.historica;
    const esSinInventario = !!venta.sinInventario;
    const usaNombre = esHistorica || esSinInventario;

    // Mostrar el campo correcto según el tipo de venta
    const avisoEdit = document.getElementById('edit-venta-aviso-historica');
    avisoEdit.style.display = usaNombre ? 'block' : 'none';
    avisoEdit.innerText = esHistorica
        ? 'Venta de otro mes: editarla NO cambia la caja ni el stock.'
        : 'Producto escrito a mano: editarlo cambia la caja, pero NO cambia el stock.';
    document.getElementById('edit-venta-campo-select').style.display = usaNombre ? 'none' : 'block';
    document.getElementById('edit-venta-campo-nombre').style.display = usaNombre ? 'block' : 'none';

    document.getElementById('edit-venta-id').value = venta.id;
    if (usaNombre) {
        document.getElementById('edit-venta-nombre').value = venta.prodNombre || '';
    } else {
        document.getElementById('edit-venta-producto').value = venta.prodId || venta.productoId;
    }
    document.getElementById('edit-venta-cantidad').value = venta.cantidad || 1;
    document.getElementById('edit-venta-monto').value = venta.monto !== undefined ? venta.monto : (venta.montoTotal || 0);
    document.getElementById('edit-venta-metodo').value = venta.metodo || venta.metodoPago || 'Efectivo';
    document.getElementById('edit-venta-fecha').value = isoAFechaLocalInput(venta.fecha || venta.isoFecha);

    document.getElementById('modal-editar-venta').style.display = 'flex';
}

function cerrarModalEditarVenta() {
    document.getElementById('modal-editar-venta').style.display = 'none';
}

function autofillEditVentaPrecio() {
    const idVenta = parseInt(document.getElementById('edit-venta-id').value);
    const ventaActual = DB.ventas.find(v => v.id === idVenta);
    // En ventas de otro mes el monto no se rellena solo (puede ser de un producto que ya no existe)
    if (ventaActual && (ventaActual.historica || ventaActual.sinInventario)) return;

    const prodId = parseInt(document.getElementById('edit-venta-producto').value);
    const cant = parseInt(document.getElementById('edit-venta-cantidad').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    if (prod) {
        document.getElementById('edit-venta-monto').value = prod.precio * cant;
    }
}

function guardarEdicionVenta() {
    const id = parseInt(document.getElementById('edit-venta-id').value);
    const venta = DB.ventas.find(v => v.id === id);
    if (!venta) return;

    const nuevaCant = parseInt(document.getElementById('edit-venta-cantidad').value) || 0;
    const nuevoMonto = parseFloat(document.getElementById('edit-venta-monto').value) || 0;
    const nuevoMetodo = document.getElementById('edit-venta-metodo').value;
    const nuevaFechaIso = obtenerFechaOperacionISO('edit-venta-fecha');

    if (nuevaCant <= 0) return alert('La cantidad debe ser mayor a 0');
    if (nuevoMonto < 0) return alert('El monto no puede ser negativo');

    // Venta de otro mes: se actualiza solo el registro, sin tocar caja ni stock
    if (venta.historica) {
        const nuevoNombre = document.getElementById('edit-venta-nombre').value.trim();
        if (!nuevoNombre) return alert('Escribe el nombre del producto');

        venta.prodNombre = nuevoNombre;
        venta.cantidad = nuevaCant;
        venta.monto = nuevoMonto;
        venta.metodo = nuevoMetodo;
        venta.fecha = nuevaFechaIso;

        guardarDB();
        cerrarModalEditarVenta();
        alert('Venta de otro mes actualizada (sin cambios en caja ni stock)');
        return;
    }

    // Devolución con producto escrito a mano: cambia la caja, pero no el stock
    if (venta.sinInventario) {
        const nuevoNombre = document.getElementById('edit-venta-nombre').value.trim();
        if (!nuevoNombre) return alert('Escribe el nombre del producto');

        const montoViejo = venta.monto !== undefined ? venta.monto : (venta.montoTotal || 0);
        const metodoViejo = venta.metodo || venta.metodoPago || 'Efectivo';

        if (metodoViejo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) - montoViejo;
        else DB.caja.nequi = (DB.caja.nequi || 0) - montoViejo;

        if (nuevoMetodo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + nuevoMonto;
        else DB.caja.nequi = (DB.caja.nequi || 0) + nuevoMonto;

        venta.prodNombre = nuevoNombre;
        venta.cantidad = nuevaCant;
        venta.monto = nuevoMonto;
        venta.metodo = nuevoMetodo;
        venta.fecha = nuevaFechaIso;

        guardarDB();
        cerrarModalEditarVenta();
        alert('Devolución actualizada correctamente');
        return;
    }

    const nuevoProdId = parseInt(document.getElementById('edit-venta-producto').value);
    if (!DB.inventario.find(p => p.id === nuevoProdId)) return alert('Producto no encontrado');

    const pIdAntiguo = venta.prodId || venta.productoId;
    const cantAntigua = venta.cantidad || 1;
    const montoAntiguo = venta.monto !== undefined ? venta.monto : (venta.montoTotal || 0);
    const metodoAntiguo = venta.metodo || venta.metodoPago || 'Efectivo';

    const prodAntiguo = DB.inventario.find(p => p.id === pIdAntiguo);
    if (prodAntiguo) prodAntiguo.cantidad += cantAntigua;

    if (metodoAntiguo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) - montoAntiguo;
    else DB.caja.nequi = (DB.caja.nequi || 0) - montoAntiguo;

    const nuevoProd = DB.inventario.find(p => p.id === nuevoProdId);
    if (!nuevoProd) return alert('Producto no encontrado');
    if (nuevoProd.cantidad < nuevaCant) {
        if (prodAntiguo) prodAntiguo.cantidad -= cantAntigua;
        if (metodoAntiguo === 'Efectivo') DB.caja.efectivo += montoAntiguo;
        else DB.caja.nequi += montoAntiguo;
        return alert('Stock insuficiente para la nueva cantidad');
    }

    nuevoProd.cantidad -= nuevaCant;

    if (nuevoMetodo === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + nuevoMonto;
    else DB.caja.nequi = (DB.caja.nequi || 0) + nuevoMonto;

    venta.prodId = nuevoProd.id;
    venta.prodNombre = nuevoProd.nombre;
    venta.cantidad = nuevaCant;
    venta.monto = nuevoMonto;
    venta.metodo = nuevoMetodo;
    venta.costoUnitario = nuevoProd.costo || 0;
    venta.fecha = nuevaFechaIso;

    guardarDB();
    cerrarModalEditarVenta();
    alert('Venta actualizada correctamente');
}

