// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyA84D05AYtM7TTHFxPTT-_b3LojUqYMP08",
    authDomain: "tikiraka-app.firebaseapp.com",
    databaseURL: "https://tikiraka-app-default-rtdb.firebaseio.com",
    projectId: "tikiraka-app",
    storageBucket: "tikiraka-app.firebasestorage.app",
    messagingSenderId: "922023852175",
    appId: "1:922023852175:web:8bf69529b5da453b9658fa",
    measurementId: "G-K5JWMWHL7Y"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// AUTENTICACIÓN ANÓNIMA SEGURA
firebase.auth().signInAnonymously().catch((error) => {
    console.error("Error al autenticar de forma segura:", error);
});

