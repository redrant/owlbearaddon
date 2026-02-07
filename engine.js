const DB_KEY = "MYDASH_V2";

let uid;
let character;
let state = { dashes: {}, log: [] };
let currentId = null;

OBR.onReady(async () => {
  uid = await OBR.player.getId();
  const meta = await OBR.player.getMetadata();
  character = meta?.character?.name || await OBR.player.getName();

  const sceneMeta = await OBR.scene.getMetadata();
  state = sceneMeta[DB_KEY] || state;

  OBR.scene.onMetadataChange(m => {
    if (m[DB_KEY]) {
      state = m[DB_KEY];
      render();
    }
  });

  if (Object.keys(state.dashes).length === 0) {
    seedDemo();
    save();
  }

  render();
});

function save() {
  OBR.scene.setMetadata({ [DB_KEY]: state });
}

function seedDemo() {
  state.dashes.demo = {
    id: "demo",
    name: "Ficha Demo",
    content:
`FUE=10
[+] Espada larga 1d20+FUE
[note=Hechizo de Fuego]
Daño 2d6 fuego mágico  
Consume 1 mana
[/note]`,
    ownerUid: null,
    ownerChar: null
  };
}

function render() {
  renderList();
  renderDetails();
  renderLog();
}

function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  Object.values(state.dashes).forEach(d => {
    const div = document.createElement("div");
    div.className = "card" + (d.ownerUid && d.ownerUid !== uid ? " locked" : "");
    div.textContent = d.name;
    div.onclick = () => {
      currentId = d.id;
      renderDetails();
    };
    list.appendChild(div);
  });
}

function renderDetails() {
  const box = document.getElementById("details");
  if (!currentId) {
    box.textContent = "Selecciona un Dash";
    return;
  }

  const d = state.dashes[currentId];
  const isOwner = d.ownerUid === uid;

  box.innerHTML = `
    <h3>${d.name}</h3>
    <button id="ownBtn"></button>
    ${isOwner
      ? `<textarea id="editor"></textarea>`
      : `<div id="viewer"></div>`
    }
  `;

  document.getElementById("ownBtn").textContent =
    d.ownerUid ? (isOwner ? "Liberar" : "Ocupado") : "Ownear";

  document.getElementById("ownBtn").onclick = () => toggleOwner(d);

  if (isOwner) {
    const ta = document.getElementById("editor");
    ta.value = d.content;
    ta.oninput = () => {
      d.content = ta.value;
      pushLog(`${character} edita ${d.name}`);
      save();
    };
  } else {
    renderViewer(d);
  }
}

function renderViewer(d) {
  const viewer = document.getElementById("viewer");
  viewer.innerHTML = "";

  const lines = d.content.split("\n");

  lines.forEach(line => {
    if (line.startsWith("[note=")) {
      const title = line.match(/\[note=(.*?)\]/)[1];
      const content = [];
      let collecting = true;

      while (collecting) {
        line = lines.shift();
        if (line?.includes("[/note]")) {
          collecting = false;
        } else {
          content.push(line);
        }
      }

      const btn = document.createElement("span");
      btn.className = "block-note";
      btn.textContent = title;
      btn.onclick = () => openNote(title, content.join("\n"));
      viewer.appendChild(btn);
    } else {
      const p = document.createElement("div");
      p.textContent = line;
      viewer.appendChild(p);
    }
  });
}

function toggleOwner(d) {
  if (d.ownerUid && d.ownerUid !== uid) return;

  d.ownerUid = d.ownerUid ? null : uid;
  d.ownerChar = d.ownerUid ? character : null;

  pushLog(`${character} ${d.ownerUid ? "reclama" : "libera"} ${d.name}`);
  save();
}

function pushLog(text) {
  state.log.unshift({ t: Date.now(), text });
  state.log = state.log.slice(0, 40);
}

function renderLog() {
  const log = document.getElementById("log");
  log.innerHTML = state.log
    .map(l => `<div>[${new Date(l.t).toLocaleTimeString()}] ${l.text}</div>`)
    .join("");
}

function openNote(title, body) {
  document.getElementById("note-title").textContent = title;
  document.getElementById("note-body").textContent = body;
  document.getElementById("note-overlay").style.display = "flex";
}

function closeNote() {
  document.getElementById("note-overlay").style.display = "none";
}
