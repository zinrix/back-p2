// Constants and Global Variables
const API_URL = '/api';
let selectedHotel = null;
let selectedRoom = null;
let currentCustomer = null;
let checkInDate = null;
let checkOutDate = null;
let capacityFilter = null;

// DOM Elements
const hotelSelect = document.getElementById('hotel');
const filterHotelSelect = document.getElementById('filterHotel');
const capacityInput = document.getElementById('capacity');
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');
const searchForm = document.getElementById('searchForm');
const roomsTable = document.getElementById('roomsTable');
const availableRoomsDiv = document.getElementById('availableRooms');
const customerFormDiv = document.getElementById('customerForm');
const bookingForm = document.getElementById('bookingForm');
const cedulaInput = document.getElementById('cedula');
const nombreInput = document.getElementById('nombre');
const apellidoInput = document.getElementById('apellido');
const guestsInput = document.getElementById('guests');
const selectedRoomInput = document.getElementById('selectedRoom');
const searchCustomerBtn = document.getElementById('searchCustomer');
const cancelBookingBtn = document.getElementById('cancelBooking');
const filterForm = document.getElementById('filterForm');
const filterCheckInInput = document.getElementById('filterCheckIn');
const filterCheckOutInput = document.getElementById('filterCheckOut');
const filterClientInput = document.getElementById('filterClient');
const reservationsTable = document.getElementById('reservationsTable');
const notificationToast = document.getElementById('notificationToast');
const toastTitle = document.getElementById('toastTitle');
const toastMessage = document.getElementById('toastMessage');

// Initialize Bootstrap Toast
const toast = new bootstrap.Toast(notificationToast);

// Set min dates for date inputs to today
const today = new Date().toISOString().split('T')[0];
checkInInput.min = today;
checkOutInput.min = today;
filterCheckInInput.min = today;
filterCheckOutInput.min = today;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadHotels();
    
    // Add event listeners
    searchForm.addEventListener('submit', handleSearchRooms);
    bookingForm.addEventListener('submit', handleBookRoom);
    searchCustomerBtn.addEventListener('click', searchCustomer);
    cancelBookingBtn.addEventListener('click', cancelBooking);
    filterForm.addEventListener('submit', handleFilterReservations);
    
    // Handle date input validations
    checkInInput.addEventListener('change', () => {
        checkOutInput.min = checkInInput.value;
        if (checkOutInput.value && checkOutInput.value < checkInInput.value) {
            checkOutInput.value = checkInInput.value;
        }
    });
    
    filterCheckInInput.addEventListener('change', () => {
        if (filterCheckOutInput.value && filterCheckOutInput.value < filterCheckInInput.value) {
            filterCheckOutInput.value = filterCheckInInput.value;
        }
    });
});

// API Calls
async function fetchAPI(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        console.log(`API ${method} request to ${endpoint}`, data);
        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Request failed');
        }
        
        const responseData = await response.json();
        console.log(`API response from ${endpoint}:`, responseData);
        return responseData;
    } catch (error) {
        showNotification('Error', error.message, 'error');
        console.error('API Error:', error);
        throw error;
    }
}

