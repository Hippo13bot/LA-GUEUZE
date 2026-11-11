(()=>{const G=window.GX,S=G.S,sb=G.sb,esc=G.esc,val=G.val,A=G.A;
const K={location:['Lieux',[['name','Nom'],['address','Adresse'],['gps','GPS (lat,lon)'],['access','Accès / entrée équipe / parking'],['notes','Notes']]],
contact:['Annuaire',[['name','Nom'],['role','Poste'],['department','Département'],['phone','Téléphone'],['email','E-mail'],['radio','Canal talkie / groupe WhatsApp']]],
radio:['Talkies',[['label','Appareil'],['brand','Marque / modèle'],['channel','Canal'],['department','Département'],['notes','Notes']]],
equipment:['Matériel',[['label','Équipement'],['qty','Quantité'],['status','Statut (souhaité / demandé / confirmé)'],['notes','Notes']]]};
const can=()=>['owner','admin','dept_head'].includes(G.myRole()),adm=()=>G.canEdit();
S.x={items:[],docs:[],qr:[],cat:[],url:''};S.pt='sheets';
async function load(t){const x=S.x,p=S.cur.id;
 if(K[t]){const r=await sb.from('gueuze_items').select('*').eq('production_id',p).eq('kind',t).is('deleted_at',null).order('created_at');if(r.error)throw r.error;x.items=r.data;
  if(t==='equipment'){const c=await sb.from('caverne_public_catalog').select('owner_id,catalog');x.cat=[];x.caterr=c.error?.message;(c.data||[]).forEach(o=>(o.catalog?.items||[]).forEach(i=>x.cat.push(i)))}}
 if(t==='docs'){const r=await sb.storage.from('gueuze-docs').list(p);if(r.error)throw r.error;x.docs=r.data.filter(f=>f.name!=='.emptyFolderPlaceholder')}
 if(t==='qr'){const r=await sb.from('gueuze_qr_tokens').select('id,label,shoot_date,expires_at,revoked_at').eq('production_id',p).order('created_at',{ascending:false});if(r.error)throw r.error;x.qr=r.data}}
const nm=i=>i.name||i.title||i.label||i.item_name||'(sans nom)';
function view(t){const x=S.x;
 if(K[t]){const[T,F]=K[t];return `<h2>${T}</h2>`+(x.items.map(i=>{const d=i.data;return `<div class="card"><b>${esc(d[F[0][0]])}</b>${F.slice(1).filter(f=>d[f[0]]).map(f=>`<span class="muted">${f[1]} :</span> ${f[0]==='phone'?`<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`:f[0]==='email'?`<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`:esc(d[f[0]])}<br>`).join('')}
  ${t==='location'&&d.address?`<a href="https://maps.apple.com/?q=${encodeURIComponent(d.address)}" target="_blank" rel="noopener">Plans</a> · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.gps||d.address)}" target="_blank" rel="noopener">Google Maps</a>`:''}
  ${can()?`<button class="d" data-a="delitem" data-id="${i.id}">Supprimer</button>`:''}</div>`}).join('')||'<p class="muted">Rien pour l’instant.</p>')+
  (can()?`<h2>Ajouter</h2>${F.map(f=>`<input id="f_${f[0]}" placeholder="${f[1]}">`).join('')}<button data-a="additem">Ajouter</button>`:'')+
  (t==='equipment'?`<h2>Catalogue La Caverne (lecture seule)</h2><input id="cq" placeholder="Rechercher du matériel…" value="${esc(x.q||'')}"><button class="g" data-a="csearch">Chercher</button>${x.caterr?`<p class="err">${esc(x.caterr)}</p>`:''}
   ${(x.q?x.cat.filter(i=>nm(i).toLowerCase().includes(x.q.toLowerCase())).slice(0,30):[]).map(i=>`<div class="card"><b>${esc(nm(i))}</b>${can()?`<button class="g" data-a="cadd" data-n="${esc(nm(i))}">+ Souhaité pour cette production</button>`:''}</div>`).join('')}
   <p class="muted">Les demandes ci-dessus sont des souhaits côté LA GUEUZE : la réservation réelle reste à valider dans La Caverne.</p>`:'')}
 if(t==='docs')return `<h2>Documents</h2>${x.docs.map(f=>`<div class="card"><b>${esc(f.name)}</b><button class="g" data-a="opendoc" data-n="${esc(f.name)}">Ouvrir</button> ${adm()?`<button class="d" data-a="deldoc" data-n="${esc(f.name)}">Supprimer</button>`:''}</div>`).join('')||'<p class="muted">Aucun document.</p>'}${can()?'<input id="up" type="file">':''}`;
 if(t==='qr')return `<h2>QR temporaires</h2><p class="muted">Un QR donne un accès en lecture aux feuilles <b>publiées</b> uniquement (jamais annuaire ni documents). Il expire et se révoque.</p>${adm()?`<div class="row"><input id="ql" placeholder="Libellé"><input id="qd" type="date"><select id="qh"><option value="24">24 h</option><option value="72">3 jours</option><option value="168">7 jours</option><option value="720">30 jours</option></select><button data-a="newqr">Générer</button></div>`:''}<div id="qrbox" class="c"></div><p id="qrurl" class="muted" style="word-break:break-all"></p>
  ${x.qr.map(q=>`<div class="card"><b>${esc(q.label)||'QR'} ${q.shoot_date||'toutes dates'}</b>${q.revoked_at?'<span class="err">révoqué</span>':new Date(q.expires_at)<new Date()?'<span class="muted">expiré</span>':'<span class="ok">actif jusqu’au '+new Date(q.expires_at).toLocaleString('fr-FR')+'</span>'} ${adm()&&!q.revoked_at?`<button class="d" data-a="revqr" data-id="${q.id}">Révoquer</button>`:''}</div>`).join('')}`}
const reload=async t=>{await load(t||S.pt)};
Object.assign(A,{
 async pt(e){S.pt=e.dataset.v;S.sheet=null;S.msg='';if(S.pt!=='sheets')await G.run(()=>reload()).catch(()=>{});else G.render()},
 async additem(){const d={};K[S.pt][1].forEach(f=>d[f[0]]=val('f_'+f[0]));if(!d[K[S.pt][1][0][0]])return G.say('Le premier champ est obligatoire.',1),G.render();
  await G.run(async()=>{const r=await sb.from('gueuze_items').insert({production_id:S.cur.id,kind:S.pt,data:d});if(r.error)return r;await reload()},'Ajouté.')},
 async delitem(e){if(!confirm('Supprimer cet élément ?'))return;await G.run(async()=>{const r=await sb.from('gueuze_items').update({deleted_at:new Date().toISOString()}).eq('id',e.dataset.id);if(r.error)return r;await reload()},'Supprimé.')},
 csearch(){S.x.q=val('cq');G.render()},
 async cadd(e){await G.run(async()=>{const r=await sb.from('gueuze_items').insert({production_id:S.cur.id,kind:'equipment',data:{label:e.dataset.n,qty:'1',status:'souhaité',notes:'Depuis le catalogue La Caverne'}});if(r.error)return r;await reload()},'Ajouté à la liste.')},
 async opendoc(e){const r=await sb.storage.from('gueuze-docs').createSignedUrl(S.cur.id+'/'+e.dataset.n,60);if(r.error)return G.say(r.error.message,1),G.render();window.open(r.data.signedUrl,'_blank','noopener')},
 async deldoc(e){if(!confirm('Supprimer ce document ?'))return;await G.run(async()=>{const r=await sb.storage.from('gueuze-docs').remove([S.cur.id+'/'+e.dataset.n]);if(r.error)return r;await reload()},'Document supprimé.')},
 async newqr(){let tok;await G.run(async()=>{const r=await sb.rpc('gueuze_qr_create',{p:S.cur.id,lbl:val('ql'),day:val('qd')||null,hours:+val('qh')});if(r.error)return r;tok=r.data;await reload()},'QR généré : il n’est affiché qu’une fois.');
  if(!tok)return;const u=location.origin+location.pathname.replace(/[^/]*$/,'')+'portal.html#'+tok;
  const go=()=>{const b=document.getElementById('qrbox');document.getElementById('qrurl').textContent=u;new QRCode(b,{text:u,width:220,height:220})};
  if(window.QRCode)go();else{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=go;document.head.appendChild(s)}},
 async revqr(e){if(!confirm('Révoquer ce QR ?'))return;await G.run(async()=>{const r=await sb.rpc('gueuze_qr_revoke',{tid:e.dataset.id});if(r.error)return r;await reload()},'QR révoqué.')},
 print(){window.print()}});
document.getElementById('app').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;
 if(e.target.id==='up')await G.run(async()=>{const r=await sb.storage.from('gueuze-docs').upload(S.cur.id+'/'+f.name.replace(/[^\w.\- ]/g,'_'),f,{upsert:false});if(r.error)return r;await reload()},'Document envoyé.');
 if(e.target.id==='pdf')await importPdf(f)});
async function importPdf(f){if(!navigator.onLine)return;G.say('Lecture du PDF…');G.render();
 try{if(!window.pdfjsLib)await new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=ok;s.onerror=ko;document.head.appendChild(s)});
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let t='';
  for(let i=1;i<=d.numPages;i++)t+=(await(await d.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ')+'\n';
  if(t.trim().length<30)return G.say('PDF sans texte exploitable (scan ?). L’OCR n’est pas inclus : saisis la feuille à la main.',1),G.render();
  const h=[...new Set(t.match(/\b(?:[01]?\d|2[0-3])\s?[h:]\s?[0-5]\d\b/g)||[])],ph=[...new Set(t.match(/(?:\+33|0)[1-9](?:[ .]?\d{2}){4}/g)||[])];
  S.sheet={title:'Import '+f.name,content:{call:h[0]||'',scenes:`⚠ EXTRACTION AUTOMATIQUE — À VÉRIFIER AVANT PUBLICATION\nHoraires détectés : ${h.join(', ')||'aucun'}\nTéléphones détectés : ${ph.join(', ')||'aucun'}\n--- TEXTE BRUT ---\n${t.slice(0,8000)}`,notes:''}};
  G.say('PDF lu. Vérifie et corrige, puis enregistre : la feuille reste en brouillon.');G.render()}catch(err){G.say('Lecture PDF impossible : '+err.message,1);G.render()}}
G.ext={view,pdfBlock:()=>can()?`<h2>Import / export</h2><div class="row"><label class="muted">Importer un PDF de feuille de service <input id="pdf" type="file" accept="application/pdf"></label><button class="g" data-a="print">Imprimer / exporter en PDF</button></div>`:'<button class="g" data-a="print">Imprimer / exporter en PDF</button>'};
})();
