// Firebase configuration solo para autenticación
const firebaseConfig = {
    apiKey: "AIzaSyCWyl1sZwwOhvRNJ1BL6xgy6iwRn4RY7uo",
    authDomain: "marian-17c4a.firebaseapp.com",
    projectId: "marian-17c4a",
    storageBucket: "marian-17c4a.appspot.com",
    messagingSenderId: "1095970320522",
    appId: "1:1095970320522:web:049cbc624775093287bd73",
    measurementId: "G-8JZCTHJXZQ"
};
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const reservationsCollection = db.collection('reservaciones');

// Inicializar EmailJS y añadir función para enviar correos
emailjs.init("3yQHN4FoplatW6uiE");
async function sendReservationEmail(reservation) {
    const templateParams = {
        reservationId: reservation.id,
        roomType: reservation.tipoDeHabitacion,
        checkin: formatDate(reservation.checkin),
        checkout: formatDate(reservation.checkout),
        price: reservation.precioTotal,
        email: reservation.email,
        randomText: Math.random().toString(36).substring(7)
    };
    try {
        const response = await emailjs.send(
            "service_cyt25xu",  // Service ID
            "template_f9nbzsy",  // Template ID
            templateParams,
            "3yQHN4FoplatW6uiE"  // Public Key (como string, no como objeto)
        );
        console.log("✅ Correo enviado", response);
        return true;
    } catch (error) {
        console.error("❌ Error al enviar correo:", {
            status: error.status,
            text: error.text,
            fullError: error
        });
        return false;
    }
}

// Función para generar un ID único
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
  
// Calcular el precio total basado en el tipo de habitación y duración de la estancia
function calculateTotalPrice(tipoDeHabitacion, noches) {
    // Actualizados para coincidir con los precios en el HTML
    const pricePerNight = {
        'El Primer Secreto': 700,
        'La Alcoba de los Espejos': 1400,
        'Los Reinos Privados': 2700,
        'Las Moradas de los Dioses': 4000
    };
    
    return pricePerNight[tipoDeHabitacion] * noches;
}
  
// Calcular el número de noches entre dos fechas
function calculateNights(checkin, checkout) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}
  
