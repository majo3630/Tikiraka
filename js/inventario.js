/* --- INVENTARIO --- */
function agregarProducto() {
    const nombre = document.getElementById('prod-nombre').value;
    const cantidad = parseInt(document.getElementById('prod-cantidad').value) || 0;
    const costo = parseFloat(document.getElementById('prod-costo').value) || 0;
    const precio = parseFloat(document.getElementById('prod-precio').value) || 0;
    const fotoInput = document.getElementById('prod-foto');

    if (!nombre) return alert('Ingresa un nombre de producto');

    const guardar = (fotoBase64) => {
        DB.inventario.push({ id: Date.now(), nombre, cantidad, costo, precio, foto: fotoBase64 });
        guardarDB();
        limpiarFormularioProd();
    };

    if (fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => guardar(e.target.result);
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        guardar('');
    }
}

function limpiarFormularioProd() {
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-cantidad').value = '';
    document.getElementById('prod-costo').value = '';
    document.getElementById('prod-precio').value = '';
    document.getElementById('prod-foto').value = '';
}

function renderInventario() {
    const tbody = document.getElementById('tabla-inventario');
    const selectVenta = document.getElementById('venta-producto');
    const selectHistorica = document.getElementById('hist-producto');
    const selectGastoHist = document.getElementById('gh-producto');
    const selectDevolucion = document.getElementById('devolucion-producto');
    const selectGasto = document.getElementById('gasto-producto');

    const valVenta = selectVenta.value;
    const valHistorica = selectHistorica ? selectHistorica.value : '';
    const valGastoHist = selectGastoHist ? selectGastoHist.value : '';
    const valDevolucion = selectDevolucion ? selectDevolucion.value : '';
    const valGasto = selectGasto.value;

    tbody.innerHTML = '';
    selectVenta.innerHTML = '<option value="">Selecciona Producto</option>';
    if (selectHistorica) selectHistorica.innerHTML = '<option value="">Selecciona Producto</option>';
    if (selectGastoHist) selectGastoHist.innerHTML = '<option value="">Selecciona Producto</option>';
    if (selectDevolucion) selectDevolucion.innerHTML = '<option value="">Selecciona Producto</option>';
    selectGasto.innerHTML = '<option value="">Selecciona Producto</option>';

    DB.inventario.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${p.foto || 'https://via.placeholder.com/40'}" class="img-thumb"></td>
                <td>${p.nombre}</td>
                <td><strong>${p.cantidad}</strong></td>
                <td>${formatoMoneda(p.precio)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-warning" onclick="abrirModalEditar(${p.id})">✏️</button>
                        <button class="btn btn-danger" onclick="eliminarProducto(${p.id})">X</button>
                    </div>
                </td>
            </tr>
        `;
        selectVenta.innerHTML += `<option value="${p.id}">${p.nombre} (${formatoMoneda(p.precio)})</option>`;
        if (selectHistorica) selectHistorica.innerHTML += `<option value="${p.id}">${p.nombre} (${formatoMoneda(p.precio)})</option>`;
        if (selectGastoHist) selectGastoHist.innerHTML += `<option value="${p.id}">${p.nombre} (Costo: ${formatoMoneda(p.costo)})</option>`;
        if (selectDevolucion) selectDevolucion.innerHTML += `<option value="${p.id}">${p.nombre} (${formatoMoneda(p.precio)})</option>`;
        selectGasto.innerHTML += `<option value="${p.id}">${p.nombre} (Costo: ${formatoMoneda(p.costo)})</option>`;
    });

    if (valVenta) selectVenta.value = valVenta;
    if (valHistorica && selectHistorica) selectHistorica.value = valHistorica;
    if (valGastoHist && selectGastoHist) selectGastoHist.value = valGastoHist;
    if (valDevolucion && selectDevolucion) selectDevolucion.value = valDevolucion;
    if (valGasto) selectGasto.value = valGasto;
}

function eliminarProducto(id) {
    if(confirm('¿Estás seguro de eliminar este producto?')) {
        DB.inventario = DB.inventario.filter(p => p.id !== id);
        guardarDB();
    }
}

function abrirModalEditar(id) {
    const prod = DB.inventario.find(p => p.id === id);
    if(!prod) return;

    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-prod-nombre').value = prod.nombre;
    document.getElementById('edit-prod-cantidad').value = prod.cantidad;
    document.getElementById('edit-prod-costo').value = prod.costo;
    document.getElementById('edit-prod-precio').value = prod.precio;
    document.getElementById('edit-prod-foto').value = '';

    document.getElementById('modal-editar').style.display = 'flex';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
}

function guardarEdicionProducto() {
    const id = parseInt(document.getElementById('edit-prod-id').value);
    const prod = DB.inventario.find(p => p.id === id);

    if(!prod) return;

    const nombre = document.getElementById('edit-prod-nombre').value;
    const cantidad = parseInt(document.getElementById('edit-prod-cantidad').value) || 0;
    const costo = parseFloat(document.getElementById('edit-prod-costo').value) || 0;
    const precio = parseFloat(document.getElementById('edit-prod-precio').value) || 0;
    const fotoInput = document.getElementById('edit-prod-foto');

    if(!nombre) return alert('El nombre no puede estar vacío');

    prod.nombre = nombre;
    prod.cantidad = cantidad;
    prod.costo = costo;
    prod.precio = precio;

    if (fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            prod.foto = e.target.result;
            guardarDB();
            cerrarModalEditar();
        };
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        guardarDB();
        cerrarModalEditar();
    }
}

