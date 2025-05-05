// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCWyl1sZwwOhvRNJ1BL6xgy6iwRn4RY7uo",
    authDomain: "marian-17c4a.firebaseapp.com",
    projectId: "marian-17c4a",
    storageBucket: "marian-17c4a.appspot.com",
    messagingSenderId: "1095970320522",
    appId: "1:1095970320522:web:049cbc624775093287bd73",
    measurementId: "G-8JZCTHJXZQ"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Función para mostrar mensajes
function showMessage(type, message) {
    // Eliminar mensajes anteriores
    const oldAlerts = document.querySelectorAll('.alert');
    oldAlerts.forEach(alert => alert.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
    messageDiv.role = 'alert';
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const forms = document.querySelectorAll('.tab-pane.active form');
    if (forms.length > 0) {
        forms[0].prepend(messageDiv);
    }
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => messageDiv.remove(), 150);
    }, 5000);
}

// Función para obtener nombre legible del proveedor
function providerName(method) {
    const providers = {
        'google.com': 'Google',
        'facebook.com': 'Facebook',
        'password': 'email y contraseña'
    };
    return providers[method] || method;
}

// Función para manejar el error de cuenta existente
async function handleAccountExistsError(email, currentProvider) {
    try {
        // Obtener los métodos de autenticación del email
        const methods = await auth.fetchSignInMethodsForEmail(email);
        
        if (methods.length === 0) {
            showMessage('danger', 'No se encontraron métodos de autenticación para este email.');
            return;
        }
        
        // Mostrar mensaje según los métodos disponibles
        const primaryMethod = methods[0];
        showMessage('info', `Este email ya está registrado. Por favor inicia sesión con ${providerName(primaryMethod)}.`);
        
    } catch (error) {
        console.error("Error al manejar cuenta existente:", error);
        showMessage('danger', 'Error al verificar métodos de autenticación.');
    }
}

// Función mejorada para autenticación con proveedores
async function signInWithProvider(provider) {
    const button = event.target;
    const originalText = button.innerHTML;
    
    try {
        // Mostrar spinner
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
        button.disabled = true;
        
        // Intentar autenticación
        const result = await auth.signInWithPopup(provider);
        
        // Redirigir después de autenticar
        window.location.href = 'hotel2.html';
        
    } catch (error) {
        console.error("Error en autenticación:", error);
        
        // Manejar error de cuenta existente
        if (error.code === 'auth/account-exists-with-different-credential') {
            const email = error.email;
            await handleAccountExistsError(email, provider.providerId);
        } 
        // Manejar otros errores comunes
        else if (error.code === 'auth/popup-closed-by-user') {
            showMessage('warning', 'La ventana de autenticación fue cerrada. Por favor intenta nuevamente.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            // No mostrar mensaje para este caso
        } else {
            showMessage('danger', `Error al iniciar sesión: ${error.message}`);
        }
        
        // Restaurar botón
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Configurar proveedores
const googleProvider = new firebase.auth.GoogleAuthProvider();
const facebookProvider = new firebase.auth.FacebookAuthProvider();
facebookProvider.addScope('email');

// Función para configurar botones de proveedores
function setupProviderButtons() {
    const setupButton = (id, provider) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                signInWithProvider(provider);
            });
        }
    };
    
    // Configurar botones de login
    setupButton('googleLogin', googleProvider);
    setupButton('facebookLogin', facebookProvider);
    
    // Configurar botones de registro (usamos mismos proveedores)
    setupButton('googleRegister', googleProvider);
    setupButton('facebookRegister', facebookProvider);
}

// Registrar nuevo usuario (email/password)
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.querySelector('.btn-register');
    const originalText = registerBtn.innerHTML;
    
    // Validaciones
    if (password !== confirmPassword) {
        showMessage('danger', 'Las contraseñas no coinciden.');
        return;
    }
    
    if (!document.getElementById('termsAgree').checked) {
        showMessage('danger', 'Debes aceptar los términos y condiciones.');
        return;
    }
    
    try {
        // Mostrar spinner
        registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';
        registerBtn.disabled = true;
        
        // Crear usuario
        await auth.createUserWithEmailAndPassword(email, password);
        
        showMessage('success', 'Registro exitoso. Redirigiendo...');
        
        // Redirigir después de registrar
        setTimeout(() => {
            window.location.href = 'hotel2.html';
        }, 1500);
        
    } catch (error) {
        console.error("Error en registro:", error);
        let errorMessage = "Error al registrar. Por favor intenta nuevamente.";
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo electrónico ya está registrado.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El correo electrónico no es válido.';
        }
        
        showMessage('danger', errorMessage);
        
        // Restaurar botón
        registerBtn.innerHTML = originalText;
        registerBtn.disabled = false;
    }
});

// Iniciar sesión (email/password)
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.querySelector('.btn-login');
    const originalText = loginBtn.innerHTML;
    
    try {
        // Mostrar spinner
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';
        loginBtn.disabled = true;
        
        await auth.signInWithEmailAndPassword(email, password);
        
        showMessage('success', 'Inicio de sesión exitoso. Redirigiendo...');
        
        // Redirigir después de autenticar
        setTimeout(() => {
            window.location.href = 'hotel2.html';
        }, 1000);
        
    } catch (error) {
        console.error("Error en inicio de sesión:", error);
        let errorMessage = "Error al iniciar sesión. Por favor verifica tus credenciales.";
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No existe una cuenta con este correo electrónico.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. La cuenta ha sido temporalmente bloqueada.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del email no es válido.';
        }
        
        showMessage('danger', errorMessage);
        
        // Restaurar botón
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Configurar botones de proveedores
    setupProviderButtons();
    
    // Cerrar sesión previa al cargar la página
    auth.signOut().catch(err => console.error("Error al cerrar sesión:", err));
    
    // Verificar si el usuario viene de un logout
    const urlParams = new URLSearchParams(window.location.search);
    const isLogout = urlParams.get('logout');
    
    if (isLogout === 'true') {
        // Limpiar cualquier sesión persistente
        auth.signOut().then(() => {
            console.log("Sesión cerrada completamente");
            
            // Limpiar cookies de sesión de Google
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // Informar al usuario
            showMessage('success', 'Ha cerrado sesión correctamente. Puede iniciar sesión con otra cuenta.');
        });
    }
    
    // Prevenir envío de formularios al presionar Enter
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    });
});