// Formatear fecha para mostrar en formato legible
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Funciones para manejar los testimonios con localStorage
const testimoniosManager = {
    // Guardar un testimonio
    saveTestimonio: function(testimonio) {
        // Generar un ID único para el testimonio
        testimonio.id = generateId();
        
        // Obtener testimonios existentes
        const testimonios = this.getTestimonios();
        
        // Añadir nuevo testimonio
        testimonios.push(testimonio);
        
        // Guardar en localStorage
        localStorage.setItem('testimonios', JSON.stringify(testimonios));
        
        return testimonio.id;
    },
    
    // Obtener todos los testimonios
    getTestimonios: function() {
        const testimoniosStr = localStorage.getItem('testimonios');
        return testimoniosStr ? JSON.parse(testimoniosStr) : [];
    },
    
    // Obtener testimonios ordenados por fecha (más recientes primero)
    getRecentTestimonios: function(limit = 6) {
        const testimonios = this.getTestimonios();
        
        // Ordenar por fecha (más recientes primero)
        return testimonios
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
};
  
// Formulario de reserva
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Inicializando formularios");
    
    // Obtener referencias a los elementos del DOM
    const reservationForm = document.getElementById('reservationForm');
    const manageReservationForm = document.getElementById('manageReservationForm');
    const reservationDetails = document.getElementById('reservationDetails');
    const reservationInfo = document.getElementById('reservationInfo');
    const cancelReservationBtn = document.getElementById('cancelReservation');
    const ratingForm = document.getElementById('ratingForm');
    const testimonialsContainer = document.getElementById('testimonials-container');
    
    // Inicializar sistema de calificación con estrellas
    initRatingSystem();
    
    // Cargar testimonios existentes
    loadTestimonials();
    
    // Realizar verificaciones de los elementos
    if (!reservationForm) console.log("Advertencia: Formulario de reserva no encontrado");
    if (!manageReservationForm) console.log("Advertencia: Formulario de gestión no encontrado");
    if (!reservationDetails) console.log("Advertencia: Detalles de reserva no encontrados");
    if (!cancelReservationBtn) console.log("Advertencia: Botón de cancelación no encontrado");
    if (!ratingForm) console.log("Advertencia: Formulario de calificación no encontrado");
    if (!testimonialsContainer) console.log("Advertencia: Contenedor de testimonios no encontrado");
    
    // Establecer fechas mínimas en los inputs de fecha
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    
    if (checkinInput && checkoutInput) {
        const today = new Date().toISOString().split('T')[0];
        checkinInput.min = today;
        checkoutInput.min = today;
        
        // Actualizar fecha mínima de checkout cuando cambia checkin
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            const nextDay = checkinDate.toISOString().split('T')[0];
            checkoutInput.min = nextDay;
            
            // Si checkout es menor que el nuevo mínimo, actualizar checkout
            if (checkoutInput.value < nextDay) {
                checkoutInput.value = nextDay;
            }
        });
    }
    
    // Manejar envío del formulario de reserva
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulario enviado - Procesando reserva");
            
            // Recoger datos del formulario
            const checkin = document.getElementById('checkin').value;
            const checkout = document.getElementById('checkout').value;
            const roomTypeSelect = document.getElementById('roomType');
            const tipoDeHabitacion = roomTypeSelect.options[roomTypeSelect.selectedIndex].text;
            const huespedes = document.getElementById('guests').value;
            const email = document.getElementById('email').value;
            
            console.log("Datos del formulario:", { checkin, checkout, tipoDeHabitacion, huespedes, email });
            
            // Validaciones básicas
            if (!checkin || !checkout || !tipoDeHabitacion || !huespedes || !email) {
                alert('Por favor, complete todos los campos');
                return;
            }
            
            // Calcular duración y precio
            const noches = calculateNights(checkin, checkout);
            const precioTotal = calculateTotalPrice(tipoDeHabitacion, noches);
            
            console.log("Cálculos:", { noches, precioTotal });
            
            // Generar ID de reserva
            const reservationId = generateId();
            console.log("ID de reserva generado:", reservationId);
            
            // Crear objeto de reserva
            const reservation = {
                id: reservationId,
                checkin: checkin,
                checkout: checkout,
                tipoDeHabitacion: tipoDeHabitacion,
                huespedes: parseInt(huespedes),
                email: email,
                noches: noches,
                precioTotal: precioTotal,
                status: 'confirmado',
                creado: new Date().toISOString()
            };
            
            console.log("Objeto de reserva:", reservation);
            
            // Usar una referencia directa para guardar en Firebase
            db.collection('reservaciones').doc(reservationId).set(reservation)
                .then(() => {
                    console.log("✅ Reserva guardada exitosamente con ID:", reservationId);
                    
                    // Enviar correo de confirmación
                    sendReservationEmail(reservation)
                        .then(emailSent => {
                            if (!emailSent) {
                                console.warn("No se pudo enviar el correo de confirmación");
                            }
                        });
                        
                    // Mostrar confirmación
                    showReservationConfirmation(reservation);
                    reservationForm.reset();
                })
                .catch(error => {
                    console.error("❌ Error al guardar la reserva:", error);
                    alert('Ha ocurrido un error al procesar su reserva: ' + error.message);
                });
        });
    }
    
    // Manejar búsqueda de reserva
    if (manageReservationForm) {
        manageReservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Buscando reserva");
            
            const reservationId = document.getElementById('reservationId').value.trim().toUpperCase();
            
            if (!reservationId) {
                alert('Por favor, ingrese un ID de reserva válido');
                return;
            }
            
            console.log("Buscando reserva con ID:", reservationId);
            
            // Buscar la reserva en Firebase
            db.collection('reservaciones').doc(reservationId).get()
                .then(doc => {
                    if (doc.exists && doc.data().status === 'confirmado') {
                        console.log("Reserva encontrada:", doc.data());
                        // Mostrar detalles de la reserva
                        displayReservationDetails(doc.data());
                        reservationDetails.style.display = 'block';
                    } else {
                        console.log("Reserva no encontrada o cancelada");
                        alert('No se encontró una reserva activa con ese ID. Por favor, verifique e intente nuevamente.');
                        reservationDetails.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error("Error al buscar la reserva:", error);
                    alert('Ha ocurrido un error al buscar su reserva: ' + error.message);
                });
        });
    }
    
    // Manejar cancelación de reserva
    if (cancelReservationBtn) {
        cancelReservationBtn.addEventListener('click', function() {
            const reservationId = document.getElementById('reservationId').value;
            console.log("Intentando cancelar reserva:", reservationId);
            
            if (confirm('¿Está seguro que desea cancelar esta reserva? Esta acción no se puede deshacer.')) {
                // Actualizar estado en Firebase
                db.collection('reservaciones').doc(reservationId).update({
                    status: 'cancelado',
                    cancelado: new Date().toISOString()
                })
                .then(() => {
                    console.log("Reserva cancelada exitosamente");
                    alert('Su reserva ha sido cancelada con éxito.');
                    reservationDetails.style.display = 'none';
                    document.getElementById('reservationId').value = '';
                })
                .catch(error => {
                    console.error("Error al cancelar la reserva:", error);
                    alert('Ha ocurrido un error al cancelar su reserva: ' + error.message);
                });
            }
        });
    }
    
    // Manejar envío del formulario de calificación
    if (ratingForm) {
        ratingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulario de calificación enviado");
            
            // Recoger datos del formulario
            const name = document.getElementById('ratingName').value;
            const location = document.getElementById('ratingLocation').value;
            const rating = parseInt(document.getElementById('ratingValue').value);
            const comment = document.getElementById('ratingComment').value;
            
            // Validaciones
            if (!name || !location || rating === 0 || !comment) {
                alert('Por favor, complete todos los campos y seleccione una calificación');
                return;
            }
            
            // Crear objeto de testimonio
            const testimonial = {
                name: name,
                location: location,
                rating: rating,
                comment: comment,
                date: new Date().toISOString()
            };
            
            console.log("Enviando testimonio:", testimonial);
            
            try {
                // Guardar el testimonio usando localStorage
                const testimonioId = testimoniosManager.saveTestimonio(testimonial);
                console.log("✅ Testimonio guardado exitosamente con ID:", testimonioId);
                
                alert('¡Gracias por compartir su opinión!');
                ratingForm.reset();
                document.getElementById('ratingValue').value = '0';
                resetStars();
                
                // Recargar testimonios
                loadTestimonials();
            } catch (error) {
                console.error("❌ Error al guardar el testimonio:", error);
                alert('Ha ocurrido un error al enviar su opinión. Por favor, intente nuevamente.');
            }
        });
    }
    
    // Función para mostrar los detalles de la reserva
    function displayReservationDetails(reservation) {
        // Ya no necesitamos la conversión porque guardamos directamente los nombres completos
        const html = `
            <div class="mb-3">
                <p><strong>ID de Reserva:</strong> ${reservation.id}</p>
                <p><strong>Tipo de Habitación:</strong> ${reservation.tipoDeHabitacion}</p>
                <p><strong>Fecha de Llegada:</strong> ${formatDate(reservation.checkin)}</p>
                <p><strong>Fecha de Salida:</strong> ${formatDate(reservation.checkout)}</p>
                <p><strong>Número de Noches:</strong> ${reservation.noches}</p>
                <p><strong>Huéspedes:</strong> ${reservation.huespedes}</p>
                <p><strong>Precio Total:</strong> $${reservation.precioTotal}</p>
                <p><strong>Email:</strong> ${reservation.email}</p>
            </div>
        `;
        
        reservationInfo.innerHTML = html;
    }
    
    // Función para mostrar confirmación de nueva reserva
    function showReservationConfirmation(reservation) {
        console.log("Mostrando confirmación para reserva:", reservation);
        
        try {
            // Crear modal de confirmación
            const modalHtml = `
                <div class="modal fade" id="confirmationModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">¡RESERVA CONFIRMADA!</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p class="mb-4">Su reserva ha sido confirmada exitosamente. Por favor, guarde el siguiente ID de reserva:</p>
                                <div class="alert bg-light text-center fw-bold fs-4 mb-4">${reservation.id}</div>
                                
                                <h6>Detalles de la reserva:</h6>
                                <ul class="list-group mb-3">
                                    <li class="list-group-item"><strong>Habitación:</strong> ${reservation.tipoDeHabitacion}</li>
                                    <li class="list-group-item"><strong>Llegada:</strong> ${formatDate(reservation.checkin)}</li>
                                    <li class="list-group-item"><strong>Salida:</strong> ${formatDate(reservation.checkout)}</li>
                                    <li class="list-group-item"><strong>Noches:</strong> ${reservation.noches}</li>
                                    <li class="list-group-item"><strong>Huéspedes:</strong> ${reservation.huespedes}</li>
                                    <li class="list-group-item"><strong>Precio Total:</strong> $${reservation.precioTotal}</li>
                                </ul>
                                
                                <p class="small text-muted">Hemos enviado un correo electrónico con los detalles de su reserva a ${reservation.email}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-reserva" data-bs-dismiss="modal">ACEPTAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar modal al documento
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);
            
            // Verificar si bootstrap está disponible
            if (typeof bootstrap !== 'undefined') {
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
                modal.show();
                
                // Eliminar modal del DOM después de cerrar
                document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', function() {
                    document.body.removeChild(modalContainer);
                });
            } else {
                console.error("Bootstrap no está disponible, mostrando alerta simple");
                alert(`Reserva confirmada! Su ID es: ${reservation.id}\nGuarde este código para futuras consultas.`);
            }
        } catch (error) {
            console.error("Error al mostrar el modal:", error);
            alert(`Reserva confirmada! Su ID es: ${reservation.id}\nGuarde este código para futuras consultas.`);
        }
    }
  
    // Inicializar sistema de calificación con estrellas
    function initRatingSystem() {
        const stars = document.querySelectorAll('.star-rating');
        const ratingInput = document.getElementById('ratingValue');
        
        if (!stars.length || !ratingInput) {
            console.log("Sistema de calificación no encontrado");
            return;
        }
        
        stars.forEach(star => {
            // Hover
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                highlightStars(rating);
            });
            
            // Mouseout
            star.addEventListener('mouseout', function() {
                const currentRating = parseInt(ratingInput.value);
                highlightStars(currentRating);
            });
            
            // Click
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                ratingInput.value = rating;
                highlightStars(rating);
            });
        });
        
        // Función para destacar estrellas
        function highlightStars(rating) {
            stars.forEach(star => {
                const starRating = parseInt(star.getAttribute('data-rating'));
                if (starRating <= rating) {
                    star.classList.remove('far');
                    star.classList.add('fas');
                } else {
                    star.classList.remove('fas');
                    star.classList.add('far');
                }
            });
        }
    }
    
    // Función para resetear las estrellas
    function resetStars() {
        const stars = document.querySelectorAll('.star-rating');
        stars.forEach(star => {
            star.classList.remove('fas');
            star.classList.add('far');
        });
    }
    
    // Función para cargar testimonios desde localStorage
    function loadTestimonials() {
        const testimonialsContainer = document.getElementById('testimonials-container');
        
        if (!testimonialsContainer) {
            console.log("Contenedor de testimonios no encontrado");
            return;
        }
        
        // Limpiar contenedor
        testimonialsContainer.innerHTML = '';
        
        try {
            // Obtener testimonios recientes
            const testimonios = testimoniosManager.getRecentTestimonios(6);
            
            if (testimonios.length === 0) {
                console.log("No hay testimonios disponibles");
                
                // Mostrar algunos testimonios de ejemplo si no hay reales
                const defaultTestimonials = [
                    {
                        name: "Carlos Méndez",
                        location: "Madrid, España",
                        rating: 5,
                        comment: "Una experiencia inolvidable. Las vistas desde nuestra habitación eran espectaculares, y el personal nos hizo sentir como en casa desde el primer momento."
                    },
                    {
                        name: "Ana García",
                        location: "Buenos Aires, Argentina",
                        rating: 4,
                        comment: "El restaurante ofrece una experiencia gastronómica excepcional. Los platos son obras de arte y el servicio es impecable. Definitivamente regresaremos."
                    },
                    {
                        name: "Sophie Bernard",
                        location: "París, Francia",
                        rating: 5,
                        comment: "Nuestra villa con piscina privada fue el escenario perfecto para nuestra luna de miel. La atención personalizada superó nuestras expectativas."
                    }
                ];
                
                // Renderizar testimonios por defecto
                defaultTestimonials.forEach(testimonial => {
                    appendTestimonial(testimonial);
                });
                
                return;
            }
            
            console.log(`Testimonios encontrados: ${testimonios.length}`);
            
            // Renderizar testimonios
            testimonios.forEach(testimonial => {
                appendTestimonial(testimonial);
            });
        } catch (error) {
            console.error("Error al cargar testimonios:", error);
            
            // Mostrar testimonios por defecto en caso de error
            const defaultTestimonials = [
                {
                    name: "Carlos Méndez",
                    location: "Madrid, España",
                    rating: 5,
                    comment: "Una experiencia inolvidable. Las vistas desde nuestra habitación eran espectaculares, y el personal nos hizo sentir como en casa desde el primer momento."
                },
                {
                    name: "Ana García",
                    location: "Buenos Aires, Argentina",
                    rating: 4,
                    comment: "El restaurante ofrece una experiencia gastronómica excepcional. Los platos son obras de arte y el servicio es impecable. Definitivamente regresaremos."
                },
                {
                    name: "Sophie Bernard",
                    location: "París, Francia",
                    rating: 5,
                    comment: "Nuestra villa con piscina privada fue el escenario perfecto para nuestra luna de miel. La atención personalizada superó nuestras expectativas."
                }
            ];
            
            // Renderizar testimonios por defecto
            defaultTestimonials.forEach(testimonial => {
                appendTestimonial(testimonial);
            });
        }
    }
    
    // Función para añadir un testimonio al contenedor
    function appendTestimonial(testimonial) {
        const testimonialsContainer = document.getElementById('testimonials-container');
        
        if (!testimonialsContainer) return;
        
        // Crear HTML para las estrellas
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= testimonial.rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= testimonial.rating) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        
        // Crear elemento de testimonio
        const testimonialHtml = `
            <div class="col-md-4 mb-4">
                <div class="testimonial-box p-4">
                    <div class="rating mb-3">
                        ${starsHtml}
                    </div>
                    <p>"${testimonial.comment}"</p>
                    <div class="guest-info">
                        <h5>${testimonial.name}</h5>
                        <span>${testimonial.location}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir al contenedor
        testimonialsContainer.innerHTML += testimonialHtml;
    }

    // Animaciones en scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.fade-in');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = 1;
            }
        });
    };
  
    // Añadir clase para animación
    document.querySelectorAll('.feature-box, .room-card, .service-card, .gallery-item, .testimonial-box')
        .forEach(element => {
            element.classList.add('fade-in');
            element.style.opacity = 0;
            element.style.transition = 'opacity 0.6s ease-in-out';
        });
  
    // Ejecutar animaciones en carga y scroll
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);
});

// Agregar funcionalidad de cierre de sesión
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Obtener el proveedor actual de autenticación
            const user = firebase.auth().currentUser;
            const isGoogleProvider = user && user.providerData && 
                                    user.providerData.length > 0 && 
                                    user.providerData[0].providerId === 'google.com';
            
            // Limpiar datos almacenados localmente
            localStorage.removeItem('firebase:authUser:' + firebaseConfig.apiKey + ':[DEFAULT]');
            sessionStorage.clear();

        });
    }
    
    // Verificar si el usuario está autenticado
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Si no hay usuario autenticado, redirigir a login
            window.location.href = 'login.html';
        }
    });
});