// Load hotels into select elements
async function loadHotels() {
    try {
        const hotels = await fetchAPI('/hoteles');
        
        // Clear existing options
        hotelSelect.innerHTML = '<option value="" selected disabled>Seleccionar Hotel</option>';
        filterHotelSelect.innerHTML = '<option value="" selected disabled>Seleccionar Hotel</option>';
        
        // Add hotel options
        hotels.forEach(hotel => {
            const option1 = document.createElement('option');
            option1.value = hotel.id;
            option1.textContent = hotel.nombre;
            hotelSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = hotel.id;
            option2.textContent = hotel.nombre;
            filterHotelSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Error al cargar hoteles:', error);
    }
}

// Handle search for available rooms
async function handleSearchRooms(event) {
    event.preventDefault();
    
    selectedHotel = hotelSelect.value;
    checkInDate = checkInInput.value;
    checkOutDate = checkOutInput.value;
    capacityFilter = capacityInput.value || null;
    if (!selectedHotel || !checkInDate || !checkOutDate) {
        showNotification('Error', 'Por favor seleccione hotel y fechas', 'error');
        return;
    }
    
    try {
        // Construct query parameters
        const params = new URLSearchParams({
            hotelId: selectedHotel,
            checkIn: checkInDate,
            checkOut: checkOutDate
        });
        
        if (capacityFilter) {
            params.append('capacity', capacityFilter);
        }

        
        const rooms = await fetchAPI(`/reservas/available?${params.toString()}`);
        displayAvailableRooms(rooms);
        
        // Reset booking form
        cancelBooking();
    } catch (error) {
        console.error('Error searching for rooms:', error);
        availableRoomsDiv.innerHTML = '<div class="col-12 text-center text-danger"><p>Error al buscar habitaciones</p></div>';
    }
}
function displayAvailableRooms(rooms) {

    if (!rooms || rooms.length === 0 || rooms.availableRooms ===0) {
        availableRoomsDiv.innerHTML = '<div class="col-12 text-center text-muted"><p>No hay habitaciones disponibles para los criterios seleccionados</p></div>';
        return;
    }

    // Limpia cualquier contenido anterior
    availableRoomsDiv.innerHTML = '';

    // Agrupar habitaciones por piso
    const floorGroups = rooms.reduce((acc, room) => {
        if (!acc[room.piso]) {
            acc[room.piso] = [];
        }
        acc[room.piso].push(room);
        return acc;
    }, {});

    // Ordenar pisos
    const sortedFloors = Object.keys(floorGroups).sort((a, b) => {
        if (a === 'PB') return -1;
        if (b === 'PB') return 1;
        return parseInt(a) - parseInt(b);
    });

    // Crear los elementos visuales por piso
    sortedFloors.forEach(floor => {
        const floorSection = document.createElement('div');
        floorSection.classList.add('mb-3');

        const floorHeader = document.createElement('h5');
        floorHeader.textContent = `Piso ${floor}`;
        floorSection.appendChild(floorHeader);

        const row = document.createElement('div');
        row.className = 'row';

        floorGroups[floor].forEach(room => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-3';

            const card = document.createElement('div');
            card.className = 'card';

            // Crear contenido dentro de la tarjeta
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const cardTitle = document.createElement('h5');
            cardTitle.className = 'card-title';
            cardTitle.textContent = `Habitación ${room.numero}`;

            const capacidadText = document.createElement('p');
            capacidadText.className = 'card-text';
            capacidadText.textContent = `Capacidad: ${room.capacidad}`;
            
            const caracteristicasText = document.createElement('p');
            caracteristicasText.className = 'card-text';
            caracteristicasText.textContent = `Características: ${room.caracteristicas}`;

            const selectButton = document.createElement('button');
            selectButton.className = 'btn btn-success';
            selectButton.textContent = 'Seleccionar';
            selectButton.onclick = () => selectRoom(room.id, room.numero);

            // Agregar todo al cardBody y luego al card
            cardBody.appendChild(cardTitle);
            cardBody.appendChild(capacidadText);
            cardBody.appendChild(caracteristicasText);
            cardBody.appendChild(selectButton);
            card.appendChild(cardBody);
            col.appendChild(card);
            row.appendChild(col);
        });

        floorSection.appendChild(row);
        availableRoomsDiv.appendChild(floorSection);
    });
}
// Function to select a room and show the customer form
function selectRoom(roomId, roomNumber) {
    selectedRoom = roomId;
    selectedRoomInput.value = roomId;
    
    // Show customer form and scroll to it
    customerFormDiv.classList.remove('d-none');
    customerFormDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Set max guests based on room capacity (you might want to store room capacity when selecting)
    // For now, we'll reset the form
    resetCustomerForm();
    
    showNotification('Habitación Seleccionada', `Has seleccionado la habitación ${roomNumber}`, 'info');
}

// Function to search for a customer by cedula
async function searchCustomer() {
    const cedula = cedulaInput.value.trim();
    
    if (!cedula) {
        showNotification('Error', 'Ingrese una cédula para buscar', 'error');
        return;
    }
    
    try {
        const customer = await fetchAPI(`/clientes/cedula/${cedula}`);
        if (customer) {
            currentCustomer = customer;
            nombreInput.value = customer.nombre || '';
            apellidoInput.value = customer.apellido || '';
            showNotification('Cliente Encontrado', 'Información de cliente cargada', 'success');
        }
    } catch (error) {
        // If customer not found, clear fields to create a new one
        nombreInput.value = '';
        apellidoInput.value = '';
        currentCustomer = null;
        showNotification('Cliente No Encontrado', 'Ingrese los datos para crear un nuevo cliente', 'info');
    }
}

// Function to handle booking submission
async function handleBookRoom(event) {
    event.preventDefault();
    
    if (!selectedRoom) {
        showNotification('Error', 'No se ha seleccionado una habitación', 'error');
        return;
    }
    
    const bookingData = {
        hotelId: selectedHotel,
        habitacionId: selectedRoom,
        cedula: cedulaInput.value.trim(),
        nombre: nombreInput.value.trim(),
        apellido: apellidoInput.value.trim(),
        fechaIngreso: checkInDate,
        fechaSalida: checkOutDate,
        cantidadPersonas: parseInt(guestsInput.value, 10) || 1
    };
    
    if (!bookingData.cedula || !bookingData.nombre || !bookingData.apellido) {
        showNotification('Error', 'Por favor complete todos los campos del cliente', 'error');
        return;
    }
    
    try {
        const result = await fetchAPI('/reservas', 'POST', bookingData);
        showNotification('Reserva Confirmada', `Reserva creada exitosamente`, 'success');
        
        // Reset everything
        resetBookingProcess();
        
        // Refresh available rooms
        handleSearchRooms(new Event('submit'));
    } catch (error) {
        console.error('Error al crear reserva:', error);
    }
}

// Function to cancel booking process
function cancelBooking() {
    customerFormDiv.classList.add('d-none');
    selectedRoom = null;
    selectedRoomInput.value = '';
    resetCustomerForm();
}

// Function to reset customer form
function resetCustomerForm() {
    bookingForm.reset();
    currentCustomer = null;
}

// Function to reset entire booking process
function resetBookingProcess() {
    cancelBooking();
    selectedHotel = null;
    checkInDate = null;
    checkOutDate = null;
    capacityFilter = null;
    searchForm.reset();
    availableRoomsDiv.innerHTML = '<h5>Habitaciones Disponibles</h5><p>Seleccione un hotel y fechas para ver las habitaciones disponibles</p>';
}

// Function to handle reservation filtering
async function handleFilterReservations(event) {
    event.preventDefault();
    
    const hotelId = filterHotelSelect.value;
    const clientCedula = filterClientInput.value.trim() || null;
    const checkIn = filterCheckInInput.value;
    const checkOut = filterCheckOutInput.value || null;
    
    if (!hotelId || !checkIn) {
        showNotification('Error', 'Por favor seleccione al menos hotel y fecha de ingreso', 'error');
        return;
    }
    
    try {
        // Construct query parameters
        const params = new URLSearchParams({
            hotelId: hotelId,
            checkIn: checkIn
        });
        
        if (clientCedula) {
            params.append('cedula', clientCedula);
        }
        
        if (checkOut) {
            params.append('checkOut', checkOut);
        }
        
        const reservations = await fetchAPI(`/reservas?${params.toString()}`);
        displayReservations(reservations);
    } catch (error) {
        console.error('Error al filtrar reservas:', error);
        reservationsTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar las reservas</td></tr>';
    }
}

// Function to display reservations
// Function to display reservations
function displayReservations(reservations) {
    // Clear existing table
    reservationsTable.innerHTML = '';
    
    if (!reservations || reservations.length === 0) {
        reservationsTable.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No se encontraron reservas para los criterios seleccionados</td></tr>';
        return;
    }
    
    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        
        // Create cells for each column
        const hotelCell = document.createElement('td');
        hotelCell.textContent = reservation.Hotel.nombre;
        
        const roomCell = document.createElement('td');
        roomCell.textContent = reservation.Habitacion.numero;
        
        const floorCell = document.createElement('td');
        floorCell.textContent = reservation.Habitacion.piso;
        
        const clientCell = document.createElement('td');
        // También necesitarás actualizar la forma de acceder a los datos del cliente
        // Asumiendo que el nombre del cliente está en un objeto Cliente con mayúscula inicial
        clientCell.textContent = `${reservation.Cliente?.nombre || ''} ${reservation.Cliente?.apellido || ''} (${reservation.Cliente?.cedula || ''})`;
        
        const checkInCell = document.createElement('td');
        checkInCell.textContent = formatDate(reservation.fechaIngreso);
        
        const checkOutCell = document.createElement('td');
        checkOutCell.textContent = formatDate(reservation.fechaSalida);
        
        const peopleCell = document.createElement('td');
        peopleCell.textContent = reservation.cantidadPersonas;
        
        // Add all cells to the row
        row.appendChild(hotelCell);
        row.appendChild(roomCell);
        row.appendChild(floorCell);
        row.appendChild(clientCell);
        row.appendChild(checkInCell);
        row.appendChild(checkOutCell);
        row.appendChild(peopleCell);
        
        // Add the row to the table
        reservationsTable.appendChild(row);
    });
}
// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
}

// Function to show notifications
function showNotification(title, message, type = 'info') {
    // Set toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Set toast color based on type
    notificationToast.className = 'toast';
    switch (type) {
        case 'error':
            notificationToast.classList.add('bg-danger', 'text-white');
            break;
        case 'success':
            notificationToast.classList.add('bg-success', 'text-white');
            break;
        default:
            notificationToast.classList.add('bg-info', 'text-white');
    }
    
    // Show the toast
    toast.show();
}