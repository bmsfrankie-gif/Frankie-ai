const STORE_KEY='frankieAI.v1';
const defaultData={prompts:[],settings:{theme:'dark'}};
let data=loadData();
let deferredInstallPrompt=null;

const tools=[
  ['✨ Improve Prompt','Turn a rough request into a structured, high-quality prompt.','improve'],
  ['🛠 Troubleshoot','Build a diagnostic prompt from an error or issue.','troubleshoot'],
  ['🔬 Deep Research','Create a rigorous research prompt with sources and verification.','research'],
  ['✍️ Rewrite','Create a rewrite prompt with tone and clarity controls.','rewrite'],
  ['📋 SOP Builder','Turn notes into a step-by-step SOP/checklist prompt.','sop'],
  ['⚖️ Second Opinion','Ask another model to challenge an existing answer.','challenge'],
  ['🧾 Summarize','Create a concise but complete summarization prompt.','summarize'],
  ['🧠 Explain','Create a clear explanation/teaching prompt.','explain']
];

const providers=[
  ['ChatGPT','OpenAI','https://chatgpt.com/'],
  ['Claude','Anthropic','https://claude.ai/new'],
  ['Gemini','Google','https://gemini.google.com/app'],
  ['Perplexity','Research','https://www.perplexity.ai/'],
  ['Grok','xAI','https://grok.com/']
];

function $(id){return document.getElementById(id)}
function loadData(){try{return {...defaultData,...JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}}catch{return structuredClone(defaultData)}}
function saveData(){localStorage.setItem(STORE_KEY,JSON.stringify(data));updateStats();renderVault()}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),1700)}
function nav(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(name+'View').classList.add('active');document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));window.scrollTo({top:0,behavior:'smooth'});if(name==='vault')renderVault();}
function updateStats(){ $('promptCount').textContent=data.prompts.length; $('favoriteCount').textContent=data.prompts.filter(p=>p.favorite).length; $('versionCount').textContent=data.prompts.reduce((a,p)=>a+(p.versions?.length||0),0)}
function escapeHTML(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function parseTags(s){return s.split(',').map(x=>x.trim()).filter(Boolean)}
function variablesIn(text){return [...new Set([...text.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g)].map(m=>m[1]))]}

function renderVault(){
  const q=($('vaultSearch')?.value||'').toLowerCase(); const fav=$('vaultFilter')?.value==='favorites';
  const list=data.prompts.filter(p=>{const hay=[p.title,p.folder,(p.tags||[]).join(' '),p.body].join(' ').toLowerCase();return (!q||hay.includes(q))&&(!fav||p.favorite)});
  $('vaultList').innerHTML=list.length?list.map(p=>`<article class="prompt-card"><h3>${p.favorite?'★ ':''}${escapeHTML(p.title||'Untitled')}</h3><div class="meta">${escapeHTML(p.folder||'Unfiled')} · ${(p.tags||[]).map(escapeHTML).join(', ')||'No tags'} · ${(p.versions?.length||0)} versions</div><div class="prompt-actions"><button class="secondary" onclick="editPrompt('${p.id}')">Edit</button><button class="ghost" onclick="copyPrompt('${p.id}')">Copy</button><button class="ghost" onclick="toggleFav('${p.id}')">${p.favorite?'Unfavorite':'Favorite'}</button><button class="ghost" onclick="sendPrompt('${p.id}')">Launch</button><button class="danger" onclick="deletePrompt('${p.id}')">Delete</button></div></article>`).join(''):'<div class="card muted">No prompts here yet. Build one in Prompt Studio.</div>';
}

window.editPrompt=id=>{const p=data.prompts.find(x=>x.id===id);if(!p)return;$('editingId').value=p.id;$('promptTitle').value=p.title;$('promptFolder').value=p.folder||'';$('promptTags').value=(p.tags||[]).join(', ');$('promptBody').value=p.body;$('favoritePrompt').textContent=p.favorite?'★ Favorited':'☆ Favorite';renderVersions(p);nav('studio')}
window.copyPrompt=async id=>{const p=data.prompts.find(x=>x.id===id);if(p){await copyText(p.body);toast('Prompt copied')}}
window.toggleFav=id=>{const p=data.prompts.find(x=>x.id===id);if(p){p.favorite=!p.favorite;saveData();}}
window.deletePrompt=id=>{if(confirm('Delete this prompt?')){data.prompts=data.prompts.filter(x=>x.id!==id);saveData();}}
window.sendPrompt=id=>{const p=data.prompts.find(x=>x.id===id);if(p){$('launchPrompt').value=p.body;nav('launch')}}

