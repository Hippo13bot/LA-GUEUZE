(()=>{
const cfg=window.GUEUZE_CONFIG,app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ST={draft:'Brouillon',validated:'Validée',published:'Publiée'};
const RL={owner:'Propriétaire',admin:'Admin',dept_head:'Chef de poste',crew:'Équipe',viewer:'Lecture'};
const S={pt:'sheets',user:null,prods:[],cur:null,sheets:[],mem:[],sheet:null,msg:'',last:null,recovery:false,tab:'in'};
if(!cfg||!cfg.supabaseAnonKey||/REMPLACER/.test(cfg.supabaseAnonKey)){
 app.innerHTML='<div class="login"><h1>LA GUEUZE</h1><p class="err">Configuration manquante : copie config/supabase.example.js en config/supabase.js et renseigne la clé publishable (voir README).</p></div>';return}
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const online=()=>navigator.onLine;
const say=(m,e)=>{S.msg=m?`<span class="${e?'err':'ok'}">${esc(m)}</span>`:'';};
async function run(fn,okMsg){ if(!online()){say('Hors connexion : modification impossible, rien n’a été enregistré.',1);return render()}
 try{const r=await fn();if(r&&r.error)throw r.error;if(okMsg)say(okMsg);S.last=new Date();return r}catch(e){say(e.message==='no_account'?'Aucun compte existant avec cet e-mail.':'Erreur : '+(e.message||e),1)}finally{render()}}
async function loadProds(){const{data,error}=await sb.from('gueuze_productions').select('*').is('deleted_at',null).order('created_at',{ascending:false});if(error)throw error;S.prods=data;S.last=new Date()}
async function openProd(id){S.cur=S.prods.find(p=>p.id===id)||null;S.sheet=null;await loadCur();render()}
async function loadCur(){if(!S.cur)return;const[a,b]=await Promise.all([
 sb.from('gueuze_callsheets').select('*').eq('production_id',S.cur.id).is('deleted_at',null).order('shoot_date'),
 sb.from('gueuze_memberships').select('*').eq('production_id',S.cur.id)]);
 if(a.error)throw a.error;S.sheets=a.data;S.mem=b.data||[];S.last=new Date()}
const myRole=()=>S.mem.find(m=>m.user_id===S.user.id)?.role;
const canEdit=()=>['owner','admin'].includes(myRole());
function head(){return `<div class="bar"><span><b>LA GUEUZE</b> <span class="muted">${esc(S.user.email)}</span></span><span class="muted">${online()?'En ligne':'<span class="err">Hors connexion</span>'} · synchro ${S.last?S.last.toLocaleTimeString('fr-FR'):'—'}</span><button class="g" data-a="out">Déconnexion</button></div>`}
function authView(){
 if(S.recovery)return `<div class="login"><h1>Nouveau mot de passe</h1><input id="np" type="password" minlength="8" placeholder="Nouveau mot de passe (8 car. min.)"><button data-a="newpw">Enregistrer</button><p>${S.msg}</p></div>`;
 const t=S.tab;return `<div class="login"><img src="assets/gueuze-identity.gif" alt="LA GUEUZE"><h1>LA GUEUZE</h1><p class="sig">by @hipo.reporter</p><p class="muted">Tout le tournage. Dans ta poche.</p>
 <input id="em" type="email" autocomplete="email" placeholder="E-mail">${t!=='reset'?'<input id="pw" type="password" autocomplete="current-password" placeholder="Mot de passe (8 car. min.)">':''}
 ${t==='up'?'<input id="dn" placeholder="Nom affiché">':''}
 <div class="row"><button data-a="${t==='in'?'login':t==='up'?'signup':'reset'}">${t==='in'?'Se connecter':t==='up'?'Créer le compte':'Envoyer le lien'}</button></div>
 <p class="muted"><a href="#" data-a="tab" data-v="in">Connexion</a> · <a href="#" data-a="tab" data-v="up">Inscription</a> · <a href="#" data-a="tab" data-v="reset">Mot de passe oublié</a></p><p>${S.msg}</p></div>`}
function listView(){return head()+`<div class="wrap"><p>${S.msg}</p><h2>Productions</h2>
 ${S.prods.map(p=>`<div class="card" data-a="open" data-id="${p.id}"><b>${esc(p.name)}</b><span class="muted">${p.start_date||'—'} → ${p.end_date||'—'}</span> <span class="tag">${esc(p.status)}</span></div>`).join('')||'<p class="muted">Aucune production pour l’instant.</p>'}
 <h2>Nouvelle production</h2><input id="pn" placeholder="Nom"><div class="row"><input id="ps" type="date"><input id="pe" type="date"></div><button data-a="newprod">Créer</button></div>`}
function prodView(){const p=S.cur,ed=canEdit(),sh=S.sheet;
 return head()+`<div class="wrap"><button class="g" data-a="back">← Productions</button><h2>${esc(p.name)} <span class="tag">${RL[myRole()]||'—'}</span></h2><p>${S.msg}</p>
 <h2>Feuilles de service</h2>${S.sheets.map(s=>`<div class="card" data-a="sheet" data-id="${s.id}"><b>${s.shoot_date} ${esc(s.title)}</b><span class="tag ${s.status}">${ST[s.status]}</span> <span class="muted">v${s.version}</span></div>`).join('')||'<p class="muted">Aucune feuille visible.</p>'}
 ${['owner','admin','dept_head'].includes(myRole())?`<button data-a="newsheet">+ Nouvelle feuille</button>`:''}
 ${sh?sheetForm(sh,ed):''}
 <h2>Équipe</h2>${S.mem.map(m=>`<div class="card"><b>${esc(m.user_id.slice(0,8))}…</b><span class="muted">${RL[m.role]} ${esc(m.department)}</span></div>`).join('')}
 ${ed?`<div class="row"><input id="me" type="email" placeholder="E-mail d’un compte existant"><select id="mr"><option value="crew">Équipe</option><option value="dept_head">Chef de poste</option><option value="admin">Admin</option><option value="viewer">Lecture</option></select><input id="md" placeholder="Département"><button data-a="addmem">Ajouter</button></div>`:''}</div>`}
function sheetForm(s,ed){const c=s.content||{};const d=ed||!s.id;const dis=d?'':'disabled';
 return `<h2>${s.id?'Feuille v'+s.version:'Nouvelle feuille'}${s.status?` <span class="tag ${s.status}">${ST[s.status]}</span>`:''}</h2>
 <div class="row"><input id="sd" type="date" value="${s.shoot_date||''}" ${dis}><input id="st" placeholder="Titre" value="${esc(s.title)}" ${dis}><input id="sc" placeholder="Convocation (ex. 07:30)" value="${esc(c.call)}" ${dis}></div>
 <input id="sl" placeholder="Lieu / adresse" value="${esc(c.place)}" ${dis}><textarea id="ss" rows="5" placeholder="Scènes, horaires, comédiens, techniciens, transport…" ${dis}>${esc(c.scenes)}</textarea>
 <textarea id="sn" rows="3" placeholder="Consignes particulières" ${dis}>${esc(c.notes)}</textarea>
 ${d?`<div class="row"><button data-a="savesheet">Enregistrer</button>${s.id&&s.status==='draft'?'<button class="g" data-a="stat" data-v="validated">Valider</button>':''}${s.id&&s.status!=='published'&&s.status==='validated'?'<button data-a="stat" data-v="published">Publier</button>':''}${s.id&&s.status!=='draft'?'<button class="g" data-a="stat" data-v="draft">Repasser en brouillon</button>':''}${s.id?'<button class="d" data-a="delsheet">Supprimer</button>':''}</div>`:''}`}
const _pv=prodView;
prodView=function(){const tabs=[['sheets','Feuilles & équipe'],['location','Lieux'],['contact','Annuaire'],['radio','Talkies'],['equipment','Matériel'],['docs','Documents'],['qr','QR']];
 const bar=`<div class="row tabs">${tabs.map(([k,l])=>`<button class="${S.pt===k?'':'g'}" data-a="pt" data-v="${k}">${l}</button>`).join('')}</div>`;
 if(S.pt==='sheets')return _pv().replace('</h2><p>','</h2>'+bar+'<p>').replace('<h2>Équipe</h2>',(GX.ext?GX.ext.pdfBlock():'')+'<h2>Équipe</h2>');
 return head()+`<div class="wrap"><button class="g" data-a="back">← Productions</button><h2>${esc(S.cur.name)}</h2>${bar}<p>${S.msg}</p>${GX.ext.view(S.pt)}</div>`};
window.GX={S,sb,esc,val,run,say,render,A,canEdit,myRole};
function render(){app.innerHTML=!S.user?authView():S.cur?prodView():listView()}
const val=id=>document.getElementById(id)?.value.trim()||'';
const readSheet=()=>({shoot_date:val('sd'),title:val('st'),content:{call:val('sc'),place:val('sl'),scenes:val('ss'),notes:val('sn')}});
const A={
 tab(e){S.tab=e.dataset.v;S.msg='';render()},
 async login(){await run(async()=>{const r=await sb.auth.signInWithPassword({email:val('em'),password:val('pw')});return r})},
 async signup(){if(val('pw').length<8)return say('Mot de passe : 8 caractères minimum.',1),render();
  await run(()=>sb.auth.signUp({email:val('em'),password:val('pw'),options:{data:{display_name:val('dn')},emailRedirectTo:location.origin+location.pathname}}),'Compte créé : vérifie ta boîte mail si une confirmation est demandée.')},
 async reset(){await run(()=>sb.auth.resetPasswordForEmail(val('em'),{redirectTo:location.origin+location.pathname}),'Si ce compte existe, un lien vient d’être envoyé.')},
 async newpw(){if(val('np').length<8)return say('8 caractères minimum.',1),render();const r=await run(()=>sb.auth.updateUser({password:val('np')}),'Mot de passe modifié.');if(r)S.recovery=false;render()},
 async out(){await sb.auth.signOut();S.user=null;S.cur=null;S.prods=[];render()},
 async open(e){await run(()=>openProd(e.dataset.id))},
 back(){S.cur=null;S.sheet=null;S.msg='';render()},
 async newprod(){if(!val('pn'))return say('Donne un nom à la production.',1),render();
  await run(async()=>{const r=await sb.from('gueuze_productions').insert({name:val('pn'),start_date:val('ps')||null,end_date:val('pe')||null});if(r.error)return r;await loadProds()},'Production créée.')},
 newsheet(){S.sheet={content:{}};render()},
 sheet(e){S.sheet=S.sheets.find(s=>s.id===e.dataset.id);render()},
 async savesheet(){const v=readSheet();if(!v.shoot_date)return say('La date de tournage est obligatoire.',1),render();
  const id=S.sheet.id;await run(async()=>{const r=id?await sb.from('gueuze_callsheets').update(v).eq('id',id):await sb.from('gueuze_callsheets').insert({...v,production_id:S.cur.id});if(r.error)return r;S.sheet=null;await loadCur()},'Feuille enregistrée (brouillon : rien n’est visible de l’équipe avant publication).')},
 async stat(e){const id=S.sheet.id;await run(async()=>{const r=await sb.from('gueuze_callsheets').update({status:e.dataset.v}).eq('id',id);if(r.error)return r;S.sheet=null;await loadCur()},'Statut : '+ST[e.dataset.v])},
 async delsheet(){if(!confirm('Supprimer cette feuille ? Son historique reste conservé.'))return;const id=S.sheet.id;
  await run(async()=>{const r=await sb.from('gueuze_callsheets').update({deleted_at:new Date().toISOString()}).eq('id',id);if(r.error)return r;S.sheet=null;await loadCur()},'Feuille supprimée.')},
 async addmem(){await run(async()=>{const r=await sb.rpc('gueuze_add_member',{p:S.cur.id,member_email:val('me'),member_role:val('mr'),dept:val('md')});if(r.error)return r;await loadCur()},'Membre ajouté.')}};
app.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;e.preventDefault();A[t.dataset.a]?.(t)});
async function refresh(){if(!S.user||!online())return;try{await loadProds();if(S.cur){S.cur=S.prods.find(p=>p.id===S.cur.id)||null;await loadCur()}if(!S.sheet||S.sheet.id)render()}catch(e){}}
let ch;function subscribe(){if(ch)sb.removeChannel(ch);ch=sb.channel('gueuze').on('postgres_changes',{event:'*',schema:'public',table:'gueuze_callsheets'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'gueuze_productions'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'gueuze_memberships'},refresh).subscribe()}
addEventListener('online',refresh);addEventListener('offline',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
sb.auth.onAuthStateChange(async(ev,ses)=>{if(ev==='PASSWORD_RECOVERY'){S.recovery=true;S.user=ses?.user||null;return render()}
 if(ses?.user&&!S.recovery){const first=!S.user;S.user=ses.user;if(first){try{await loadProds();subscribe()}catch(e){say('Lecture impossible : migration non exécutée ? '+e.message,1)}}}
 else if(!ses){S.user=null}render()});
render();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
