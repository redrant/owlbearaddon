// ===== CONFIG =====
const DB_KEY = "MYDASH_V2";

// ===== STATE =====
let uid, character;
let state = { dashes:{}, log:[] };
let current = null;

// ===== INIT =====
OBR.onReady(async()=>{
  uid = await OBR.player.getId();
  const meta = await OBR.player.getMetadata();
  character = meta?.character?.name || await OBR.player.getName();

  OBR.scene.onMetadataChange(m=>{
    state = m[DB_KEY] || state;
    render();
  });

  const sceneMeta = await OBR.scene.getMetadata();
  state = sceneMeta[DB_KEY] || state;

  if(Object.keys(state.dashes).length===0){
    createDemo();
  }
  render();
});

// ===== SAVE =====
function save(){
  OBR.scene.setMetadata({ [DB_KEY]: state });
}

// ===== DEMO =====
function createDemo(){
  state.dashes.demo = {
    id:"demo",
    name:"Ficha Demo",
    content:"FUE=10\n[+] Espada 1d20+FUE\n[note=Hechizo]Daño 2d6  fuego mágico[/note]",
    ownerUid:null,
    ownerChar:null
  };
  save();
}

// ===== RENDER =====
function render(){
  renderList();
  renderLog();
  if(current) renderDetails(current);
}

function renderList(){
  const list = document.getElementById("list");
  list.innerHTML="";
  Object.values(state.dashes).forEach(d=>{
    const div=document.createElement("div");
    div.className="card"+(d.ownerUid&&d.ownerUid!==uid?" locked":"");
    div.innerHTML=`<b>${d.name}</b><br><small>${d.ownerChar||"Sin dueño"}</small>`;
    div.onclick=()=>{ current=d.id; renderDetails(d.id); };
    list.appendChild(div);
  });
}

function renderDetails(id){
  const d=state.dashes[id];
  const isOwner=d.ownerUid===uid;
  const det=document.getElementById("details");

  det.innerHTML=\`
  <h3>\${d.name}</h3>
  <button onclick="toggleOwner('\${id}')">\${d.ownerUid?(isOwner?'Liberar':'Ocupado'):'Ownear'}</button>
  <pre contenteditable="\${isOwner}" oninput="updateContent('\${id}',this.innerText)">\${renderPreview(d.content)}</pre>
  \`;
}

// ===== OWNERSHIP =====
function toggleOwner(id){
  const d=state.dashes[id];
  if(d.ownerUid && d.ownerUid!==uid) return;
  d.ownerUid = d.ownerUid ? null : uid;
  d.ownerChar = d.ownerUid ? character : null;
  save();
}

function updateContent(id,txt){
  const d=state.dashes[id];
  if(d.ownerUid!==uid) return;
  d.content=txt;
  save();
}

// ===== PREVIEW =====
function renderPreview(txt){
  return txt
  .replace(/\[note=(.*?)\]([\s\S]*?)\[\/note\]/g,
    (_,t,c)=>`<span class='block-note' onclick="openNote('${t}','${encodeURIComponent(c)}')">${t}</span>`
  );
}

// ===== NOTES =====
function openNote(t,c){
  document.getElementById("note-title").innerText=t;
  document.getElementById("note-body").innerText=decodeURIComponent(c).replace(/  /g,'\n');
  document.getElementById("note-overlay").style.display="flex";
}
function closeNote(){
  document.getElementById("note-overlay").style.display="none";
}

// ===== LOG =====
function pushLog(entry){
  state.log.unshift(entry);
  state.log=state.log.slice(0,40);
}

function renderLog(){
  const log=document.getElementById("log");
  log.innerHTML=state.log.map(l=>{
    return `<div>[${new Date(l.t).toLocaleTimeString()}] <b>${l.char}</b> ${l.action}</div>`;
  }).join("");
}
