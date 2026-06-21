(function () {
  "use strict";

  let data = null; // working copy of site-data.json
  let activeTab = "general";
  let dirty = false;

  const TAB_TITLES = {
    general: "Allgemein",
    design: "Design",
    about: "Über uns",
    features: "Features",
    rules: "Regeln",
    team: "Team & Bewerbung",
    discord: "Community",
    gallery: "Galerie",
    faq: "FAQ",
    privacy: "Datenschutz",
    password: "Passwort ändern",
  };

  // ---------- auth ----------

  async function checkAuth() {
    const res = await fetch("/api/admin/check");
    const json = await res.json();
    return json.isAdmin;
  }

  async function login(password) {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Login fehlgeschlagen.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.reload();
  }

  // ---------- data load / save ----------

  async function loadData() {
    const res = await fetch("/api/admin/site-data");
    data = await res.json();
  }

  async function saveData() {
    const status = document.getElementById("save-status");
    status.textContent = "Speichert…";
    try {
      const res = await fetch("/api/admin/site-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen.");
      status.textContent = "Gespeichert ✓";
      dirty = false;
      setTimeout(() => (status.textContent = ""), 2500);
    } catch (e) {
      status.textContent = "Fehler beim Speichern.";
    }
  }

  function markDirty() {
    dirty = true;
  }

  // ---------- helpers ----------

  function el(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  function field(labelText, inputHtml, hint) {
    return `<div class="field-group">
      <label>${labelText}</label>
      ${inputHtml}
      ${hint ? `<div class="field-hint">${hint}</div>` : ""}
    </div>`;
  }

  function bindInput(selector, getValue, setValue) {
    const node = document.querySelector(selector);
    if (!node) return;
    node.value = getValue() ?? "";
    node.addEventListener("input", () => {
      setValue(node.value);
      markDirty();
    });
  }

  function bindTextarea(selector, getValue, setValue) {
    bindInput(selector, getValue, setValue);
  }

  // ---------- tab renderers ----------

  function renderGeneral(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>Server-Grunddaten</h2>
        <p class="tab-section-hint">Diese Werte erscheinen im Hero-Bereich der Website.</p>
        ${field('Servername', '<input type="text" id="g-name" />')}
        ${field('Java-IP', '<input type="text" id="g-ip" />', 'Trage hier später die echte IP ein, z. B. play.siltaria.net')}
        ${field('Bedrock-IP / Port', '<input type="text" id="g-ip-bedrock" />')}
        ${field('Versions-/Crossplay-Hinweis', '<input type="text" id="g-version" />')}
        ${field('Headline', '<input type="text" id="g-headline" />')}
        ${field('Claim / Untertitel', '<textarea id="g-claim"></textarea>')}
        ${field('Status-API URL (mcsrvstat.us)', '<input type="text" id="g-status-api" />', 'Wird für den Live-Online-Status verwendet, z.B. https://api.mcsrvstat.us/3/DEINE-IP')}
      </div>`;

    bindInput("#g-name", () => data.general.serverName, (v) => (data.general.serverName = v));
    bindInput("#g-ip", () => data.general.ip, (v) => (data.general.ip = v));
    bindInput("#g-ip-bedrock", () => data.general.ipBedrock, (v) => (data.general.ipBedrock = v));
    bindInput("#g-version", () => data.general.version, (v) => (data.general.version = v));
    bindInput("#g-headline", () => data.general.headline, (v) => (data.general.headline = v));
    bindTextarea("#g-claim", () => data.general.claim, (v) => (data.general.claim = v));
    bindInput("#g-status-api", () => data.general.statusApiUrl, (v) => (data.general.statusApiUrl = v));
  }

  function colorField(idBase, label, getValue, setValue) {
    return `<div class="field-group">
      <label>${label}</label>
      <div class="color-row">
        <input type="color" id="${idBase}-c" value="${getValue()}" />
        <input type="text" id="${idBase}-t" value="${getValue()}" />
      </div>
    </div>`;
  }

  function bindColorField(idBase, getValue, setValue) {
    const colorInput = document.getElementById(idBase + "-c");
    const textInput = document.getElementById(idBase + "-t");
    colorInput.addEventListener("input", () => {
      textInput.value = colorInput.value;
      setValue(colorInput.value);
      markDirty();
    });
    textInput.addEventListener("input", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(textInput.value)) colorInput.value = textInput.value;
      setValue(textInput.value);
      markDirty();
    });
  }

  function renderDesign(container) {
    const c = data.design.colors;
    const f = data.design.fonts;
    container.innerHTML = `
      <div class="tab-section">
        <h2>Farben</h2>
        <p class="tab-section-hint">Steuert das gesamte Farbschema der Website live.</p>
        <div class="two-col">
          ${colorField("d-bg", "Hintergrund", () => c.bg)}
          ${colorField("d-bgalt", "Hintergrund (Karten)", () => c.bgAlt)}
          ${colorField("d-accent", "Akzent (Gold/Amber)", () => c.accent)}
          ${colorField("d-jade", "Jade-Grün", () => c.jade)}
          ${colorField("d-text", "Text (Pergament)", () => c.text)}
        </div>
      </div>
      <div class="tab-section">
        <h2>Schriften</h2>
        <p class="tab-section-hint">Google-Font-Namen. Stelle sicher, dass die Schrift im &lt;head&gt; eingebunden ist.</p>
        ${field('Überschriften-Schrift', '<input type="text" id="d-font-heading" />')}
        ${field('Body-Schrift', '<input type="text" id="d-font-body" />')}
        ${field('Mono-Schrift (IP, Code)', '<input type="text" id="d-font-mono" />')}
      </div>
      <div class="tab-section">
        <h2>Layout</h2>
        ${field('Eckenradius (px)', '<input type="number" id="d-radius" min="0" max="32" />')}
      </div>`;

    bindColorField("d-bg", () => c.bg, (v) => (c.bg = v));
    bindColorField("d-bgalt", () => c.bgAlt, (v) => (c.bgAlt = v));
    bindColorField("d-accent", () => c.accent, (v) => (c.accent = v));
    bindColorField("d-jade", () => c.jade, (v) => (c.jade = v));
    bindColorField("d-text", () => c.text, (v) => (c.text = v));

    bindInput("#d-font-heading", () => f.heading, (v) => (f.heading = v));
    bindInput("#d-font-body", () => f.body, (v) => (f.body = v));
    bindInput("#d-font-mono", () => f.mono, (v) => (f.mono = v));
    bindInput("#d-radius", () => data.design.radius, (v) => (data.design.radius = v));
  }

  function renderAbout(container) {
    const a = data.about;
    container.innerHTML = `
      <div class="tab-section">
        <h2>Über-uns Text</h2>
        ${field('Titel', '<input type="text" id="a-title" />')}
        ${field('Text', '<textarea id="a-text" style="min-height:160px"></textarea>')}
      </div>
      <div class="tab-section">
        <h2>Schicht-Grafik Beschriftungen</h2>
        <p class="tab-section-hint">4 Labels für die Sediment-Schichten-Grafik (von oben nach unten).</p>
        <div class="two-col">
          ${field('Schicht 1', '<input type="text" id="a-l0" />')}
          ${field('Schicht 2', '<input type="text" id="a-l1" />')}
          ${field('Schicht 3', '<input type="text" id="a-l2" />')}
          ${field('Schicht 4', '<input type="text" id="a-l3" />')}
        </div>
      </div>`;

    bindInput("#a-title", () => a.title, (v) => (a.title = v));
    bindTextarea("#a-text", () => a.text, (v) => (a.text = v));
    if (!a.layerLabels) a.layerLabels = ["", "", "", ""];
    [0, 1, 2, 3].forEach((i) => bindInput(`#a-l${i}`, () => a.layerLabels[i], (v) => (a.layerLabels[i] = v)));
  }

  const ICON_OPTIONS = ["shield", "coin", "map", "team", "leaf", "star"];

  function renderFeatures(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>Feature-Karten</h2>
        <p class="tab-section-hint">Die 6 Karten im Features-Bereich.</p>
        <div id="features-list"></div>
        <button class="add-btn" id="add-feature">+ Feature hinzufügen</button>
      </div>`;

    const list = document.getElementById("features-list");

    function renderList() {
      list.innerHTML = "";
      data.features.forEach((f, i) => {
        const block = el(`<div class="card-block">
          <div class="card-block-header"><span>Feature ${i + 1}</span><button class="remove-btn">Entfernen</button></div>
          ${field('Icon', `<select class="f-icon">${ICON_OPTIONS.map((o) => `<option value="${o}" ${o === f.icon ? "selected" : ""}>${o}</option>`).join("")}</select>`)}
          ${field('Titel', `<input type="text" class="f-title" value="${escapeAttr(f.title)}" />`)}
          ${field('Beschreibung', `<textarea class="f-text">${escapeHtml(f.text)}</textarea>`)}
        </div>`);

        block.querySelector(".remove-btn").addEventListener("click", () => {
          data.features.splice(i, 1);
          markDirty();
          renderList();
        });
        block.querySelector(".f-icon").addEventListener("change", (e) => {
          f.icon = e.target.value;
          markDirty();
        });
        block.querySelector(".f-title").addEventListener("input", (e) => {
          f.title = e.target.value;
          markDirty();
        });
        block.querySelector(".f-text").addEventListener("input", (e) => {
          f.text = e.target.value;
          markDirty();
        });
        list.appendChild(block);
      });
    }
    renderList();

    document.getElementById("add-feature").addEventListener("click", () => {
      data.features.push({ icon: "star", title: "Neues Feature", text: "Beschreibung..." });
      markDirty();
      renderList();
    });
  }

  function renderRules(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>Regeln</h2>
        <p class="tab-section-hint">Nummerierte Kernregeln der Community.</p>
        <div id="rules-edit-list"></div>
        <button class="add-btn" id="add-rule">+ Regel hinzufügen</button>
      </div>`;

    const list = document.getElementById("rules-edit-list");

    function renderList() {
      list.innerHTML = "";
      data.rules.forEach((r, i) => {
        const block = el(`<div class="card-block">
          <div class="card-block-header"><span>Regel ${i + 1}</span><button class="remove-btn">Entfernen</button></div>
          <textarea class="r-text">${escapeHtml(r)}</textarea>
        </div>`);
        block.querySelector(".remove-btn").addEventListener("click", () => {
          data.rules.splice(i, 1);
          markDirty();
          renderList();
        });
        block.querySelector(".r-text").addEventListener("input", (e) => {
          data.rules[i] = e.target.value;
          markDirty();
        });
        list.appendChild(block);
      });
    }
    renderList();

    document.getElementById("add-rule").addEventListener("click", () => {
      data.rules.push("Neue Regel...");
      markDirty();
      renderList();
    });
  }

  function renderTeam(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>Teammitglieder</h2>
        <p class="tab-section-hint">Der Avatar wird automatisch über den Minecraft-Namen geladen.</p>
        <div id="team-edit-list"></div>
        <button class="add-btn" id="add-member">+ Teammitglied hinzufügen</button>
      </div>
      <div class="tab-section">
        <h2>Bewerbung (am Ende des Team-Bereichs)</h2>
        ${field('Titel', '<input type="text" id="rec-title" />')}
        ${field('Beschreibungstext', '<textarea id="rec-text"></textarea>')}
        <h3 style="font-size:1rem;margin-top:24px;">Rang-Anforderungen</h3>
        <div id="rec-req-list"></div>
        <button class="add-btn" id="add-req">+ Anforderung hinzufügen</button>
      </div>`;

    // team members
    const teamList = document.getElementById("team-edit-list");
    function renderTeamList() {
      teamList.innerHTML = "";
      data.team.forEach((m, i) => {
        const block = el(`<div class="card-block">
          <div class="card-block-header"><span>Mitglied ${i + 1}</span><button class="remove-btn">Entfernen</button></div>
          ${field('Minecraft-Name (für Avatar)', `<input type="text" class="m-name" value="${escapeAttr(m.name)}" />`)}
          ${field('Rang', `<input type="text" class="m-role" value="${escapeAttr(m.role)}" />`)}
          ${field('Kurzbeschreibung', `<textarea class="m-bio">${escapeHtml(m.bio || "")}</textarea>`)}
        </div>`);
        block.querySelector(".remove-btn").addEventListener("click", () => {
          data.team.splice(i, 1);
          markDirty();
          renderTeamList();
        });
        block.querySelector(".m-name").addEventListener("input", (e) => { m.name = e.target.value; markDirty(); });
        block.querySelector(".m-role").addEventListener("input", (e) => { m.role = e.target.value; markDirty(); });
        block.querySelector(".m-bio").addEventListener("input", (e) => { m.bio = e.target.value; markDirty(); });
        teamList.appendChild(block);
      });
    }
    renderTeamList();
    document.getElementById("add-member").addEventListener("click", () => {
      data.team.push({ name: "NeuesMitglied", role: "Helper", bio: "" });
      markDirty();
      renderTeamList();
    });

    // recruitment
    bindInput("#rec-title", () => data.recruitment.title, (v) => (data.recruitment.title = v));
    bindTextarea("#rec-text", () => data.recruitment.text, (v) => (data.recruitment.text = v));

    const reqList = document.getElementById("rec-req-list");
    function renderReqList() {
      reqList.innerHTML = "";
      data.recruitment.requirements.forEach((r, i) => {
        const block = el(`<div class="card-block">
          <div class="card-block-header"><span>Rang ${i + 1}</span><button class="remove-btn">Entfernen</button></div>
          ${field('Rang-Name', `<input type="text" class="rq-rang" value="${escapeAttr(r.rang)}" />`)}
          ${field('Anforderungen', `<textarea class="rq-anf">${escapeHtml(r.anforderungen)}</textarea>`)}
        </div>`);
        block.querySelector(".remove-btn").addEventListener("click", () => {
          data.recruitment.requirements.splice(i, 1);
          markDirty();
          renderReqList();
        });
        block.querySelector(".rq-rang").addEventListener("input", (e) => { r.rang = e.target.value; markDirty(); });
        block.querySelector(".rq-anf").addEventListener("input", (e) => { r.anforderungen = e.target.value; markDirty(); });
        reqList.appendChild(block);
      });
    }
    renderReqList();
    document.getElementById("add-req").addEventListener("click", () => {
      data.recruitment.requirements.push({ rang: "Neuer Rang", anforderungen: "Anforderungen beschreiben..." });
      markDirty();
      renderReqList();
    });
  }

  function renderDiscord(container) {
    const d = data.discord;
    container.innerHTML = `
      <div class="tab-section">
        <h2>Community / Discord</h2>
        ${field('Titel', '<input type="text" id="dc-title" />')}
        ${field('Text', '<textarea id="dc-text"></textarea>')}
        ${field('Discord-Einladungslink', '<input type="url" id="dc-link" placeholder="https://discord.gg/..." />')}
      </div>`;
    bindInput("#dc-title", () => d.title, (v) => (d.title = v));
    bindTextarea("#dc-text", () => d.text, (v) => (d.text = v));
    bindInput("#dc-link", () => d.link, (v) => (d.link = v));
  }

  function renderGallery(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>Galerie</h2>
        <p class="tab-section-hint">Platzhalter-Kacheln für Server-Screenshots. Beschriftung frei wählbar.</p>
        <div id="gallery-edit-list"></div>
        <button class="add-btn" id="add-gallery">+ Bild-Platzhalter hinzufügen</button>
      </div>`;

    const list = document.getElementById("gallery-edit-list");
    function renderList() {
      list.innerHTML = "";
      data.gallery.forEach((g, i) => {
        const block = el(`<div class="card-block">
          <div class="card-block-header"><span>Bild ${i + 1}</span><button class="remove-btn">Entfernen</button></div>
          ${field('Beschriftung', `<input type="text" class="gl-label" value="${escapeAttr(g.label)}" />`)}
        </div>`);
        block.querySelector(".remove-btn").addEventListener("click", () => {
          data.gallery.splice(i, 1);
          markDirty();
          renderList();
        });
        block.querySelector(".gl-label").addEventListener("input", (e) => { g.label = e.target.value; markDirty(); });
        list.appendChild(block);
      });
    }
    renderList();
    document.getElementById("add-gallery").addEventListener("click", () => {
      data.gallery.push({ label: "Neues Bild" });
      markDirty();
      renderList();
    });
  }

  function renderFaqTab(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>FAQ</h2>
        <div id="faq-edit-list"></div>
        <button class="add-btn" id="add-faq">+ Frage hinzufügen</button>
      </div>`;

    const list = document.getElementById("faq-edit-list");
    function renderList() {
      list.innerHTML = "";
      data.faq.forEach((item, i) => {
        const block = el(`<div class="card-block">
          <div class="card-block-header"><span>Frage ${i + 1}</span><button class="remove-btn">Entfernen</button></div>
          ${field('Frage', `<input type="text" class="fq-q" value="${escapeAttr(item.q)}" />`)}
          ${field('Antwort', `<textarea class="fq-a">${escapeHtml(item.a)}</textarea>`)}
        </div>`);
        block.querySelector(".remove-btn").addEventListener("click", () => {
          data.faq.splice(i, 1);
          markDirty();
          renderList();
        });
        block.querySelector(".fq-q").addEventListener("input", (e) => { item.q = e.target.value; markDirty(); });
        block.querySelector(".fq-a").addEventListener("input", (e) => { item.a = e.target.value; markDirty(); });
        list.appendChild(block);
      });
    }
    renderList();
    document.getElementById("add-faq").addEventListener("click", () => {
      data.faq.push({ q: "Neue Frage?", a: "Antwort..." });
      markDirty();
      renderList();
    });
  }

  function renderPrivacy(container) {
    const p = data.privacy;
    container.innerHTML = `
      <div class="tab-section">
        <h2>Datenschutzerklärung</h2>
        <p class="tab-section-hint">Wird ganz unten auf der Website angezeigt. Bitte vor dem produktiven Einsatz rechtlich prüfen lassen.</p>
        ${field('Titel', '<input type="text" id="pv-title" />')}
        ${field('Text', '<textarea id="pv-text" style="min-height:280px"></textarea>')}
      </div>`;
    bindInput("#pv-title", () => p.title, (v) => (p.title = v));
    bindTextarea("#pv-text", () => p.text, (v) => (p.text = v));
  }

  function renderPassword(container) {
    container.innerHTML = `
      <div class="tab-section">
        <h2>Admin-Passwort ändern</h2>
        ${field('Aktuelles Passwort', '<input type="password" id="pw-current" />')}
        ${field('Neues Passwort', '<input type="password" id="pw-new" />', 'Mindestens 6 Zeichen.')}
        <button class="btn btn-accent" id="pw-submit">Passwort ändern</button>
        <p class="login-error" id="pw-error" style="margin-top:14px;"></p>
        <p class="field-hint" id="pw-success" style="color:var(--jade);"></p>
      </div>`;

    document.getElementById("pw-submit").addEventListener("click", async () => {
      const current = document.getElementById("pw-current").value;
      const next = document.getElementById("pw-new").value;
      const errorEl = document.getElementById("pw-error");
      const successEl = document.getElementById("pw-success");
      errorEl.textContent = "";
      successEl.textContent = "";
      try {
        const res = await fetch("/api/admin/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Fehler.");
        successEl.textContent = "Passwort erfolgreich geändert.";
        document.getElementById("pw-current").value = "";
        document.getElementById("pw-new").value = "";
      } catch (e) {
        errorEl.textContent = e.message;
      }
    });
  }

  const RENDERERS = {
    general: renderGeneral,
    design: renderDesign,
    about: renderAbout,
    features: renderFeatures,
    rules: renderRules,
    team: renderTeam,
    discord: renderDiscord,
    gallery: renderGallery,
    faq: renderFaqTab,
    privacy: renderPrivacy,
    password: renderPassword,
  };

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function renderTab(tab) {
    activeTab = tab;
    document.getElementById("tab-title").textContent = TAB_TITLES[tab];
    document.querySelectorAll(".sidebar-nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    const container = document.getElementById("tab-content");
    RENDERERS[tab](container);
  }

  function setupSidebar() {
    document.querySelectorAll(".sidebar-nav button").forEach((btn) => {
      btn.addEventListener("click", () => renderTab(btn.dataset.tab));
    });
  }

  // ---------- boot ----------

  async function showDashboard() {
    document.getElementById("login-screen").hidden = true;
    document.getElementById("dashboard").hidden = false;
    await loadData();
    setupSidebar();
    renderTab("general");
    document.getElementById("save-btn").addEventListener("click", saveData);
    document.getElementById("logout-btn").addEventListener("click", logout);

    window.addEventListener("beforeunload", (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  async function init() {
    const isAdmin = await checkAuth();
    if (isAdmin) {
      await showDashboard();
      return;
    }
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = document.getElementById("login-password").value;
      const errorEl = document.getElementById("login-error");
      errorEl.textContent = "";
      try {
        await login(pw);
        await showDashboard();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
