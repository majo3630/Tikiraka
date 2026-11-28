// Permite instalar la app (necesita HTTPS)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Inicializar el campo de fecha de operación al cargar la página
inicializarFechaOperacion();
