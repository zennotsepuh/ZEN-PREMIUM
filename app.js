
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const pageNames = ["dashboard", "activation", "donation", "activity"];

let selectedAmount = 10000;
let toastTimer;
let lastFocusedElement = null;

const logs = [
  {
    icon: "✦",
    color: "purple",
    title: "Dashboard siap digunakan",
    detail: "Antarmuka demo dimuat",
    time: "Baru saja"
  },
  {
    icon: "✓",
    color: "green",
    title: "Sistem antarmuka aktif",
    detail: "Tidak terhubung ke backend",
    time: "Hari ini"
  },
  {
    icon: "♡",
    color: "blue",
    title: "Menu donasi tersedia",
    detail: "Simulasi tanpa transaksi",
    time: "Hari ini"
  }
];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatRupiah(amount) {
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function addLog(title, detail = "Aktivitas lokal") {
  logs.unshift({
    icon: "•",
    color: "purple",
    title,
    detail,
    time: new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  renderLogs();
}

function renderActivityRow(log) {
  return `
    <div class="activity-row">
      <span class="activity-symbol ${escapeHTML(log.color)}">
        ${escapeHTML(log.icon)}
      </span>
      <div class="activity-info">
        <b>${escapeHTML(log.title)}</b>
        <small>${escapeHTML(log.detail)}</small>
      </div>
      <span class="activity-time">${escapeHTML(log.time)}</span>
    </div>
  `;
}

function renderLogs() {
  const recent = $("#recentActivity");
  const all = $("#allActivity");

  recent.innerHTML = logs.slice(0, 4).map(renderActivityRow).join("");

  all.innerHTML = logs.length
    ? logs.map(renderActivityRow).join("")
    : `
      <div class="empty-state">
        <span class="empty-icon">◷</span>
        <b>Belum ada aktivitas</b>
        <p>Aktivitas baru akan tampil di sini.</p>
      </div>
    `;

  $("#logCount").textContent = `${logs.length} AKTIVITAS`;
}

function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#overlay").classList.remove("open");
}

function toggleSidebar() {
  const isOpen = $("#sidebar").classList.toggle("open");
  $("#overlay").classList.toggle("open", isOpen);
}

function showPage(name) {
  if (!pageNames.includes(name)) return;

  $$(".page").forEach(page => {
    page.classList.toggle("active", page.id === `page-${name}`);
  });

  $$(".nav-item").forEach(button => {
    const active = button.dataset.page === name;
    button.classList.toggle("active", active);

    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  $("#breadcrumb").textContent =
    "/ " + name.charAt(0).toUpperCase() + name.slice(1);

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name !== "dashboard") {
    addLog(`Membuka halaman ${name}`, "Navigasi panel");
  }
}

function openModal(title, message) {
  lastFocusedElement = document.activeElement;

  $("#modalTitle").textContent = title;
  $("#modalMessage").textContent = message;
  $("#modal").classList.add("open");
  $("#modal").setAttribute("aria-hidden", "false");
  $("#modalOk").focus();
}

function closeModal() {
  $("#modal").classList.remove("open");
  $("#modal").setAttribute("aria-hidden", "true");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function initNavigation() {
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");

    if (!button) return;

    event.preventDefault();
    showPage(button.dataset.page);
  });

  $("#menuToggle").addEventListener("click", toggleSidebar);
  $("#closeSidebar").addEventListener("click", closeSidebar);
  $("#overlay").addEventListener("click", closeSidebar);

  $("#profileButton").addEventListener("click", () => {
    openModal(
      "Profil ZEN",
      "Ini adalah profil demonstrasi. Sistem akun dan login belum dihubungkan."
    );
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
      closeSidebar();
    }
  });
}

function initModal() {
  $("#closeModal").addEventListener("click", closeModal);
  $("#modalOk").addEventListener("click", closeModal);

  $("#modal").addEventListener("click", event => {
    if (event.target === $("#modal")) closeModal();
  });
}

function initActivationForm() {
  $("#activationForm").addEventListener("submit", event => {
    event.preventDefault();

    const service = $("#service").value;
    const contact = $("#contact").value.trim();
    const notes = $("#notes").value.trim();

    if (!service) {
      showToast("Pilih layanan terlebih dahulu.");
      $("#service").focus();
      return;
    }

    const status = $("#activationStatus");

    status.innerHTML = `
      <span class="empty-icon">✓</span>
      <b>Permintaan demo dibuat</b>
      <p>Layanan: ${escapeHTML(service)}</p>
      <p>Status: <strong style="color:#ffc16c">Menunggu (demo)</strong></p>
      <p>Permintaan ini hanya tersimpan di tampilan saat ini.
        Tidak ada data yang dikirim ke server.</p>
    `;

    let detail = "Permintaan frontend demo";

    if (contact) {
      detail += " · Kontak dicantumkan";
    }

    if (notes) {
      detail += " · Catatan ditambahkan";
    }

    addLog(`Permintaan aktivasi: ${service}`, detail);
    showToast("Permintaan demo berhasil dibuat.");

    event.currentTarget.reset();
  });
}

function initDonation() {
  $$(".amount").forEach(button => {
    button.addEventListener("click", () => {
      $$(".amount").forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      selectedAmount = Number(button.dataset.amount);

      $("#selectedAmount").textContent = formatRupiah(selectedAmount);
    });
  });

  $("#donateButton").addEventListener("click", () => {
    openModal(
      "Konfirmasi donasi demo",
      `Nominal pilihan ${formatRupiah(selectedAmount)}. Ini simulasi frontend saja. Tidak ada QRIS, pembayaran, atau transaksi yang dibuat.`
    );

    addLog(
      `Memilih nominal ${formatRupiah(selectedAmount)}`,
      "Simulasi donasi"
    );
  });
}

function initActivityControls() {
  $("#clearLogs").addEventListener("click", () => {
    logs.length = 0;
    renderLogs();
    showToast("Log aktivitas berhasil dibersihkan.");
  });
}

function initDate() {
  const now = new Date();

  $("#currentDate").textContent = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(now);

  $("#year").textContent = now.getFullYear();
}

function initApp() {
  initNavigation();
  initModal();
  initActivationForm();
  initDonation();
  initActivityControls();
  initDate();
  renderLogs();
}

document.addEventListener("DOMContentLoaded", initApp);
