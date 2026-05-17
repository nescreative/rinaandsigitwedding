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
const galleryCarousel = document.querySelector(".gallery-carousel");
const galleryTrack = document.querySelector(".gallery-carousel__track");
const gallerySlides = [...document.querySelectorAll(".gallery__slide")];
const galleryPrev = document.querySelector(".gallery-carousel__button--prev");
const galleryNext = document.querySelector(".gallery-carousel__button--next");
const galleryDots = document.querySelector(".gallery-carousel__dots");
const revealItems = document.querySelectorAll(
  ".section, .section-heading, .countdown-section, .countdown div, .event-card, .profile, .timeline article, .gallery-carousel, .gallery__slide, .bank-card, .rsvp-form, .guest-book",
);
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyU8tZ7z8QCI5B0v-NwTVXr3-RaZJii69qmmupneKfUuTWr_ZdOZqjwZyjuf1WR6mG7tA/exec";
const parallaxItems = [
  { selector: ".hero__content", speed: -0.06 },
  { selector: ".gallery__slide", speed: 0.02 },
].flatMap((item) =>
  [...document.querySelectorAll(item.selector)].map((element) => ({
    element,
    speed: item.speed,
  })),
);

document.body.classList.add("is-locked");
document.body.classList.add("parallax-ready");

function getGuestFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawName =
    params.get("to") ||
    params.get("nama") ||
    params.get("tamu") ||
    params.get("guest");

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
    history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
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

function getWishCreatedAt(wish) {
  return (
    wish.createdAt ||
    wish.timestamp ||
    wish.time ||
    wish.date ||
    wish.tanggal ||
    ""
  );
}

function formatWishTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const seconds = Math.max(Math.floor((Date.now() - date.getTime()) / 1000), 0);

  if (seconds < 60) {
    return "Baru saja dikirimkan";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} Menit yang lalu`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} Jam yang lalu`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} Hari yang lalu`;
  }

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

function renderWishes(wishes) {
  if (!wishes.length) {
    wishesList.innerHTML =
      '<p class="wishes-list__empty">Belum ada ucapan yang ditampilkan.</p>';
    return;
  }

  wishesList.innerHTML = wishes
    .map((wish) => {
      const createdAt = formatWishTime(getWishCreatedAt(wish));

      return `
      <article class="wish-card is-visible">
        <div class="wish-card__top">
          <h4>${escapeHtml(wish.name || "Tamu")}</h4>
          <span class="${attendanceClass(wish.attendance)}">${attendanceLabel(wish.attendance)}</span>
        </div>
        ${createdAt ? `<time class="wish-card__time">${escapeHtml(createdAt)}</time>` : ""}
        <p>${escapeHtml(wish.message || "Terima kasih atas konfirmasinya.")}</p>
      </article>
    `;
    })
    .join("");
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

  requestGoogleScript(
    { action: "list" },
    (response) => {
      renderWishes(response.data || []);
    },
    () => {
      renderWishesError(
        "Ucapan tamu belum dapat ditampilkan. Silakan muat ulang beberapa saat lagi.",
      );
    },
  );
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
    createdAt: new Date().toISOString(),
  };

  formMessage.textContent = "Mengirim RSVP...";

  if (GOOGLE_SCRIPT_URL) {
    try {
      requestGoogleScript(
        { action: "add", ...wish },
        (response) => {
          formMessage.textContent =
            wish.attendance === "hadir"
              ? `Terima kasih, ${wish.name}. Kehadiran Anda sudah tercatat.`
              : `Terima kasih, ${wish.name}. Doa baik Anda sangat berarti untuk kami.`;

          renderWishes(response.data || []);
        },
        () => {
          formMessage.textContent =
            "Maaf, konfirmasi belum berhasil dikirim. Silakan coba beberapa saat lagi.";
        },
      );
    } catch {
      formMessage.textContent =
        "Maaf, konfirmasi belum berhasil dikirim. Silakan coba beberapa saat lagi.";
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

let galleryIndex = 0;
let galleryTimer;
let galleryTouchStart = 0;

function updateGalleryCarousel(index) {
  const slidesPerView = getSlidesPerView();

  // batas index maksimal
  const maxIndex = Math.max(gallerySlides.length - slidesPerView, 0);

  // loop carousel
  if (index < 0) {
    galleryIndex = maxIndex;
  } else if (index > maxIndex) {
    galleryIndex = 0;
  } else {
    galleryIndex = index;
  }

  const targetSlide = gallerySlides[galleryIndex];

  galleryTrack.scrollTo({
    left: targetSlide.offsetLeft,
    behavior: "smooth",
  });

  [...galleryDots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === galleryIndex);

    dot.setAttribute("aria-selected", String(dotIndex === galleryIndex));
  });
}

function syncGalleryControls() {
  if (!galleryCarousel || !galleryTrack) {
    return;
  }

  const isStatic = galleryTrack.scrollWidth <= galleryTrack.clientWidth + 2;
  galleryCarousel.classList.toggle("is-static", isStatic);

  if (isStatic) {
    clearInterval(galleryTimer);
  } else {
    startGalleryCarousel();
  }
}

function startGalleryCarousel() {
  if (
    !gallerySlides.length ||
    galleryCarousel.classList.contains("is-static")
  ) {
    return;
  }

  clearInterval(galleryTimer);
  galleryTimer = setInterval(() => {
    updateGalleryCarousel(galleryIndex + 1);
  }, 5200);
}

function getSlidesPerView() {
  if (window.innerWidth >= 900) return 3;
  if (window.innerWidth >= 600) return 2;
  return 1;
}

function createGalleryDots() {
  galleryDots.innerHTML = "";

  const slidesPerView = getSlidesPerView();

  // jumlah dots menyesuaikan jumlah slide yang tampil
  const totalDots = Math.max(gallerySlides.length - slidesPerView + 1, 1);

  for (let index = 0; index < totalDots; index++) {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.setAttribute("aria-label", `Tampilkan foto ${index + 1}`);

    dot.addEventListener("click", () => {
      updateGalleryCarousel(index);
      startGalleryCarousel();
    });

    galleryDots.appendChild(dot);
  }
}

if (galleryCarousel && galleryTrack && gallerySlides.length) {
  createGalleryDots();

  galleryPrev.addEventListener("click", () => {
    updateGalleryCarousel(galleryIndex - 1);
    startGalleryCarousel();
  });

  galleryNext.addEventListener("click", () => {
    updateGalleryCarousel(galleryIndex + 1);
    startGalleryCarousel();
  });

  galleryCarousel.addEventListener("mouseenter", () => {
    clearInterval(galleryTimer);
  });

  galleryCarousel.addEventListener("mouseleave", () => {
    startGalleryCarousel();
  });

  galleryCarousel.addEventListener(
    "touchstart",
    (event) => {
      galleryTouchStart = event.touches[0].clientX;
      clearInterval(galleryTimer);
    },
    { passive: true },
  );

  galleryCarousel.addEventListener(
    "touchend",
    (event) => {
      const swipeDistance = event.changedTouches[0].clientX - galleryTouchStart;

      if (Math.abs(swipeDistance) > 40) {
        updateGalleryCarousel(galleryIndex + (swipeDistance < 0 ? 1 : -1));
      }

      startGalleryCarousel();
    },
    { passive: true },
  );

  galleryTrack.addEventListener(
    "scroll",
    () => {
      const nearestSlide = gallerySlides.reduce(
        (nearest, slide, index) => {
          const distance = Math.abs(slide.offsetLeft - galleryTrack.scrollLeft);

          return distance < nearest.distance ? { index, distance } : nearest;
        },
        {
          index: galleryIndex,
          distance: Infinity,
        },
      );

      galleryIndex = nearestSlide.index;

      [...galleryDots.children].forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === galleryIndex);

        dot.setAttribute("aria-selected", String(dotIndex === galleryIndex));
      });
    },
    { passive: true },
  );

  window.addEventListener("resize", () => {
    createGalleryDots();
    syncGalleryControls();
  });

  updateGalleryCarousel(0);
  syncGalleryControls();
}

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

window.addEventListener(
  "scroll",
  () => {
    if (parallaxTicking) {
      return;
    }

    parallaxTicking = true;
    requestAnimationFrame(() => {
      updateParallax();
      parallaxTicking = false;
    });
  },
  { passive: true },
);

window.addEventListener("resize", updateParallax);
updateParallax();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      threshold: [0, 0.2, 1],
    },
  );

  revealItems.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
