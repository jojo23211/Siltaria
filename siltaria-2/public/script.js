(function () {
  "use strict";

  const FEATURE_ICONS = {
    shield: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v8M9.5 10c0-1.1 1.1-2 2.5-2s2.5.7 2.5 1.7c0 2.3-5 1.3-5 3.6 0 1 1.1 1.7 2.5 1.7s2.5-.9 2.5-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="1.6"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><circle cx="8.5" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="9" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M3 19c0-3 2.5-5 5.5-5S14 16 14 19M14.5 19c0-2.2 1.7-4 3.8-4 1.7 0 3.2 1.1 3.6 2.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 19c2-3 5-6 9-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.7l-5.3 2.9 1.1-5.9-4.3-4.1 5.9-.7L12 3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  };

  let siteData = null;

  // ---------- load + render ----------

  async function loadSiteData() {
    try {
      const res = await fetch("/api/site-data");
      siteData = await res.json();
      applyDesign(siteData.design);
      renderAll(siteData);
    } catch (e) {
      console.error("Konnte Seiteninhalte nicht laden", e);
    }
  }

  function applyDesign(design) {
    if (!design) return;
    const root = document.documentElement.style;
    const c = design.colors || {};
    if (c.bg) root.setProperty("--bg", c.bg);
    if (c.bgAlt) root.setProperty("--bg-alt", c.bgAlt);
    if (c.accent) root.setProperty("--accent", c.accent);
    if (c.jade) root.setProperty("--jade", c.jade);
    if (c.text) root.setProperty("--text", c.text);
    if (design.radius) root.setProperty("--radius", design.radius + "px");

    const f = design.fonts || {};
    if (f.heading) root.setProperty("--font-heading", `"${f.heading}", serif`);
    if (f.body) root.setProperty("--font-body", `"${f.body}", sans-serif`);
    if (f.mono) root.setProperty("--font-mono", `"${f.mono}", monospace`);
  }

  function renderAll(data) {
    renderGeneral(data.general);
    renderAbout(data.about);
    renderFeatures(data.features);
    renderRules(data.rules);
    renderTeam(data.team, data.recruitment);
    renderDiscord(data.discord);
    renderGallery(data.gallery);
    renderFaq(data.faq);
    renderPrivacy(data.privacy);
  }

  function renderGeneral(g) {
    if (!g) return;
    document.title = `${g.serverName} – Survival Minecraft-Server (Java & Bedrock)`;
    setText("hero-headline", g.headline);
    setText("hero-claim", g.claim);
    setText("ip-java", g.ip);
    setText("ip-bedrock", g.ipBedrock || g.ip);
    setText("hero-version", g.version);
    document.querySelectorAll(".logo").forEach((el) => (el.textContent = el.classList.contains("small") ? g.serverName : g.serverName));
  }

  function renderAbout(about) {
    if (!about) return;
    setText("about-title", about.title);
    setText("about-text", about.text);
    const labels = about.layerLabels || [];
    document.querySelectorAll("#layers-graphic .layer-label").forEach((el) => {
      const i = parseInt(el.dataset.i, 10);
      el.textContent = labels[i] || "";
    });
  }

  function renderFeatures(features) {
    const grid = document.getElementById("features-grid");
    if (!grid || !features) return;
    grid.innerHTML = features
      .map(
        (f) => `
      <div class="feature-card">
        <div class="feature-icon">${FEATURE_ICONS[f.icon] || FEATURE_ICONS.star}</div>
        <h3>${escapeHtml(f.title)}</h3>
        <p>${escapeHtml(f.text)}</p>
      </div>`
      )
      .join("");
  }

  function renderRules(rules) {
    const list = document.getElementById("rules-list");
    if (!list || !rules) return;
    list.innerHTML = rules.map((r) => `<li><span>${escapeHtml(r)}</span></li>`).join("");
  }

  function renderTeam(team, recruitment) {
    const grid = document.getElementById("team-grid");
    if (grid && team) {
      grid.innerHTML = team
        .map((m) => {
          const safeName = /^[a-zA-Z0-9_]{1,16}$/.test(m.name) ? m.name : "Steve";
          return `
        <div class="team-card">
          <img class="team-avatar" src="https://mc-heads.net/avatar/${encodeURIComponent(safeName)}/72" alt="${escapeHtml(m.name)}" loading="lazy" />
          <h3>${escapeHtml(m.name)}</h3>
          <span class="team-role">${escapeHtml(m.role)}</span>
          <p>${escapeHtml(m.bio || "")}</p>
        </div>`;
        })
        .join("");
    }

    if (recruitment) {
      setText("recruitment-title", recruitment.title);
      setText("recruitment-text", recruitment.text);
      const table = document.getElementById("recruitment-table");
      if (table) {
        table.innerHTML = (recruitment.requirements || [])
          .map(
            (r) => `
          <div class="recruitment-row">
            <span class="recruitment-rang">${escapeHtml(r.rang)}</span>
            <span class="recruitment-req">${escapeHtml(r.anforderungen)}</span>
          </div>`
          )
          .join("");
      }
    }
  }

  function renderDiscord(discord) {
    if (!discord) return;
    setText("discord-title", discord.title);
    setText("discord-text", discord.text);
    const link = document.getElementById("discord-link");
    if (link) link.href = discord.link || "#";
  }

  function renderGallery(gallery) {
    const grid = document.getElementById("gallery-grid");
    if (!grid || !gallery) return;
    grid.innerHTML = gallery
      .map((g) => `<div class="gallery-item">${escapeHtml(g.label || "Screenshot")}</div>`)
      .join("");
  }

  function renderFaq(faq) {
    const list = document.getElementById("faq-list");
    if (!list || !faq) return;
    list.innerHTML = faq
      .map(
        (item, i) => `
      <div class="faq-item" data-index="${i}">
        <button class="faq-question" type="button">
          <span>${escapeHtml(item.q)}</span>
          <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="faq-answer"><p>${escapeHtml(item.a)}</p></div>
      </div>`
      )
      .join("");

    list.querySelectorAll(".faq-item").forEach((item) => {
      const btn = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        list.querySelectorAll(".faq-item.open").forEach((o) => {
          o.classList.remove("open");
          o.querySelector(".faq-answer").style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add("open");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    });
  }

  function renderPrivacy(privacy) {
    if (!privacy) return;
    setText("privacy-title", privacy.title);
    setText("privacy-text", privacy.text);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- server status (placeholder, ready for live mcsrvstat.us) ----------

  async function refreshStatus() {
    const dot = document.getElementById("status-dot");
    const text = document.getElementById("status-text");
    const players = document.getElementById("status-players");
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      dot.classList.remove("online", "offline");
      if (data.online) {
        dot.classList.add("online");
        text.textContent = "Server online";
        players.textContent = `· ${data.players}/${data.maxPlayers} Spieler`;
      } else {
        dot.classList.add("offline");
        text.textContent = data.source === "placeholder" ? "Status folgt (IP noch nicht live)" : "Server offline";
        players.textContent = "";
      }
    } catch (e) {
      dot.classList.remove("online");
      dot.classList.add("offline");
      text.textContent = "Status nicht verfügbar";
      players.textContent = "";
    }
  }

  // ---------- IP copy ----------

  function setupCopyButtons() {
    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const targetId = btn.dataset.copyTarget;
        const el = document.getElementById(targetId);
        if (!el) return;
        try {
          await navigator.clipboard.writeText(el.textContent.trim());
          const feedback = document.getElementById("copy-feedback");
          feedback.textContent = "IP kopiert!";
          setTimeout(() => (feedback.textContent = ""), 2000);
        } catch (e) {
          const feedback = document.getElementById("copy-feedback");
          feedback.textContent = "Kopieren fehlgeschlagen – bitte manuell markieren.";
        }
      });
    });
  }

  // ---------- mobile nav ----------

  function setupNavToggle() {
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // ---------- connect with MC name (no login, just avatar lookup) ----------

  function setupConnectForm() {
    const form = document.getElementById("connect-form");
    const input = document.getElementById("mc-name");
    const error = document.getElementById("connect-error");
    const result = document.getElementById("connect-result");
    const avatar = document.getElementById("connect-avatar");
    const statusText = document.getElementById("connect-status-text");

    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = input.value.trim();
      const valid = /^[A-Za-z0-9_]{3,16}$/.test(name);

      if (!valid) {
        error.textContent = "Bitte gib einen gültigen Minecraft-Namen ein (3–16 Zeichen, nur Buchstaben, Zahlen und _).";
        result.hidden = true;
        return;
      }

      error.textContent = "";
      avatar.src = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/120`;
      avatar.alt = `Minecraft-Kopf von ${name}`;
      statusText.textContent = `Verbunden als ${name}`;
      result.hidden = false;
    });
  }

  function setYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  // ---------- init ----------

  document.addEventListener("DOMContentLoaded", async () => {
    setYear();
    setupNavToggle();
    setupCopyButtons();
    setupConnectForm();
    await loadSiteData();
    refreshStatus();
    setInterval(refreshStatus, 30000);
  });
})();
