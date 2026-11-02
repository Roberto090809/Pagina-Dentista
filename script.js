
"use strict";

// ==================================
// 1. ACTUALIZAR EL AÑO DEL FOOTER
// ==================================

const currentYear = document.getElementById("currentYear");

currentYear.textContent = new Date().getFullYear();


// ==================================
// 2. ELEMENTOS DEL FORMULARIO
// ==================================

const appointmentForm = document.getElementById("appointmentForm");
const dateInput = document.getElementById("appointmentDate");
const timeSelect = document.getElementById("appointmentTime");
const formMessage = document.getElementById("formMessage");

// Número del consultorio en formato internacional, sin el signo +.
const clinicPhone = "522441480428";

// HORARIO: único lugar del JS donde se cambia.
const SCHEDULE = { open: 9, closeWeekday: 19, closeSunday: 15 };

function getClosingHour(date) {
  return date.getDay() === 0 ? SCHEDULE.closeSunday : SCHEDULE.closeWeekday;
}

// Obtener la fecha local de hoy en formato YYYY-MM-DD.
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Impedir que se seleccione una fecha anterior a hoy.
dateInput.min = getLocalDateString();


// ==================================
// 3. GENERAR HORARIOS DISPONIBLES
// ==================================

function updateAvailableTimes() {
  const selectedDate = dateInput.value;

  // Limpiar las opciones anteriores.
  timeSelect.replaceChildren();

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = "Selecciona un horario";
  timeSelect.appendChild(firstOption);

  if (!selectedDate) {
    firstOption.textContent = "Primero elige fecha";
    return;
  }

  // Crear la fecha usando la fecha local, no UTC.
  const [year, month, day] = selectedDate.split("-").map(Number);
  const chosenDate = new Date(year, month - 1, day);

  const openingHour = SCHEDULE.open;
  const closingHour = getClosingHour(chosenDate);

  const now = new Date();
  const today = getLocalDateString(now);
  const isToday = selectedDate === today;

  // Ofrecer horarios cada 30 minutos.
  // El horario de cierre no se ofrece como hora de inicio.
  for (
    let minutes = openingHour * 60;
    minutes < closingHour * 60;
    minutes += 30
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    // No mostrar horarios que ya han pasado si es hoy.
    if (
      isToday &&
      minutes <= now.getHours() * 60 + now.getMinutes()
    ) {
      continue;
    }

    const option = document.createElement("option");

    option.value =
      String(hour).padStart(2, "0") +
      ":" +
      String(minute).padStart(2, "0");

    const displayHour = hour % 12 || 12;
    const period = hour < 12 ? "a. m." : "p. m.";

    option.textContent =
      `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;

    timeSelect.appendChild(option);
  }

  // Si ya no hay horarios posibles, informar al usuario.
  if (timeSelect.options.length === 1) {
    firstOption.textContent = "No hay horarios restantes";
  }
}

// Actualizar los horarios cada vez que cambie la fecha.
dateInput.addEventListener("change", updateAvailableTimes);


// ==================================
// 4. PREPARAR LA SOLICITUD POR WHATSAPP
// ==================================

appointmentForm.addEventListener("submit", function (event) {
  // Evitar que la página se recargue.
  event.preventDefault();

  // Comprobar los campos obligatorios.
  if (!appointmentForm.reportValidity()) {
    return;
  }

  const patientName =
    document.getElementById("patientName").value.trim();

  const patientPhone =
    document.getElementById("patientPhone").value.trim();

  const service =
    document.getElementById("service").value;

  const appointmentDate = dateInput.value;
  const appointmentTime = timeSelect.value;

  const notes =
    document.getElementById("notes").value.trim();

  // Verificar nuevamente el horario elegido.
  // La lista de horarios no garantiza que la clínica tenga
  // realmente ese espacio disponible.
  if (!appointmentDate || !appointmentTime) {
    formMessage.textContent =
      "Selecciona una fecha y un horario para continuar.";
    return;
  }

  const [year, month, day] = appointmentDate.split("-").map(Number);
  const chosenDate = new Date(year, month - 1, day);

  const [hour, minute] = appointmentTime.split(":").map(Number);
  const selectedMinutes = hour * 60 + minute;
  const closingMinutes = getClosingHour(chosenDate) * 60;

  if (
    selectedMinutes < SCHEDULE.open * 60 ||
    selectedMinutes >= closingMinutes
  ) {
    formMessage.textContent =
      "Ese horario está fuera del horario de atención.";
    return;
  }

  if (appointmentDate < getLocalDateString()) {
    formMessage.textContent =
      "Selecciona una fecha de hoy o posterior.";
    return;
  }

  if (
    appointmentDate === getLocalDateString() &&
    selectedMinutes <= new Date().getHours() * 60 +
      new Date().getMinutes()
  ) {
    formMessage.textContent =
      "Ese horario ya pasó. Selecciona otro.";
    return;
  }

  // Dar formato legible a la fecha.
  const readableDate = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(chosenDate);

  // Crear el mensaje para el consultorio.
  const message = [
    "Hola, Smile Inc. Quisiera solicitar una cita dental.",
    "",
    `Nombre: ${patientName}`,
    `Teléfono de contacto: ${patientPhone}`,
    `Servicio: ${service}`,
    `Fecha solicitada: ${readableDate}`,
    `Horario solicitado: ${timeSelect.options[timeSelect.selectedIndex].textContent}`,
    notes ? `Comentario: ${notes}` : "",
    "",
    "Entiendo que la cita está pendiente de confirmación."
  ].filter(Boolean).join("\n");

  // Codificar el texto para que funcione en una URL.
  const encodedMessage = encodeURIComponent(message);

  const whatsappURL =
    `https://wa.me/${clinicPhone}?text=${encodedMessage}`;

  // Abrir WhatsApp con el mensaje preparado.
  window.open(whatsappURL, "_blank", "noopener,noreferrer");

  formMessage.textContent =
    "Se ha preparado tu solicitud. Revisa WhatsApp y envía el mensaje.";
});

