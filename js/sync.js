// Conectar eventos en tiempo real para múltiples dispositivos
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Escuchador en tiempo real ultrasincronizado
        db.ref('tikiraka_app').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                DB.inventario = data.inventario ? Object.values(data.inventario) : [];
                DB.caja = data.caja || { efectivo: 0, nequi: 0 };
                DB.historialBase = data.historialBase ? Object.values(data.historialBase) : [];
                DB.ventas = data.ventas ? Object.values(data.ventas) : [];
                DB.gastos = data.gastos ? Object.values(data.gastos) : [];
                DB.ventasDia = data.ventasDia ? Object.values(data.ventasDia) : [];
                DB.config = data.config || {};
                
                if (data.socios) {
                    DB.socios = Object.values(data.socios).map(s => ({
                        ...s,
                        notas: s.notas || '',
                        asistencia: s.asistencia ? (Array.isArray(s.asistencia) ? s.asistencia : Object.values(s.asistencia)) : [],
                        gastos: s.gastos ? (Array.isArray(s.gastos) ? s.gastos : Object.values(s.gastos)) : []
                    }));
                } else {
                    DB.socios = [];
                }
            } else {
                DB = { inventario: [], caja: { efectivo: 0, nequi: 0 }, historialBase: [], ventas: [], gastos: [], socios: [], ventasDia: [], config: {} };
            }
            dbCargada = true;
            actualizarUI();
        });
    }
});

// Guardado optimizado e inmediato
function guardarDB() {
    db.ref('tikiraka_app').set(DB);
    programarEnvioSheets();
}

