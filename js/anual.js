/* --- ANUAL --- */
const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function montoDeItem(item) {
    return item.monto !== undefined ? item.monto : (item.montoTotal || 0);
}

function colorGanancia(valor) {
    return valor < 0 ? 'var(--danger)' : '#ffd700';
}

function cargarFiltroAnios() {
    const select = document.getElementById('filtro-anio');
    if (!select) return;
    const actual = select.value;

    const anios = new Set([new Date().getFullYear()]);
    [...DB.ventas, ...DB.gastos].forEach(item => {
        const d = new Date(item.fecha || item.isoFecha);
        if (!isNaN(d.getTime())) anios.add(d.getFullYear());
    });

    const lista = Array.from(anios).sort((a, b) => b - a);
    select.innerHTML = lista.map(a => `<option value="${a}">${a}</option>`).join('');
    if (actual && lista.map(String).includes(actual)) select.value = actual;
}

function renderizarAnual() {
    const select = document.getElementById('filtro-anio');
    if (!select || !select.value) return;
    const anio = parseInt(select.value);

    // Totales por mes del año elegido
    const ventasMes = Array(12).fill(0);
    const gastosMes = Array(12).fill(0);

    DB.ventas.forEach(v => {
        const d = new Date(v.fecha || v.isoFecha);
        if (isNaN(d.getTime()) || d.getFullYear() !== anio) return;
        ventasMes[d.getMonth()] += montoDeItem(v);
    });
    DB.gastos.forEach(g => {
        const d = new Date(g.fecha || g.isoFecha);
        if (isNaN(d.getTime()) || d.getFullYear() !== anio) return;
        gastosMes[d.getMonth()] += montoDeItem(g);
    });
    const gananciaMes = ventasMes.map((v, i) => v - gastosMes[i]);

    // Los meses que todavía no llegan no se dibujan (la línea se corta)
    const hoy = new Date();
    let ultimoMes = 11;
    if (anio === hoy.getFullYear()) ultimoMes = hoy.getMonth();
    else if (anio > hoy.getFullYear()) ultimoMes = -1;
    const recortar = arr => arr.map((v, i) => i <= ultimoMes ? v : null);

    // Gráfica de líneas
    const ctx = document.getElementById('chartAnual').getContext('2d');
    if (charts.anual) charts.anual.destroy();
    charts.anual = new Chart(ctx, {
        type: 'line',
        data: {
            labels: MESES_NOMBRES,
            datasets: [
                { label: 'Gastos', data: recortar(gastosMes), borderColor: '#e05252', backgroundColor: '#e05252', borderWidth: 2.5, tension: 0, pointRadius: 0, pointHoverRadius: 5, spanGaps: false },
                { label: 'Ganancias', data: recortar(gananciaMes), borderColor: '#ffd54f', backgroundColor: '#ffd54f', borderWidth: 2.5, tension: 0, pointRadius: 0, pointHoverRadius: 5, spanGaps: false },
                { label: 'Ventas', data: recortar(ventasMes), borderColor: '#8bc34a', backgroundColor: '#8bc34a', borderWidth: 2.5, tension: 0, pointRadius: 0, pointHoverRadius: 5, spanGaps: false }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: { display: true, text: 'Gastos, ganancias y ventas ' + anio, color: '#b0b0b0', font: { size: 18, weight: 'bold' } },
                legend: { position: 'top', labels: { color: '#ffffff' } },
                tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatoMoneda(c.parsed.y)}` } }
            },
            scales: {
                x: { ticks: { color: '#b0b0b0', maxRotation: 45, minRotation: 45 }, grid: { display: false } },
                y: { ticks: { color: '#b0b0b0', callback: (v) => '$' + Number(v).toLocaleString('es-CO') }, grid: { color: '#333333' } }
            }
        }
    });

    // Resumen del año
    const totalVentas = ventasMes.reduce((a, b) => a + b, 0);
    const totalGastos = gastosMes.reduce((a, b) => a + b, 0);
    const totalGanancia = totalVentas - totalGastos;

    document.getElementById('anual-ventas').innerText = formatoMoneda(totalVentas);
    document.getElementById('anual-gastos').innerText = formatoMoneda(totalGastos);
    const elGan = document.getElementById('anual-ganancia');
    elGan.innerText = formatoMoneda(totalGanancia);
    elGan.style.color = totalGanancia < 0 ? 'var(--danger)' : '#ffd700';

    const maxVentas = Math.max(...ventasMes);
    const elMejor = document.getElementById('anual-mejor-mes');
    if (maxVentas > 0) {
        const idx = ventasMes.indexOf(maxVentas);
        elMejor.innerText = `Mejor mes en ventas: ${MESES_NOMBRES[idx]} (${formatoMoneda(maxVentas)})`;
    } else {
        elMejor.innerText = 'Aún no hay ventas registradas en este año.';
    }

    // Tabla por mes
    const tbodyMeses = document.getElementById('tabla-meses-anio');
    let filas = MESES_NOMBRES.map((mes, i) => `
        <tr>
            <td>${mes}</td>
            <td>${formatoMoneda(ventasMes[i])}</td>
            <td>${formatoMoneda(gastosMes[i])}</td>
            <td style="color:${colorGanancia(gananciaMes[i])}; font-weight:bold;">${formatoMoneda(gananciaMes[i])}</td>
        </tr>
    `).join('');
    filas += `
        <tr style="background-color:#111;">
            <td><strong>TOTAL ${anio}</strong></td>
            <td><strong>${formatoMoneda(totalVentas)}</strong></td>
            <td><strong>${formatoMoneda(totalGastos)}</strong></td>
            <td style="color:${colorGanancia(totalGanancia)}; font-weight:bold;">${formatoMoneda(totalGanancia)}</td>
        </tr>
    `;
    tbodyMeses.innerHTML = filas;

    // Comparación entre todos los años
    const anioVentas = {};
    const anioGastos = {};
    DB.ventas.forEach(v => {
        const d = new Date(v.fecha || v.isoFecha);
        if (isNaN(d.getTime())) return;
        const a = d.getFullYear();
        anioVentas[a] = (anioVentas[a] || 0) + montoDeItem(v);
        if (anioGastos[a] === undefined) anioGastos[a] = 0;
    });
    DB.gastos.forEach(g => {
        const d = new Date(g.fecha || g.isoFecha);
        if (isNaN(d.getTime())) return;
        const a = d.getFullYear();
        anioGastos[a] = (anioGastos[a] || 0) + montoDeItem(g);
        if (anioVentas[a] === undefined) anioVentas[a] = 0;
    });
    const anios = Object.keys(anioVentas).sort().reverse();
    const tbodyAnios = document.getElementById('tabla-ventas-anio');
    if (anios.length === 0) {
        tbodyAnios.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary);">Aún no hay ventas registradas.</td></tr>';
    } else {
        tbodyAnios.innerHTML = anios.map(a => {
            const gan = anioVentas[a] - anioGastos[a];
            return `
                <tr>
                    <td><strong>${a}</strong></td>
                    <td>${formatoMoneda(anioVentas[a])}</td>
                    <td>${formatoMoneda(anioGastos[a])}</td>
                    <td style="color:${colorGanancia(gan)}; font-weight:bold;">${formatoMoneda(gan)}</td>
                </tr>
            `;
        }).join('');
    }
}

