/* --- SOCIOS --- */
function agregarSocio() {
    const nombre = document.getElementById('socio-nombre').value;
    if(!nombre) return alert('Ingresa el nombre del socio');

    DB.socios.push({ id: Date.now(), nombre, asistencia: [], notas: '', gastos: [] });
    guardarDB();
    document.getElementById('socio-nombre').value = '';
}

let sociosAbiertos = {};
let asistenciaAbierta = {};

function escHtml(t) {
    return String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// "2026-11-24" -> "24/11/2026"
function fechaLegible(iso) {
    const p = String(iso || '').split('-');
    return p.length === 3 ? `${+p[2]}/${+p[1]}/${p[0]}` : (iso || '');
}

// "24/11/2026" (asistencia) -> "2026-11-24"
function fechaCortaAIso(f) {
    const p = String(f || '').split('/');
    if (p.length !== 3) return '';
    return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
}

// "2026-11-24" -> formato corto local igual a toLocaleDateString('es-CO')
function isoAFechaAsistencia(iso) {
    const p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO');
}

function renderSocios() {
    const div = document.getElementById('lista-socios');
    div.innerHTML = '';

    const hoy = new Date().toLocaleDateString('es-CO');
    const hoyIso = claveDia(new Date());
    const mesActual = hoyIso.slice(0, 7);

    DB.socios.forEach(s => {
        const listaAsis = Array.isArray(s.asistencia) ? s.asistencia : [];
        const marcoHoy = listaAsis.includes(hoy);
        const notasTexto = s.notas || '';

        const asisOrdenada = [...listaAsis].sort((a, b) => fechaCortaAIso(b).localeCompare(fechaCortaAIso(a)));
        const asisAbierta = !!asistenciaAbierta[s.id];

        const filasAsis = asisOrdenada.length ? asisOrdenada.map(f => `
            <tr>
                <td>${escHtml(f)}${f === hoy ? ' <span class="tag-historica">Hoy</span>' : ''}</td>
                <td style="text-align:right;">
                    <button class="btn btn-danger" style="width:auto; padding:4px 8px; margin-bottom:0;" onclick="eliminarAsistenciaFecha(${s.id}, '${escHtml(f)}')">🗑️</button>
                </td>
            </tr>`).join('')
            : '<tr><td colspan="2" style="text-align:center; color:var(--text-secondary);">Sin asistencias registradas.</td></tr>';

        const gastos = [...(s.gastos || [])].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || (b.id - a.id));
        const total = gastos.reduce((t, g) => t + (g.monto || 0), 0);
        const totalMes = gastos.filter(g => String(g.fecha).slice(0, 7) === mesActual).reduce((t, g) => t + (g.monto || 0), 0);
        const abierto = !!sociosAbiertos[s.id];

        const filas = gastos.length ? gastos.map(g => `
            <tr>
                <td style="font-size:0.75rem;">${fechaLegible(g.fecha)}</td>
                <td>${escHtml(g.tipo)}</td>
                <td><strong>${formatoMoneda(g.monto)}</strong></td>
                <td style="font-size:0.75rem;">${escHtml(g.nota)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-warning" onclick="abrirEditarGastoSocio(${s.id}, ${g.id})">✏️</button>
                        <button class="btn btn-danger" onclick="eliminarGastoSocio(${s.id}, ${g.id})">🗑️</button>
                    </div>
                </td>
            </tr>`).join('')
            : '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">Sin anotaciones.</td></tr>';

        div.innerHTML += `
            <div class="card">
                <div class="socio-header">
                    <h3>${s.nombre}</h3>
                    <button class="btn btn-danger" style="width:auto; padding:3px 8px;" onclick="eliminarSocio(${s.id})">X</button>
                </div>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:10px;">
                    Días Asistidos: <strong>${listaAsis.length}</strong>
                </p>
                <button class="btn ${marcoHoy ? 'btn-danger' : ''}" onclick="marcarAsistencia(${s.id}, '${hoy}')">
                    ${marcoHoy ? 'Desmarcar Asistencia de Hoy' : 'Marcar Asistencia Hoy (' + hoy + ')'}
                </button>

                <div style="margin-top:10px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary);">Agregar asistencia por fecha específica:</label>
                    <div class="btn-group" style="margin-top:5px;">
                        <input type="date" id="asis-fecha-${s.id}" value="${hoyIso}" style="margin-bottom:0;">
                        <button class="btn btn-accent" style="width:auto; white-space:nowrap;" onclick="agregarAsistenciaFecha(${s.id})">Agregar fecha</button>
                    </div>

                    <div class="collapsible-header" onclick="toggleHistorialAsistencia(${s.id})" style="margin-top:8px;">
                        <span style="font-size:0.85rem; color:var(--primary); font-weight:bold;">Ver fechas asistidas (${listaAsis.length})</span>
                        <span id="asis-icono-${s.id}" style="color:var(--primary); font-weight:bold;">${asisAbierta ? '▲' : '▼'}</span>
                    </div>
                    <div id="asis-panel-${s.id}" class="collapsible-content" style="display:${asisAbierta ? 'block' : 'none'}; margin-top:8px;">
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr><th>Fecha</th><th style="text-align:right;">Quitar</th></tr>
                                </thead>
                                <tbody>${filasAsis}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top:15px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary);">Notas / Observaciones:</label>
                    <textarea id="notas-socio-${s.id}" placeholder="Escribe notas sobre este socio...">${notasTexto}</textarea>
                    <button class="btn btn-accent" style="padding:6px; font-size:0.85rem;" onclick="guardarNotaSocio(${s.id})">Guardar Nota</button>
                </div>

                <div style="margin-top:15px; border-top:1px solid var(--border-color); padding-top:12px;">
                    <label style="font-size:0.8rem; color:var(--text-secondary);">Parqueadero / Otro transporte (solo se suma, NO cambia la caja):</label>
                    <select id="sg-tipo-${s.id}" style="margin-top:6px;">
                        <option value="Parqueadero">Parqueadero</option>
                        <option value="Otro transporte">Otro transporte</option>
                    </select>
                    <input type="number" id="sg-monto-${s.id}" placeholder="Monto ($)">
                    <input type="date" id="sg-fecha-${s.id}" value="${hoyIso}">
                    <input type="text" id="sg-nota-${s.id}" placeholder="Nota (opcional)">
                    <button class="btn btn-accent" onclick="anotarGastoSocio(${s.id})">Anotar gasto</button>

                    <div class="collapsible-header" onclick="toggleGastosSocio(${s.id})" style="margin-top:6px;">
                        <h3 style="font-size:0.95rem; margin-bottom:0;">Registro de gastos (${gastos.length}) · ${formatoMoneda(total)}</h3>
                        <span id="gs-icono-${s.id}" style="color:var(--primary); font-weight:bold;">${abierto ? '▲' : '▼'}</span>
                    </div>
                    <div id="gs-panel-${s.id}" class="collapsible-content" style="display:${abierto ? 'block' : 'none'};">
                        <p class="hint-text" style="margin-top:0;">Este mes: <strong>${formatoMoneda(totalMes)}</strong> · Total: <strong>${formatoMoneda(total)}</strong></p>
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Nota</th><th>Acción</th></tr>
                                </thead>
                                <tbody>${filas}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function toggleHistorialAsistencia(id) {
    asistenciaAbierta[id] = !asistenciaAbierta[id];
    document.getElementById('asis-panel-' + id).style.display = asistenciaAbierta[id] ? 'block' : 'none';
    document.getElementById('asis-icono-' + id).innerText = asistenciaAbierta[id] ? '▲' : '▼';
}

function agregarAsistenciaFecha(id) {
    const socio = DB.socios.find(s => s.id === id);
    if (!socio) return;
    const input = document.getElementById('asis-fecha-' + id);
    if (!input || !input.value) return alert('Selecciona una fecha');

    const fechaFormateada = isoAFechaAsistencia(input.value);
    if (!fechaFormateada) return alert('Fecha no válida');

    if (!socio.asistencia) socio.asistencia = [];
    // Evitar duplicados comparando tanto el texto exacto como la fecha ISO normalizada
    const isoNueva = input.value;
    const yaExiste = socio.asistencia.some(f => f === fechaFormateada || fechaCortaAIso(f) === isoNueva);
    if (yaExiste) {
        return alert(`La asistencia del ${fechaFormateada} ya estaba registrada para ${socio.nombre}`);
    }

    socio.asistencia.push(fechaFormateada);
    asistenciaAbierta[id] = true;
    guardarDB();
}

function eliminarAsistenciaFecha(id, fecha) {
    const socio = DB.socios.find(s => s.id === id);
    if (!socio || !socio.asistencia) return;
    if (!confirm(`¿Quitar la asistencia del ${fecha}?`)) return;
    socio.asistencia = socio.asistencia.filter(f => f !== fecha);
    guardarDB();
}

/* --- GASTOS DE PARQUEADERO / TRANSPORTE POR SOCIO (no tocan la caja) --- */
function toggleGastosSocio(id) {
    sociosAbiertos[id] = !sociosAbiertos[id];
    document.getElementById('gs-panel-' + id).style.display = sociosAbiertos[id] ? 'block' : 'none';
    document.getElementById('gs-icono-' + id).innerText = sociosAbiertos[id] ? '▲' : '▼';
}

function anotarGastoSocio(id) {
    const socio = DB.socios.find(s => s.id === id);
    if (!socio) return;
    const tipo = document.getElementById('sg-tipo-' + id).value;
    const monto = parseFloat(document.getElementById('sg-monto-' + id).value);
    const fecha = document.getElementById('sg-fecha-' + id).value || claveDia(new Date());
    const nota = document.getElementById('sg-nota-' + id).value.trim();

    if (isNaN(monto) || monto <= 0) return alert('Ingresa un monto mayor a 0');

    if (!socio.gastos) socio.gastos = [];
    socio.gastos.push({ id: Date.now(), tipo, monto, fecha, nota });
    sociosAbiertos[id] = true;
    guardarDB();
}

function eliminarGastoSocio(socioId, gastoId) {
    const socio = DB.socios.find(s => s.id === socioId);
    if (!socio) return;
    if (!confirm('¿Borrar esta anotación?')) return;
    socio.gastos = (socio.gastos || []).filter(g => g.id !== gastoId);
    guardarDB();
}

function abrirEditarGastoSocio(socioId, gastoId) {
    const socio = DB.socios.find(s => s.id === socioId);
    const g = socio && (socio.gastos || []).find(x => x.id === gastoId);
    if (!g) return;
    document.getElementById('eg-socio-id').value = socioId;
    document.getElementById('eg-id').value = gastoId;
    document.getElementById('eg-tipo').value = g.tipo;
    document.getElementById('eg-monto').value = g.monto;
    document.getElementById('eg-fecha').value = g.fecha;
    document.getElementById('eg-nota').value = g.nota || '';
    document.getElementById('modal-editar-gastosocio').style.display = 'flex';
}

function cerrarEditarGastoSocio() {
    document.getElementById('modal-editar-gastosocio').style.display = 'none';
}

function guardarEditarGastoSocio() {
    const socio = DB.socios.find(s => s.id === parseInt(document.getElementById('eg-socio-id').value));
    const g = socio && (socio.gastos || []).find(x => x.id === parseInt(document.getElementById('eg-id').value));
    if (!g) return;
    const monto = parseFloat(document.getElementById('eg-monto').value);
    if (isNaN(monto) || monto <= 0) return alert('Ingresa un monto mayor a 0');

    g.tipo = document.getElementById('eg-tipo').value;
    g.monto = monto;
    g.fecha = document.getElementById('eg-fecha').value || g.fecha;
    g.nota = document.getElementById('eg-nota').value.trim();
    guardarDB();
    cerrarEditarGastoSocio();
}

function eliminarSocio(id) {
    if(confirm('¿Eliminar este socio?')) {
        DB.socios = DB.socios.filter(s => s.id !== id);
        guardarDB();
    }
}

function marcarAsistencia(id, fecha) {
    const socio = DB.socios.find(s => s.id === id);
    if(!socio) return;

    if(!socio.asistencia) socio.asistencia = [];

    const index = socio.asistencia.indexOf(fecha);
    if(index > -1) {
        socio.asistencia.splice(index, 1);
    } else {
        socio.asistencia.push(fecha);
    }

    guardarDB();
}

function guardarNotaSocio(id) {
    const socio = DB.socios.find(s => s.id === id);
    if(!socio) return;

    const textarea = document.getElementById(`notas-socio-${id}`);
    if(textarea) {
        socio.notas = textarea.value;
        guardarDB();
        alert(`Nota guardada para ${socio.nombre}`);
    }
}

