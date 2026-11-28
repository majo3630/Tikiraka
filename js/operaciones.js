function toggleOperacion() {
    const tipo = document.getElementById('tipo-operacion').value;
    document.getElementById('form-venta').style.display = tipo === 'venta' ? 'block' : 'none';
    document.getElementById('form-venta-historica').style.display = tipo === 'venta-historica' ? 'block' : 'none';
    document.getElementById('form-devolucion').style.display = tipo === 'devolucion' ? 'block' : 'none';
    document.getElementById('form-gasto').style.display = tipo === 'gasto' ? 'block' : 'none';
    document.getElementById('form-gasto-historico').style.display = tipo === 'gasto-historico' ? 'block' : 'none';
}

function toggleGastoStock() {
    const esStock = document.getElementById('gasto-es-stock').checked;
    document.getElementById('gasto-simple-fields').style.display = esStock ? 'none' : 'block';
    document.getElementById('gasto-stock-fields').style.display = esStock ? 'block' : 'none';
}

// Gasto de otro mes: alterna entre "concepto" y "compra de un producto"
function toggleGastoHistProducto() {
    const esProducto = document.getElementById('gh-es-producto').checked;
    document.getElementById('gh-campo-concepto').style.display = esProducto ? 'none' : 'block';
    document.getElementById('gh-campos-producto').style.display = esProducto ? 'block' : 'none';
    document.getElementById('gh-monto').value = '';
    if (esProducto) autofillCostoGastoHist();
}

// Gasto de otro mes: elegir producto del inventario o escribir el nombre a mano
function toggleGastoHistManual() {
    const esManual = document.getElementById('gh-es-manual').checked;
    document.getElementById('gh-campo-select').style.display = esManual ? 'none' : 'block';
    document.getElementById('gh-campo-manual').style.display = esManual ? 'block' : 'none';
    document.getElementById('gh-monto').value = '';
    if (!esManual) autofillCostoGastoHist();
}