function clearStudio(){['editingId','promptTitle','promptFolder','promptTags','promptBody'].forEach(id=>$(id).value='');$('favoritePrompt').textContent='☆ Favorite';$('variablePanel').classList.add('hidden');$('versionPanel').classList.add('hidden')}
function savePrompt(){const title=$('promptTitle').value.trim()||'Untitled Prompt';const body=$('promptBody').value.trim();if(!body){toast('Add a prompt first');return;}const id=$('editingId').value;let p=data.prompts.find(x=>x.id===id);if(p){p.versions=p.versions||[];if(p.body!==body)p.versions.unshift({id:uid(),body:p.body,at:new Date().toISOString()});p.title=title;p.folder=$('promptFolder').value.trim();p.tags=parseTags($('promptTags').value);p.body=body;p.updatedAt=new Date().toISOString();toast('Prompt updated');}else{p={id:uid(),title,folder:$('promptFolder').value.trim(),tags:parseTags($('promptTags').value),body,favorite:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),versions:[]};data.prompts.unshift(p);$('editingId').value=p.id;toast('Prompt saved');}saveData();renderVersions(p)}
function renderVersions(p){const panel=$('versionPanel');const list=$('versionList');if(!p?.versions?.length){panel.classList.add('hidden');return;}panel.classList.remove('hidden');list.innerHTML=p.versions.map(v=>`<div class="prompt-card"><div class="meta">${new Date(v.at).toLocaleString()}</div><div class="prompt-actions"><button class="secondary" onclick="restoreVersion('${p.id}','${v.id}')">Restore</button><button class="ghost" onclick="copyVersion('${p.id}','${v.id}')">Copy</button></div></div>`).join('')}
window.restoreVersion=(pid,vid)=>{const p=data.prompts.find(x=>x.id===pid);const v=p?.versions?.find(x=>x.id===vid);if(p&&v){p.versions.unshift({id:uid(),body:p.body,at:new Date().toISOString()});p.body=v.body;p.updatedAt=new Date().toISOString();saveData();editPrompt(pid);toast('Version restored')}}
window.copyVersion=async(pid,vid)=>{const p=data.prompts.find(x=>x.id===pid);const v=p?.versions?.find(x=>x.id===vid);if(v){await copyText(v.body);toast('Version copied')}}

function showVariables(){const text=$('promptBody').value;const vars=variablesIn(text);$('variablePanel').classList.remove('hidden');if(!vars.length){$('variableFields').innerHTML='<div class="muted">No {{variables}} found. The rendered prompt is ready as-is.</div>';$('renderedPrompt').value=text;return;}$('variableFields').innerHTML=vars.map(v=>`<label>${escapeHTML(v)}<input data-var="${escapeHTML(v)}" placeholder="Enter ${escapeHTML(v)}" /></label>`).join('');document.querySelectorAll('[data-var]').forEach(i=>i.addEventListener('input',renderFilled));renderFilled()}
function renderFilled(){let out=$('promptBody').value;document.querySelectorAll('[data-var]').forEach(i=>{out=out.replaceAll(new RegExp(`{{\\s*${i.dataset.var.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*}}`,'g'),i.value)});$('renderedPrompt').value=out}

function toolPrompt(type,input){const base=input.trim();const map={
 improve:`You are an expert prompt engineer. Improve the user's rough request into a high-quality prompt. Preserve intent, add only useful structure, and do not invent facts. Include: role, objective, context, constraints, desired output format, verification requirements, and clarifying assumptions only when necessary. Return the improved prompt first, then a short note explaining the most important changes.\n\nROUGH REQUEST:\n${base}`,
 troubleshoot:`Act as a senior technical support engineer. Diagnose the issue below methodically. Separate confirmed facts from hypotheses. Start with the safest, highest-value checks. Avoid destructive steps unless clearly labeled and justified. Ask only questions that materially change the diagnosis. Produce: likely causes, ordered troubleshooting steps, what evidence each step gathers, escalation criteria, and a concise customer-safe summary.\n\nISSUE / ERROR:\n${base}`,
 research:`Conduct rigorous research on the topic below. Prefer current primary and authoritative sources. Distinguish verified facts, expert interpretation, and uncertainty. Cross-check consequential claims, note conflicting evidence, include dates, and cite sources next to claims. Finish with key takeaways and open questions.\n\nTOPIC:\n${base}`,
 rewrite:`Rewrite the text below for clarity, natural tone, and readability while preserving the original meaning. Remove unnecessary filler, keep factual content intact, and avoid sounding overly formal or robotic. Provide the polished version only unless a meaningful ambiguity requires a note.\n\nTEXT:\n${base}`,
 sop:`Turn the notes below into a practical SOP. Use a clear title, purpose, prerequisites, numbered procedure, decision points, validation checks, warnings where needed, and a completion checklist. Do not invent system-specific steps not supported by the notes.\n\nNOTES:\n${base}`,
 challenge:`Critically review the material below as an independent second opinion. Identify unsupported assumptions, factual gaps, alternative explanations, missing evidence, and places where confidence is too high. Preserve what is well supported. Finish with a revised conclusion calibrated to the evidence.\n\nMATERIAL TO REVIEW:\n${base}`,
 summarize:`Summarize the content below accurately and efficiently. Preserve decisions, numbers, names, deadlines, risks, and action items. Separate the main summary from action items and unresolved questions. Do not add information that is not present.\n\nCONTENT:\n${base}`,
 explain:`Explain the material below clearly to an intelligent non-expert. Start with the plain-English answer, then explain how it works, why it matters, and give a concrete example. Define unavoidable jargon and flag any important caveats.\n\nMATERIAL:\n${base}`};return map[type]||base}

