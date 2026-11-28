function cambiarTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
    if(tabId === 'tab-graficas') {
        cargarFiltroMeses();
        renderizarGraficas();
    }
    if(tabId === 'tab-anual') {
        cargarFiltroAnios();
        renderizarAnual();
    }
    if(tabId === 'tab-caja') {
        inicializarFechaOperacion();
    }
}

function toggleBasePanel() {
    const content = document.getElementById('base-collapsible-content');
    const icon = document.getElementById('base-toggle-icon');
    if (content.style.display === 'block') {
        content.style.display = 'none';
        icon.innerText = '▼';
    } else {
        content.style.display = 'block';
        icon.innerText = '▲';
    }
}

function actualizarUI() {
    renderInventario();
    renderCaja();
    renderHistorialBase();
    cargarFiltroMeses();
    cargarHistorial();
    renderSocios();
    cargarFiltroAnios();
    if (document.getElementById('tab-anual').classList.contains('active')) renderizarAnual();
    renderVentasDia();
    revisarCierreDia();
    revisarEnvioSheets();
    renderConfigSheets();
}