function autofillCostoGastoHist() {
    if (document.getElementById('gh-es-manual').checked) return;
    const prodId = parseInt(document.getElementById('gh-producto').value);
    const cant = parseInt(document.getElementById('gh-cantidad').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    document.getElementById('gh-monto').value = prod ? prod.costo * cant : '';
}

// Alterna entre elegir un producto del inventario o escribir el nombre a mano
function toggleHistoricaManual() {
    const esManual = document.getElementById('hist-es-manual').checked;
    document.getElementById('hist-campo-select').style.display = esManual ? 'none' : 'block';
    document.getElementById('hist-campo-manual').style.display = esManual ? 'block' : 'none';
    document.getElementById('hist-monto').value = '';
    if (!esManual) autofillPrecioHistorica();
}

// Venta normal: alterna entre elegir un producto del inventario o escribir
// el nombre de un producto NO registrado (no toca el stock, pero sí la caja)
function toggleVentaManual() {
    const esManual = document.getElementById('venta-es-manual').checked;
    document.getElementById('venta-campo-select').style.display = esManual ? 'none' : 'block';
    document.getElementById('venta-campo-manual').style.display = esManual ? 'block' : 'none';
    document.getElementById('venta-monto').value = '';
    if (!esManual) autofillPrecioVenta();
}

function autofillPrecioVenta() {
    if (document.getElementById('venta-es-manual').checked) return;
    const prodId = parseInt(document.getElementById('venta-producto').value);
    const cant = parseInt(document.getElementById('venta-cantidad').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    if (prod) {
        document.getElementById('venta-monto').value = prod.precio * cant;
    } else {
        document.getElementById('venta-monto').value = '';
    }
}

// Rellena el monto de la venta histórica (solo si se eligió un producto del inventario)
function autofillPrecioHistorica() {
    const esManual = document.getElementById('hist-es-manual').checked;
    if (esManual) return;
    const prodId = parseInt(document.getElementById('hist-producto').value);
    const cant = parseInt(document.getElementById('hist-cantidad').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    if (prod) {
        document.getElementById('hist-monto').value = prod.precio * cant;
    } else {
        document.getElementById('hist-monto').value = '';
    }
}

// Alterna entre elegir un producto del inventario o escribir el nombre a mano (devoluciones)
function toggleDevolucionManual() {
    const esManual = document.getElementById('devolucion-es-manual').checked;
    document.getElementById('devolucion-campo-select').style.display = esManual ? 'none' : 'block';
    document.getElementById('devolucion-campo-manual').style.display = esManual ? 'block' : 'none';
    document.getElementById('devolucion-monto').value = '';
    if (!esManual) autofillPrecioDevolucion();
}

function autofillPrecioDevolucion() {
    if (document.getElementById('devolucion-es-manual').checked) return;
    const prodId = parseInt(document.getElementById('devolucion-producto').value);
    const cant = parseInt(document.getElementById('devolucion-cantidad').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    if (prod) {
        document.getElementById('devolucion-monto').value = prod.precio * cant;
    } else {
        document.getElementById('devolucion-monto').value = '';
    }
}

function autofillCostoGasto() {
    const prodId = parseInt(document.getElementById('gasto-producto').value);
    const cant = parseInt(document.getElementById('gasto-cantidad-stock').value) || 1;
    const prod = DB.inventario.find(p => p.id === prodId);
    if (prod) {
        document.getElementById('gasto-monto').value = prod.costo * cant;
    } else {
        document.getElementById('gasto-monto').value = '';
    }
}

// LIMPIEZA TOTAL TRAS OPERACIÓN
function limpiarFormularioOperacion() {
    // Venta
    document.getElementById('venta-es-manual').checked = false;
    toggleVentaManual();
    document.getElementById('venta-producto').value = '';
    document.getElementById('venta-nombre-manual').value = '';
    document.getElementById('venta-cantidad').value = '1';
    document.getElementById('venta-monto').value = '';

    // Venta histórica
    document.getElementById('hist-es-manual').checked = false;
    toggleHistoricaManual();
    document.getElementById('hist-producto').value = '';
    document.getElementById('hist-nombre-manual').value = '';
    document.getElementById('hist-cantidad').value = '1';
    document.getElementById('hist-monto').value = '';

    // Gasto histórico
    document.getElementById('gh-es-producto').checked = false;
    document.getElementById('gh-es-manual').checked = false;
    toggleGastoHistProducto();
    toggleGastoHistManual();
    document.getElementById('gh-concepto').value = '';
    document.getElementById('gh-producto').value = '';
    document.getElementById('gh-nombre-manual').value = '';
    document.getElementById('gh-cantidad').value = '1';
    document.getElementById('gh-monto').value = '';

    // Devolución
    document.getElementById('devolucion-es-manual').checked = false;
    toggleDevolucionManual();
    document.getElementById('devolucion-nombre-manual').value = '';
    document.getElementById('devolucion-producto').value = '';
    document.getElementById('devolucion-cantidad').value = '1';
    document.getElementById('devolucion-monto').value = '';

    // Gasto
    document.getElementById('gasto-es-stock').checked = false;
    toggleGastoStock();
    document.getElementById('gasto-concepto').value = '';
    document.getElementById('gasto-producto').value = '';
    document.getElementById('gasto-cantidad-stock').value = '1';
    document.getElementById('gasto-monto').value = '';

    // Fecha: reiniciar al momento actual para la próxima operación
    inicializarFechaOperacion();
}

function procesarOperacion() {
    const tipo = document.getElementById('tipo-operacion').value;
    const metodoVal = document.getElementById('metodo-pago').value;
    const fechaIso = obtenerFechaOperacionISO('operacion-fecha');

    if (tipo === 'venta') {
        const esManual = document.getElementById('venta-es-manual').checked;
        const cant = parseInt(document.getElementById('venta-cantidad').value) || 0;
        const montoVal = parseFloat(document.getElementById('venta-monto').value) || 0;

        if (esManual) {
            // Producto NO registrado: no hay stock que cambiar, la caja sí se ajusta
            const nombreManual = document.getElementById('venta-nombre-manual').value.trim();
            if (!nombreManual) return alert('Escribe el nombre del producto');
            if (cant <= 0) return alert('La cantidad debe ser mayor a cero');

            if (metodoVal === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + montoVal;
            else DB.caja.nequi = (DB.caja.nequi || 0) + montoVal;

            DB.ventas.unshift({
                id: Date.now(),
                prodId: null,
                prodNombre: nombreManual,
                cantidad: cant,
                costoUnitario: 0,
                monto: montoVal,
                metodo: metodoVal,
                fecha: fechaIso,
                sinInventario: true
            });
        } else {
            const prodId = parseInt(document.getElementById('venta-producto').value);
            const prod = DB.inventario.find(p => p.id === prodId);

            if (!prod) return alert('Selecciona un producto válido');
            if (cant <= 0) return alert('La cantidad debe ser mayor a cero');
            if (prod.cantidad < cant) return alert('Stock insuficiente');

            prod.cantidad -= cant;
            
            if (metodoVal === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + montoVal;
            else DB.caja.nequi = (DB.caja.nequi || 0) + montoVal;

            DB.ventas.unshift({
                id: Date.now(),
                prodId: prod.id,
                prodNombre: prod.nombre,
                cantidad: cant,
                costoUnitario: prod.costo || 0,
                monto: montoVal,
                metodo: metodoVal,
                fecha: fechaIso
            });
        }

    } else if (tipo === 'venta-historica') {
        // VENTA DE OTRO MES: solo queda en el historial.
        // NO toca la caja y NO toca el stock del inventario.
        const esManual = document.getElementById('hist-es-manual').checked;
        const cant = parseInt(document.getElementById('hist-cantidad').value) || 0;
        const montoVal = parseFloat(document.getElementById('hist-monto').value);
        const fechaCampo = document.getElementById('operacion-fecha').value;

        let nombreProd = '';
        let prodIdGuardar = null;
        let costoUnit = 0;

        if (esManual) {
            nombreProd = document.getElementById('hist-nombre-manual').value.trim();
            if (!nombreProd) return alert('Escribe el nombre del producto');
        } else {
            const prodId = parseInt(document.getElementById('hist-producto').value);
            const prod = DB.inventario.find(p => p.id === prodId);
            if (!prod) return alert('Selecciona un producto o marca la opción de escribirlo a mano');
            nombreProd = prod.nombre;
            prodIdGuardar = prod.id;
            costoUnit = prod.costo || 0;
        }

        if (!fechaCampo) return alert('Elige la fecha en que se hizo la venta');
        if (cant <= 0) return alert('La cantidad debe ser mayor a cero');
        if (isNaN(montoVal) || montoVal < 0) return alert('Ingresa un monto válido');

        DB.ventas.unshift({
            id: Date.now(),
            prodId: prodIdGuardar,
            prodNombre: nombreProd,
            cantidad: cant,
            costoUnitario: costoUnit,
            monto: montoVal,
            metodo: metodoVal,
            fecha: fechaIso,
            historica: true
        });

    } else if (tipo === 'gasto-historico') {
        // GASTO DE OTRO MES: solo queda en el historial.
        // NO toca la caja y NO toca el stock del inventario.
        const esProducto = document.getElementById('gh-es-producto').checked;
        const montoVal = parseFloat(document.getElementById('gh-monto').value);
        const fechaCampo = document.getElementById('operacion-fecha').value;
        let concepto = '';

        if (!fechaCampo) return alert('Elige la fecha en que se hizo el gasto');

        if (esProducto) {
            const cant = parseInt(document.getElementById('gh-cantidad').value) || 0;
            const esManual = document.getElementById('gh-es-manual').checked;
            let nombreProd = '';

            if (esManual) {
                nombreProd = document.getElementById('gh-nombre-manual').value.trim();
                if (!nombreProd) return alert('Escribe el nombre del producto');
            } else {
                const prodId = parseInt(document.getElementById('gh-producto').value);
                const prod = DB.inventario.find(p => p.id === prodId);
                if (!prod) return alert('Selecciona un producto o marca la opción de escribirlo a mano');
                nombreProd = prod.nombre;
            }
            if (cant <= 0) return alert('La cantidad debe ser mayor a cero');
            concepto = `Compra: ${nombreProd} (x${cant})`;
        } else {
            concepto = document.getElementById('gh-concepto').value.trim();
            if (!concepto) return alert('Ingresa un concepto del gasto');
        }

        if (isNaN(montoVal) || montoVal < 0) return alert('Ingresa un monto válido (puede ser 0)');

        DB.gastos.unshift({
            id: Date.now(),
            concepto: concepto,
            monto: montoVal,
            metodo: metodoVal,
            fecha: fechaIso,
            esStock: false,
            prodId: null,
            cantidadStock: null,
            historica: true
        });

    } else if (tipo === 'devolucion') {
        const esManual = document.getElementById('devolucion-es-manual').checked;
        const cant = parseInt(document.getElementById('devolucion-cantidad').value) || 0;
        const montoVal = parseFloat(document.getElementById('devolucion-monto').value) || 0;

        if (esManual) {
            // Producto escrito a mano: no hay stock que cambiar, la caja sí se ajusta igual
            const nombreManual = document.getElementById('devolucion-nombre-manual').value.trim();
            if (!nombreManual) return alert('Escribe el nombre del producto');
            if (cant <= 0) return alert('La cantidad debe ser mayor a cero');

            if (metodoVal === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + montoVal;
            else DB.caja.nequi = (DB.caja.nequi || 0) + montoVal;

            DB.ventas.unshift({
                id: Date.now(),
                prodId: null,
                prodNombre: `(Devolución) ${nombreManual}`,
                cantidad: cant,
                costoUnitario: 0,
                monto: montoVal,
                metodo: metodoVal,
                fecha: fechaIso,
                sinInventario: true
            });
        } else {
            const prodId = parseInt(document.getElementById('devolucion-producto').value);
            const prod = DB.inventario.find(p => p.id === prodId);

            if (!prod) return alert('Selecciona un producto válido');
            if (cant <= 0) return alert('La cantidad debe ser mayor a cero');
            if (prod.cantidad < cant) return alert('Stock insuficiente para realizar la devolución');

            // Disminuir stock y aumentar dinero en caja
            prod.cantidad -= cant;

            if (metodoVal === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) + montoVal;
            else DB.caja.nequi = (DB.caja.nequi || 0) + montoVal;

            DB.ventas.unshift({
                id: Date.now(),
                prodId: prod.id,
                prodNombre: `(Devolución) ${prod.nombre}`,
                cantidad: cant,
                costoUnitario: prod.costo || 0,
                monto: montoVal,
                metodo: metodoVal,
                fecha: fechaIso
            });
        }

    } else {
        const esStock = document.getElementById('gasto-es-stock').checked;
        const montoVal = parseFloat(document.getElementById('gasto-monto').value) || 0;
        let concepto = '';
        let prodIdGuardar = null;
        let cantGuardar = null;

        if (montoVal < 0) return alert('El monto no puede ser negativo');

        if (esStock) {
            const prodId = parseInt(document.getElementById('gasto-producto').value);
            const cant = parseInt(document.getElementById('gasto-cantidad-stock').value) || 0;
            const prod = DB.inventario.find(p => p.id === prodId);

            if (!prod) return alert('Selecciona un producto para reposición');
            if (cant <= 0) return alert('La cantidad debe ser mayor a cero');

            prod.cantidad += cant;
            concepto = `Compra Stock: ${prod.nombre} (+${cant})`;
            prodIdGuardar = prod.id;
            cantGuardar = cant;
        } else {
            concepto = document.getElementById('gasto-concepto').value;
            if (!concepto) return alert('Ingresa un concepto del gasto');
        }

        if (metodoVal === 'Efectivo') DB.caja.efectivo = (DB.caja.efectivo || 0) - montoVal;
        else DB.caja.nequi = (DB.caja.nequi || 0) - montoVal;

        DB.gastos.unshift({
            id: Date.now(),
            concepto: concepto,
            monto: montoVal,
            metodo: metodoVal,
            fecha: fechaIso,
            esStock: esStock,
            prodId: prodIdGuardar,
            cantidadStock: cantGuardar
        });
    }

    guardarDB();
    if (tipo === 'venta-historica') {
        alert('Venta de otro mes registrada. No se cambió la caja ni el stock.');
    } else if (tipo === 'gasto-historico') {
        alert('Gasto de otro mes registrado. No se cambió la caja ni el stock.');
    } else {
        alert('Operación registrada exitosamente');
    }
    limpiarFormularioOperacion();
}

