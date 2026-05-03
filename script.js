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
const weddingMusic = document.querySelector("#weddingMusic");
const revealItems = document.querySelectorAll(".section, .section-heading, .countdown-section, .countdown div, .event-card, .profile, .timeline article, .gallery__item, .bank-card, .rsvp-form, .guest-book");
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyU8tZ7z8QCI5B0v-NwTVXr3-RaZJii69qmmupneKfUuTWr_ZdOZqjwZyjuf1WR6mG7tA/exec";
const parallaxItems = [
  { selector: ".hero__content", speed: -0.06 },
  { selector: ".hero-arch", speed: -0.04 },
  { selector: ".floral-corner--left", speed: 0.08 },
  { selector: ".floral-corner--right", speed: 0.06 },
  { selector: ".floral-corner--top", speed: -0.05 },
  { selector: ".gallery__item", speed: 0.035 }
].flatMap((item) => [...document.querySelectorAll(item.selector)].map((element) => ({
  element,
  speed: item.speed
})));

document.body.classList.add("is-locked");
document.body.classList.add("parallax-ready");

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

function cleanUrlHash() {
  if (window.location.hash) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
}

function scrollToTarget(hash) {
  const target = document.querySelector(hash);

  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  cleanUrlHash();
}

cleanUrlHash();

openInvitation.addEventListener("click", () => {
  cover.classList.add("is-hidden");
  document.body.classList.remove("is-locked");
  document.body.classList.add("invitation-open");
  playMusic();
});

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (link) {
    event.preventDefault();
    scrollToTarget(link.getAttribute("href"));
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');

  if (!link || link.closest(".nav__links")) {
    return;
  }

  event.preventDefault();
  scrollToTarget(link.getAttribute("href"));
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

function attendanceClass(value) {
  return value === "hadir" ? "is-attending" : "is-not-attending";
}

function renderWishes(wishes) {
  if (!wishes.length) {
    wishesList.innerHTML = '<p class="wishes-list__empty">Belum ada ucapan yang ditampilkan.</p>';
    return;
  }

  wishesList.innerHTML = wishes.map((wish) => `
    <article class="wish-card is-visible">
      <div class="wish-card__top">
        <h4>${escapeHtml(wish.name || "Tamu")}</h4>
        <span class="${attendanceClass(wish.attendance)}">${attendanceLabel(wish.attendance)}</span>
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

  renderWishesError("Memuat ucapan tamu...");

  requestGoogleScript({ action: "list" }, (response) => {
    renderWishes(response.data || []);
  }, () => {
    renderWishesError("Ucapan tamu belum dapat ditampilkan. Silakan muat ulang beberapa saat lagi.");
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
        formMessage.textContent = "Maaf, konfirmasi belum berhasil dikirim. Silakan coba beberapa saat lagi.";
      });
    } catch {
      formMessage.textContent = "Maaf, konfirmasi belum berhasil dikirim. Silakan coba beberapa saat lagi.";
    }
  } else {
    formMessage.textContent = "Terima kasih, konfirmasi Anda sudah diterima.";
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

async function playMusic() {
  try {
    await weddingMusic.play();
    musicToggle.classList.add("is-playing");
    musicToggle.setAttribute("aria-label", "Jeda musik");
  } catch {
    musicToggle.classList.remove("is-playing");
    musicToggle.setAttribute("aria-label", "Putar musik");
  }
}

function pauseMusic() {
  weddingMusic.pause();
  musicToggle.classList.remove("is-playing");
  musicToggle.setAttribute("aria-label", "Putar musik");
}

musicToggle.addEventListener("click", () => {
  if (weddingMusic.paused) {
    playMusic();
  } else {
    pauseMusic();
  }
});

function updateParallax() {
  const viewportCenter = window.innerHeight / 2;

  parallaxItems.forEach(({ element, speed }) => {
    const rect = element.getBoundingClientRect();

    if (rect.bottom < -120 || rect.top > window.innerHeight + 120) {
      return;
    }

    const elementCenter = rect.top + rect.height / 2;
    const offset = (viewportCenter - elementCenter) * speed;
    element.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  });
}

let parallaxTicking = false;

window.addEventListener("scroll", () => {
  if (parallaxTicking) {
    return;
  }

  parallaxTicking = true;
  requestAnimationFrame(() => {
    updateParallax();
    parallaxTicking = false;
  });
}, { passive: true });

window.addEventListener("resize", updateParallax);
updateParallax();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  }, {
    threshold: [0, 0.2, 1]
  });

  revealItems.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
