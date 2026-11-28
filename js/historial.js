/* --- HISTORIAL --- */
function cargarFiltroMeses() {
    const selectMes = document.getElementById('filtro-mes');
    const selectMesGraficas = document.getElementById('filtro-mes-graficas');
    if(!selectMes && !selectMesGraficas) return;

    const opcionActual = selectMes ? selectMes.value : null;
    const opcionActualGraficas = selectMesGraficas ? selectMesGraficas.value : null;

    const mesesSet = new Set();
    [...DB.ventas, ...DB.gastos].forEach(item => {
        const f = item.fecha || item.isoFecha;
        const mesAño = obtenerAnioMesLocal(f);
        if (mesAño) mesesSet.add(mesAño);
    });
    // También consideramos los días de asistencia para que las gráficas
    // por mes incluyan meses donde solo hubo asistencia registrada.
    DB.socios.forEach(s => {
        (s.asistencia || []).forEach(fechaStr => {
            const mesAño = obtenerAnioMesDeFechaCorta(fechaStr);
            if (mesAño) mesesSet.add(mesAño);
        });
    });

    const opcionesHtml = Array.from(mesesSet).sort().reverse().map(m => {
        const [yyyy, mm] = m.split('-');
        if(!yyyy || !mm) return '';
        const fechaObj = new Date(yyyy, mm - 1, 1);
        const nombreMes = fechaObj.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
        return `<option value="${m}">${nombreMes.toUpperCase()}</option>`;
    }).join('');

    if (selectMes) {
        selectMes.innerHTML = '<option value="TODOS">Todos los meses</option>' + opcionesHtml;
        if (opcionActual) selectMes.value = opcionActual;
    }
    if (selectMesGraficas) {
        selectMesGraficas.innerHTML = '<option value="TODOS">Todos los meses</option>' + opcionesHtml;
        if (opcionActualGraficas) selectMesGraficas.value = opcionActualGraficas;
    }
}

// Convierte una fecha corta tipo "DD/MM/YYYY" (formato usado en asistencia,
// vía toLocaleDateString('es-CO')) a un identificador "YYYY-MM" en hora local.
function obtenerAnioMesDeFechaCorta(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string') return null;
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return null;
    const [dd, mm, yyyy] = partes;
    if (!dd || !mm || !yyyy) return null;
    return `${yyyy}-${mm.padStart(2, '0')}`;
}