async function copyText(text){try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}}

function applyTheme(){const t=data.settings?.theme||'dark';document.body.classList.remove('light');if(t==='light'||(t==='system'&&matchMedia('(prefers-color-scheme: light)').matches))document.body.classList.add('light');$('themeSelect').value=t}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`frankie-ai-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}

function init(){
  document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));
  $('newPromptFromVault').onclick=()=>{clearStudio();nav('studio')};$('clearStudio').onclick=clearStudio;$('savePrompt').onclick=savePrompt;$('previewPrompt').onclick=showVariables;$('closeVariables').onclick=()=>$('variablePanel').classList.add('hidden');
  $('favoritePrompt').onclick=()=>{const id=$('editingId').value;const p=data.prompts.find(x=>x.id===id);if(!p){toast('Save the prompt first');return;}p.favorite=!p.favorite;$('favoritePrompt').textContent=p.favorite?'★ Favorited':'☆ Favorite';saveData()};
  $('insertVariable').onclick=()=>{const name=$('variableName').value.trim().replace(/\s+/g,'_');if(!name)return;const ta=$('promptBody');const token=`{{${name}}}`;const start=ta.selectionStart,end=ta.selectionEnd;ta.value=ta.value.slice(0,start)+token+ta.value.slice(end);ta.focus();ta.selectionStart=ta.selectionEnd=start+token.length;$('variableName').value=''};
  $('copyRendered').onclick=async()=>{await copyText($('renderedPrompt').value);toast('Rendered prompt copied')};$('sendRenderedToLaunch').onclick=()=>{$('launchPrompt').value=$('renderedPrompt').value;nav('launch')};
  $('vaultSearch').addEventListener('input',renderVault);$('vaultFilter').addEventListener('change',renderVault);
  $('toolGrid').innerHTML=tools.map(([n,d,k])=>`<button class="tool-btn" data-tool="${k}"><strong>${n}</strong><small>${d}</small></button>`).join('');document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{$('toolOutput').value=toolPrompt(b.dataset.tool,$('toolInput').value);toast('Prompt generated')});
  $('copyToolOutput').onclick=async()=>{await copyText($('toolOutput').value);toast('Copied')};$('toolToLaunch').onclick=()=>{$('launchPrompt').value=$('toolOutput').value;nav('launch')};$('saveToolAsPrompt').onclick=()=>{const out=$('toolOutput').value;if(!out){toast('Generate a tool prompt first');return;}clearStudio();$('promptTitle').value='Toolbox Prompt';$('promptFolder').value='Toolbox';$('promptBody').value=out;nav('studio')};
  $('providerGrid').innerHTML=providers.map(([n,d,u])=>`<button class="provider-btn" data-url="${u}"><strong>${n}</strong><small>${d}</small></button>`).join('');document.querySelectorAll('.provider-btn').forEach(b=>b.onclick=async()=>{const p=$('launchPrompt').value;if(p){await copyText(p);toast('Copied. Opening '+b.querySelector('strong').textContent)}window.open(b.dataset.url,'_blank')});
  $('exportData').onclick=exportData;$('importData').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const incoming=JSON.parse(r.result);if(!Array.isArray(incoming.prompts))throw new Error();data={...defaultData,...incoming};saveData();applyTheme();toast('Backup imported')}catch{alert('That file does not look like a Frankie AI backup.')}};r.readAsText(f)};
  $('themeSelect').onchange=e=>{data.settings=data.settings||{};data.settings.theme=e.target.value;saveData();applyTheme()};$('resetData').onclick=()=>{if(confirm('Delete all Frankie AI local data?')){data=structuredClone(defaultData);saveData();applyTheme();clearStudio();toast('Local data reset')}};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('installBtn').classList.add('hidden')}else{alert('On iPhone: tap Share in Safari, then Add to Home Screen.') }};
  updateStats();renderVault();applyTheme();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
}
init();
