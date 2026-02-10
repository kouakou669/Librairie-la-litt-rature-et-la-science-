/* DECO AIDE — Enregistrement local (localStorage)
   - Ajout / modification / suppression
   - Aperçu + impression
   - Copie messages 00h
   - BT/BTS inclus + Filière (obligatoire si BT/BTS)
*/

const STORAGE_KEY = "decoaide_fiches_v1";

const form = document.getElementById("formFiche");
const toast = document.getElementById("toast");
const preview = document.getElementById("preview");
const list = document.getElementById("list");

const btnReset = document.getElementById("btnReset");
const btnSave = document.getElementById("btnSave");
const btnDeleteAll = document.getElementById("btnDeleteAll");
const btnPrintPreview = document.getElementById("btnPrintPreview");

const yearEl = document.getElementById("year");

const examenEl = document.getElementById("examen");
const filiereEl = document.getElementById("filiere");
const filiereHint = document.getElementById("filiereHint");

yearEl.textContent = String(new Date().getFullYear());

let editId = null;
let selectedId = null;

function nowISO(){
  return new Date().toISOString();
}

function uid(){
  return "DA-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function loadAll(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  }catch{
    return [];
  }
}

function saveAll(items){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function showToast(msg){
  toast.textContent = msg;
  setTimeout(() => {
    if (toast.textContent === msg) toast.textContent = "";
  }, 2400);
}

function updateFiliereRule(){
  const ex = (examenEl.value || "").trim();
  const need = (ex === "BT" || ex === "BTS");

  filiereEl.required = need;

  if (need){
    filiereHint.textContent = "Obligatoire pour BT/BTS ✅";
  }else{
    filiereHint.textContent = "Optionnel (obligatoire si BT/BTS).";
  }
}

function getFormData(){
  const civilite = document.getElementById("civilite").value.trim();
  const operation = document.getElementById("operation").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const prenom = document.getElementById("prenom").value.trim();

  const examen = document.getElementById("examen").value.trim();
  const filiere = document.getElementById("filiere").value.trim();

  const serie = document.getElementById("serie").value.trim();
  const ville = document.getElementById("ville").value.trim();
  const matricule = document.getElementById("matricule").value.trim();
  const lv1 = document.getElementById("lv1").value.trim();
  const lv2 = document.getElementById("lv2").value.trim();
  const montant = document.getElementById("montant").value.trim();
  const urgence = document.getElementById("urgence").value.trim();

  return {
    civilite,
    operation,
    nom,
    prenom,
    examen,
    filiere: filiere || "",
    serie,
    ville,
    matricule,
    lv1,
    lv2: lv2 || "",
    montant,
    urgence
  };
}

function fillForm(item){
  document.getElementById("civilite").value = item.civilite || "Mr";
  document.getElementById("operation").value = item.operation || "Inscription";
  document.getElementById("nom").value = item.nom || "";
  document.getElementById("prenom").value = item.prenom || "";

  document.getElementById("examen").value = item.examen || "BEPC";
  document.getElementById("filiere").value = item.filiere || "";

  document.getElementById("serie").value = item.serie || "";
  document.getElementById("ville").value = item.ville || "";
  document.getElementById("matricule").value = item.matricule || "";
  document.getElementById("lv1").value = item.lv1 || "Anglais";
  document.getElementById("lv2").value = item.lv2 || "";
  document.getElementById("montant").value = item.montant || "";
  document.getElementById("urgence").value = item.urgence || "";

  updateFiliereRule();
}

function clearForm(){
  form.reset();
  editId = null;
  btnSave.textContent = "Enregistrer la fiche";
  updateFiliereRule();
}

function makeRow(k, v){
  const row = document.createElement("div");
  row.className = "row";

  const left = document.createElement("div");
  left.className = "k";
  left.textContent = k;

  const right = document.createElement("div");
  right.className = "v";
  right.textContent = v || "—";

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function ficheElement(item){
  const wrap = document.createElement("div");
  wrap.className = "fiche";

  const head = document.createElement("div");
  head.className = "fiche-header";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = "DECO — FICHE D’INSCRIPTION";

  const meta = document.createElement("div");
  meta.className = "meta";
  const d = new Date(item.createdAt || Date.now());
  meta.textContent = `ID: ${item.id} • ${d.toLocaleString("fr-FR")}`;

  head.appendChild(title);
  head.appendChild(meta);

  const body = document.createElement("div");
  body.className = "fiche-body";

  const full = `${item.civilite || ""} ${item.nom || ""} ${item.prenom || ""}`.trim();

  body.appendChild(makeRow("CANDIDAT", full));
  body.appendChild(makeRow("OPÉRATION", item.operation));

  body.appendChild(makeRow("NOM", item.nom));
  body.appendChild(makeRow("PRÉNOM", item.prenom));

  body.appendChild(makeRow("EXAMEN / NIVEAU", item.examen || "—"));
  body.appendChild(makeRow("FILIÈRE / OPTION", item.filiere || "—"));

  body.appendChild(makeRow("SÉRIE", item.serie));
  body.appendChild(makeRow("VILLE", item.ville));
  body.appendChild(makeRow("MATRICULE", item.matricule));
  body.appendChild(makeRow("LV1", item.lv1));
  body.appendChild(makeRow("LV2", item.lv2 || "Aucune"));
  body.appendChild(makeRow("PREMIER MONTANT (FCFA)", item.montant));
  body.appendChild(makeRow("TEL. URGENCE", item.urgence));

  wrap.appendChild(head);
  wrap.appendChild(body);

  return wrap;
}

function renderPreview(item){
  preview.innerHTML = "";
  preview.classList.remove("empty");
  preview.appendChild(ficheElement(item));
  btnPrintPreview.disabled = false;
}

function renderList(items){
  list.innerHTML = "";

  if (!items.length){
    list.classList.add("empty");
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Aucune inscription pour l’instant.";
    list.appendChild(p);
    return;
  }

  list.classList.remove("empty");

  // Dernières en premier
  const sorted = [...items].sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  sorted.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const top = document.createElement("div");
    top.className = "card-title";

    const h = document.createElement("h3");
    h.style.margin = "0 0 6px";
    h.textContent = `${(item.civilite || "Mr")} ${(item.nom || "").toUpperCase()} ${item.prenom || ""}`.trim();

    const p = document.createElement("p");
    p.className = "muted";
    p.textContent =
      `${item.operation || "Inscription"} • ${item.examen || "—"} • ${item.ville || "—"} • Série: ${item.serie || "—"} • ID: ${item.id}`;

    top.appendChild(h);
    top.appendChild(p);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const btnView = document.createElement("button");
    btnView.className = "btn btn-ghost";
    btnView.type = "button";
    btnView.textContent = "Voir";
    btnView.addEventListener("click", () => {
      selectedId = item.id;
      renderPreview(item);
      showToast("Aperçu chargé ✅");
    });

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-ghost";
    btnEdit.type = "button";
    btnEdit.textContent = "Modifier";
    btnEdit.addEventListener("click", () => {
      editId = item.id;
      fillForm(item);
      btnSave.textContent = "Mettre à jour la fiche";
      showToast("Mode modification ✍️");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const btnPrint = document.createElement("button");
    btnPrint.className = "btn btn-ghost";
    btnPrint.type = "button";
    btnPrint.textContent = "Imprimer";
    btnPrint.addEventListener("click", () => printOne(item));

    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-danger";
    btnDel.type = "button";
    btnDel.textContent = "Supprimer";
    btnDel.addEventListener("click", () => {
      const all = loadAll().filter(x => x.id !== item.id);
      saveAll(all);

      if (selectedId === item.id){
        preview.innerHTML = `<p class="muted">Aucune fiche sélectionnée pour le moment.</p>`;
        preview.classList.add("empty");
        btnPrintPreview.disabled = true;
        selectedId = null;
      }

      renderList(all);
      showToast("Fiche supprimée 🗑️");
    });

    actions.appendChild(btnView);
    actions.appendChild(btnEdit);
    actions.appendChild(btnPrint);
    actions.appendChild(btnDel);

    card.appendChild(top);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

function printOne(item){
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;

  const d = new Date(item.createdAt || Date.now()).toLocaleString("fr-FR");
  const full = `${item.civilite || ""} ${item.nom || ""} ${item.prenom || ""}`.trim();

  w.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DECO AIDE — Fiche</title>
<style>
  body{ font-family: Arial, sans-serif; padding: 20px; }
  .bar{ height: 8px; background: linear-gradient(90deg, #ff7a18, #ffffff, #18c37e); margin-bottom: 16px; }
  h1{ margin: 0 0 6px; font-size: 18px; }
  .meta{ color:#555; font-size: 12px; margin-bottom: 14px; }
  .box{ border: 1px solid #ddd; border-radius: 10px; overflow: hidden; }
  .head{ padding: 10px 12px; background: #f7f7f7; font-weight: 700; }
  .row{ display:flex; justify-content: space-between; padding: 9px 12px; border-top: 1px solid #eee; }
  .k{ color:#666; font-size: 12px; }
  .v{ font-weight: 700; }
</style>
</head>
<body>
  <div class="bar"></div>
  <h1>DECO AIDE — FICHE D’INSCRIPTION</h1>
  <div class="meta">Candidat: <strong>${escapeHtml(full)}</strong> • ID: ${escapeHtml(item.id)} • ${escapeHtml(d)}</div>

  <div class="box">
    <div class="head">Informations</div>
    ${printRow("OPÉRATION", item.operation)}
    ${printRow("NOM", item.nom)}
    ${printRow("PRÉNOM", item.prenom)}
    ${printRow("EXAMEN / NIVEAU", item.examen || "—")}
    ${printRow("FILIÈRE / OPTION", item.filiere || "—")}
    ${printRow("SÉRIE", item.serie)}
    ${printRow("VILLE", item.ville)}
    ${printRow("MATRICULE", item.matricule)}
    ${printRow("LV1", item.lv1)}
    ${printRow("LV2", item.lv2 || "Aucune")}
    ${printRow("PREMIER MONTANT (FCFA)", item.montant)}
    ${printRow("TEL. URGENCE", item.urgence)}
  </div>

  <script>
    window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };
  </script>
</body>
</html>`);

  w.document.close();
}

function printRow(k, v){
  return `<div class="row"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v || "—")}</div></div>`;
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* Events */
examenEl.addEventListener("change", updateFiliereRule);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  updateFiliereRule(); // applique la règle BT/BTS
  const data = getFormData();

  // Sécurité : si BT/BTS et filière vide, stop
  if ((data.examen === "BT" || data.examen === "BTS") && !data.filiere){
    showToast("Filière obligatoire pour BT/BTS ❗");
    filiereEl.focus();
    return;
  }

  const all = loadAll();

  if (editId){
    const updated = all.map(x => {
      if (x.id !== editId) return x;
      return { ...x, ...data, updatedAt: nowISO() };
    });
    saveAll(updated);
    renderList(updated);

    const item = updated.find(x => x.id === editId);
    if (item){
      selectedId = item.id;
      renderPreview(item);
    }

    showToast("Fiche mise à jour ✅");
    clearForm();
    return;
  }

  const item = {
    id: uid(),
    createdAt: nowISO(),
    ...data
  };

  all.push(item);
  saveAll(all);
  renderList(all);
  selectedId = item.id;
  renderPreview(item);
  showToast("Fiche enregistrée ✅");
  clearForm();
});

btnReset.addEventListener("click", () => {
  clearForm();
  showToast("Formulaire vidé.");
});

btnDeleteAll.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  selectedId = null;
  editId = null;
  preview.innerHTML = `<p class="muted">Aucune fiche sélectionnée pour le moment.</p>`;
  preview.classList.add("empty");
  btnPrintPreview.disabled = true;
  renderList([]);
  showToast("Tout supprimé (local) 🗑️");
});

btnPrintPreview.addEventListener("click", () => {
  if (!selectedId) return;
  const all = loadAll();
  const item = all.find(x => x.id === selectedId);
  if (item) printOne(item);
});

/* Copier les messages 00h */
document.querySelectorAll(".copy").forEach(btn => {
  btn.addEventListener("click", async () => {
    const sel = btn.getAttribute("data-copy");
    const el = sel ? document.querySelector(sel) : null;
    const text = el ? el.textContent : "";
    try{
      await navigator.clipboard.writeText(text);
      showToast("Message copié 📋");
    }catch{
      showToast("Copie impossible (autorisation refusée).");
    }
  });
});

/* Initial render */
updateFiliereRule();
renderList(loadAll());
