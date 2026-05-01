const cover = document.querySelector("#cover");
const openInvitation = document.querySelector("#openInvitation");
const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.querySelector(".nav__links");
const countdown = document.querySelector(".countdown");
const rsvpForm = document.querySelector(".rsvp-form");
const formMessage = document.querySelector(".form-message");
const guestName = document.querySelector("#guestName");
const rsvpName = document.querySelector("#rsvpName");
const wishesList = document.querySelector("#wishesList");
const refreshWishes = document.querySelector("#refreshWishes");
const copyButtons = document.querySelectorAll(".copy-btn");
const musicToggle = document.querySelector("#musicToggle");
const revealItems = document.querySelectorAll(".section, .countdown-section, .event-card, .profile, .timeline article, .gallery__item, .bank-card");
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyU8tZ7z8QCI5B0v-NwTVXr3-RaZJii69qmmupneKfUuTWr_ZdOZqjwZyjuf1WR6mG7tA/exec";

document.body.classList.add("is-locked");

function getGuestFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawName = params.get("to") || params.get("nama") || params.get("tamu") || params.get("guest");

  if (!rawName) {
    return "";
  }

  return rawName.replace(/\+/g, " ").trim();
}

const invitedGuest = getGuestFromUrl();

if (invitedGuest) {
  guestName.textContent = invitedGuest;
  rsvpName.value = invitedGuest;
}

openInvitation.addEventListener("click", () => {
  cover.classList.add("is-hidden");
  document.body.classList.remove("is-locked");
});

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const targetDate = new Date(countdown.dataset.date).getTime();
  const distance = Math.max(targetDate - Date.now(), 0);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  document.querySelector("#days").textContent = pad(days);
  document.querySelector("#hours").textContent = pad(hours);
  document.querySelector("#minutes").textContent = pad(minutes);
  document.querySelector("#seconds").textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attendanceLabel(value) {
  return value === "hadir" ? "Hadir" : "Tidak hadir";
}

function renderWishes(wishes) {
  if (!wishes.length) {
    wishesList.innerHTML = '<p class="wishes-list__empty">Belum ada ucapan yang ditampilkan.</p>';
    return;
  }

  wishesList.innerHTML = wishes.map((wish) => `
    <article class="wish-card">
      <div class="wish-card__top">
        <h4>${escapeHtml(wish.name || "Tamu")}</h4>
        <span>${attendanceLabel(wish.attendance)}</span>
      </div>
      <p>${escapeHtml(wish.message || "Terima kasih atas konfirmasinya.")}</p>
    </article>
  `).join("");
}

function renderWishesError(message) {
  wishesList.innerHTML = `<p class="wishes-list__empty">${escapeHtml(message)}</p>`;
}

function loadLocalWishes() {
  return JSON.parse(localStorage.getItem("wedding-wishes") || "[]");
}

function saveLocalWish(wish) {
  const wishes = loadLocalWishes();
  wishes.unshift(wish);
  localStorage.setItem("wedding-wishes", JSON.stringify(wishes.slice(0, 30)));
  renderWishes(wishes);
}

function loadWishesFromGoogleSheet() {
  if (!GOOGLE_SCRIPT_URL) {
    renderWishes(loadLocalWishes());
    return;
  }

  renderWishesError("Memuat ucapan dari Google Sheets...");

  requestGoogleScript({ action: "list" }, (response) => {
    renderWishes(response.data || []);
  }, () => {
    renderWishesError("Ucapan belum bisa dibaca dari Google Sheets. Cek deploy Apps Script dan akses Web App.");
  });
}

function requestGoogleScript(params, onSuccess, onError) {
  const callbackName = `googleSheetCallback${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const script = document.createElement("script");
  const url = new URL(GOOGLE_SCRIPT_URL);
  const timeout = setTimeout(() => {
    script.remove();
    delete window[callbackName];
    onError();
  }, 10000);

  window[callbackName] = (response) => {
    clearTimeout(timeout);
    onSuccess(response);
    script.remove();
    delete window[callbackName];
  };

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set("callback", callbackName);

  script.src = url.toString();
  script.onerror = () => {
    clearTimeout(timeout);
    onError();
    script.remove();
    delete window[callbackName];
  };

  document.body.appendChild(script);
}

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(rsvpForm);
  const wish = {
    name: data.get("name")?.toString().trim() || "Tamu",
    attendance: data.get("attendance")?.toString() || "hadir",
    message: data.get("message")?.toString().trim() || "",
    createdAt: new Date().toISOString()
  };

  formMessage.textContent = "Mengirim RSVP...";

  if (GOOGLE_SCRIPT_URL) {
    try {
      requestGoogleScript({ action: "add", ...wish }, (response) => {
        formMessage.textContent = wish.attendance === "hadir"
          ? `Terima kasih, ${wish.name}. Kehadiran Anda sudah tercatat.`
          : `Terima kasih, ${wish.name}. Doa baik Anda sangat berarti untuk kami.`;

        renderWishes(response.data || []);
      }, () => {
        formMessage.textContent = "RSVP belum masuk ke Google Sheets. Cek deploy Apps Script dan akses Web App.";
      });
    } catch {
      formMessage.textContent = "RSVP belum masuk ke Google Sheets. Cek deploy Apps Script dan akses Web App.";
    }
  } else {
    formMessage.textContent = "Mode demo aktif. Isi GOOGLE_SCRIPT_URL agar RSVP masuk ke Google Sheets.";
    saveLocalWish(wish);
  }

  rsvpForm.reset();
  if (invitedGuest) {
    rsvpName.value = invitedGuest;
  }
});

refreshWishes.addEventListener("click", loadWishesFromGoogleSheet);
loadWishesFromGoogleSheet();

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const defaultText = button.textContent;

    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "Tersalin";
    } catch {
      button.textContent = "Gagal Menyalin";
    }

    setTimeout(() => {
      button.textContent = defaultText;
    }, 1600);
  });
});

musicToggle.addEventListener("click", () => {
  musicToggle.classList.toggle("is-playing");
  musicToggle.setAttribute(
    "aria-label",
    musicToggle.classList.contains("is-playing") ? "Matikan musik" : "Aktifkan musik"
  );
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