/* ==================================
   5. MODO CLARO Y MODO OSCURO
================================== */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

// Aplicar el tema seleccionado.
function applyTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);

  themeIcon.textContent = isDark ? "☀" : "☾";
  themeText.textContent = isDark ? "Modo claro" : "Modo oscuro";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Activar modo claro" : "Activar modo oscuro"
  );

  themeToggle.setAttribute("aria-pressed", String(isDark));
}

// Recuperar la preferencia guardada.
// Si no hay preferencia, comenzar en modo claro.
let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("smileIncTheme") || "light";
} catch (error) {
  console.warn("No se pudo recuperar el tema guardado.");
}

// Establecer el tema inicial.
applyTheme(savedTheme === "dark");

// Cambiar el tema cuando el usuario pulsa el botón.
themeToggle.addEventListener("click", function () {
  const isDark = !document.body.classList.contains("dark-mode");

  applyTheme(isDark);

  // Guardar la preferencia para futuras visitas.
  try {
    localStorage.setItem(
      "smileIncTheme",
      isDark ? "dark" : "light"
    );
  } catch (error) {
    console.warn("No se pudo guardar la preferencia de tema.");
  }
});

/* =====================================
   6. MENÚ HAMBURGUESA PARA CELULARES
===================================== */

const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mainNav = document.getElementById("mainNav");

// Abrir o cerrar el menú.
function setMobileMenu(open) {
  mainNav.classList.toggle("mobile-open", open);

  mobileMenuToggle.setAttribute(
    "aria-expanded",
    String(open)
  );

  mobileMenuToggle.setAttribute(
    "aria-label",
    open ? "Cerrar menú de navegación" : "Abrir menú de navegación"
  );
}

// Detectar cuando se pulsa el botón hamburguesa.
mobileMenuToggle.addEventListener("click", function () {
  const isOpen =
    mobileMenuToggle.getAttribute("aria-expanded") === "true";

  setMobileMenu(!isOpen);
});

// Cerrar el menú al seleccionar un enlace.
mainNav.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function () {
    setMobileMenu(false);
  });
});

// Desplegable "Servicios": cerrarlo al elegir una opción,
// al hacer clic afuera o al pulsar Escape.
const servicesDropdown = document.querySelector(".dropdown");

function closeDropdown() {
  servicesDropdown.removeAttribute("open");
}

servicesDropdown.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", closeDropdown);
});

document.addEventListener("click", function (event) {
  if (!servicesDropdown.contains(event.target)) {
    closeDropdown();
  }
});

// Cerrar menús si se pulsa Escape.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    setMobileMenu(false);
    closeDropdown();
  }
});

// Si se cambia a una pantalla grande, limpiar el estado móvil.
window.addEventListener("resize", function () {
  if (window.innerWidth > 1050) {
    setMobileMenu(false);
  }
});