function cargarHistorial() {
    const filtro = document.getElementById('filtro-mes').value;
    const tbodyVentas = document.getElementById('tabla-historial-ventas');
    const tbodyGastos = document.getElementById('tabla-historial-gastos');

    tbodyVentas.innerHTML = '';
    tbodyGastos.innerHTML = '';

    const ventasFiltradas = DB.ventas.filter(v => {
        const f = v.fecha || v.isoFecha || '';
        return filtro === 'TODOS' || obtenerAnioMesLocal(f) === filtro;
    });

    const gastosFiltrados = DB.gastos.filter(g => {
        const f = g.fecha || g.isoFecha || '';
        return filtro === 'TODOS' || obtenerAnioMesLocal(f) === filtro;
    });

    // Más reciente primero
    [...ventasFiltradas].sort((a, b) => timestampItem(b) - timestampItem(a)).forEach(v => {
        const prodNombre = v.prodNombre || v.productoNombre || 'Sin Nombre';
        const etiquetaHistorica = v.historica ? '<span class="tag-historica">Otro mes</span>' : '';
        const montoVal = v.monto !== undefined ? v.monto : (v.montoTotal || 0);
        const metodoVal = v.metodo || v.metodoPago || 'Efectivo';
        const fechaMostrar = v.fecha ? (typeof v.fecha === 'string' && v.fecha.includes('T') ? new Date(v.fecha).toLocaleString('es-CO') : v.fecha) : 'Sin fecha';

        tbodyVentas.innerHTML += `
            <tr>
                <td style="font-size:0.75rem;">${fechaMostrar}</td>
                <td>${prodNombre}${etiquetaHistorica}</td>
                <td>${v.cantidad || 1}</td>
                <td><strong>${formatoMoneda(montoVal)}</strong></td>
                <td>${metodoVal}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-warning" onclick="abrirModalEditarVenta(${v.id})">✏️</button>
                        <button class="btn btn-danger" onclick="eliminarVenta(${v.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    [...gastosFiltrados].sort((a, b) => timestampItem(b) - timestampItem(a)).forEach(g => {
        const montoVal = g.monto !== undefined ? g.monto : (g.montoTotal || 0);
        const metodoVal = g.metodo || g.metodoPago || 'Efectivo';
        const fechaMostrar = g.fecha ? (typeof g.fecha === 'string' && g.fecha.includes('T') ? new Date(g.fecha).toLocaleString('es-CO') : g.fecha) : 'Sin fecha';

        tbodyGastos.innerHTML += `
            <tr>
                <td style="font-size:0.75rem;">${fechaMostrar}</td>
                <td>${g.concepto || 'Gasto'}${g.historica ? '<span class="tag-historica">Otro mes</span>' : ''}</td>
                <td><strong style="color:var(--danger);">${formatoMoneda(montoVal)}</strong></td>
                <td>${metodoVal}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-warning" onclick="abrirModalEditarGasto(${g.id})">✏️</button>
                        <button class="btn btn-danger" onclick="eliminarGasto(${g.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

/* --- GRÁFICAS --- */
function renderizarGraficas() {
    const selectMesGraficas = document.getElementById('filtro-mes-graficas');
    const filtro = selectMesGraficas ? selectMesGraficas.value : 'TODOS';

    const ventasFiltradas = DB.ventas.filter(v => {
        const f = v.fecha || v.isoFecha || '';
        return filtro === 'TODOS' || obtenerAnioMesLocal(f) === filtro;
    });
    const gastosFiltrados = DB.gastos.filter(g => {
        const f = g.fecha || g.isoFecha || '';
        return filtro === 'TODOS' || obtenerAnioMesLocal(f) === filtro;
    });

    const contexProd = document.getElementById('chartProductos').getContext('2d');
    const prodConteo = {};
    ventasFiltradas.forEach(v => {
        const nombre = v.prodNombre || v.productoNombre || 'Producto';
        const cant = v.cantidad || 1;
        prodConteo[nombre] = (prodConteo[nombre] || 0) + cant;
    });

    if(charts.prod) charts.prod.destroy();
    charts.prod = new Chart(contexProd, {
        type: 'bar',
        data: {
            labels: Object.keys(prodConteo),
            datasets: [{
                label: 'Unidades Vendidas',
                data: Object.values(prodConteo),
                backgroundColor: '#d96b1a'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const contexDia = document.getElementById('chartVentasDia').getContext('2d');
    const ventasDia = {};
    [...ventasFiltradas].sort((a, b) => timestampItem(a) - timestampItem(b)).forEach(v => {
        let dia = 'Fecha';
        if(v.fecha && typeof v.fecha === 'string') {
            dia = v.fecha.includes('T') ? new Date(v.fecha).toLocaleDateString('es-CO') : v.fecha.split(',')[0];
        }
        const montoVal = v.monto !== undefined ? v.monto : (v.montoTotal || 0);
        ventasDia[dia] = (ventasDia[dia] || 0) + montoVal;
    });

    if(charts.dia) charts.dia.destroy();
    charts.dia = new Chart(contexDia, {
        type: 'line',
        data: {
            labels: Object.keys(ventasDia),
            datasets: [{
                label: 'Ventas ($)',
                data: Object.values(ventasDia),
                borderColor: '#2e7d32',
                fill: false
            }]
        },
        options: { responsive: true }
    });

    const contexFin = document.getElementById('chartFinanzas').getContext('2d');
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (v.monto !== undefined ? v.monto : (v.montoTotal || 0)), 0);
    const totalGastos = gastosFiltrados.reduce((sum, g) => sum + (g.monto !== undefined ? g.monto : (g.montoTotal || 0)), 0);
    const ganancia = totalVentas - totalGastos;

    if(charts.fin) charts.fin.destroy();
    charts.fin = new Chart(contexFin, {
        type: 'doughnut',
        data: {
            labels: ['Ventas Totales', 'Gastos Totales', 'Ganancia Neta'],
            datasets: [{
                data: [totalVentas, totalGastos, ganancia < 0 ? 0 : ganancia],
                backgroundColor: ['#2e7d32', '#c62828', '#ffd700']
            }]
        },
        options: { responsive: true }
    });

    const contexAsis = document.getElementById('chartAsistencia').getContext('2d');
    const nombresSocios = DB.socios.map(s => s.nombre);
    const diasAsistidos = DB.socios.map(s => {
        if (!s.asistencia) return 0;
        if (filtro === 'TODOS') return s.asistencia.length;
        return s.asistencia.filter(fechaStr => obtenerAnioMesDeFechaCorta(fechaStr) === filtro).length;
    });

    if(charts.asis) charts.asis.destroy();
    charts.asis = new Chart(contexAsis, {
        type: 'bar',
        data: {
            labels: nombresSocios,
            datasets: [{
                label: 'Días Trabados / Asistidos',
                data: diasAsistidos,
                backgroundColor: '#f57c00'
            }]
        },
        options: { responsive: true }
    });
}

