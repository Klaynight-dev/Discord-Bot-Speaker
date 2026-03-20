// DiscordBotSpeaker v2 — app.js
const EC=[{l:'😀',n:'Visages',e:['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😚','🙄','😬','😭','😱','😡','😈','👿','💀','💩','🤡','👻','👾','🤖']},{l:'👋',n:'Gestes',e:['👋','🤚','🖐','✋','🖖','👌','✌️','🤞','🤟','🤘','👈','👉','👆','👇','👍','👎','✊','👊','👏','🙌','🙏','✍️','💅','💪']},{l:'❤️',n:'Coeurs',e:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝']},{l:'🎉',n:'Fete',e:['🎉','🎊','🎈','🎁','🎀','🏆','🥇','🥈','🥉','🏅','🎪','🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎹','🥁','🎷','🎺','🎸','🎻','🎲','🎯','🎮','🧩']},{l:'🐱',n:'Animaux',e:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐴','🦄','🐢','🐍','🐙','🐬','🐳','🦈','🐘']},{l:'🍕',n:'Food',e:['🍏','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🥭','🍍','🥝','🍅','🥑','🥦','🌽','🌶','🧄','🧅','🥔','🍞','🥚','🍳','🥞','🥓','🍗','🍖','🌭','🍔','🍟','🍕','🍜','🍛','🍣','🍱','🎂','🍰','🧁','🍩','🍪','🍫','🍿','☕','🍵','🧊','🍺','🍻','🥂','🍷']},{l:'⚽',n:'Sport',e:['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🏒','⛳','🎣','🥊','🥋','🎽','🛹','⛸','🏆','🥇']},{l:'🚀',n:'Objets',e:['🚀','🛸','🌍','🌙','⭐','🌟','💫','⚡','☄️','💥','🔥','🌈','☀️','💧','🌊','🌺','🌸','🌼','🌻','🌹','💎','🔮','📱','💻','🖥','💡','🔦','📷','📸','🎥','🔭','🔬']},{l:'✅',n:'Symboles',e:['✅','❎','🆗','🆙','🆒','🆕','🆓','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','⚠️','🚫','💯','♻️','✔️','⚙️','🔧','🔨','🔩','🔗','📌','📍','✏️','📝','📖','📚','📋']}];

const S={token:'',bot:null,connected:false,guilds:[],channels:[],messages:[],guildId:null,channelId:null,files:[],mode:'msg',guildEmojis:[],guildLimit:{tier:0,limitBytes:26214400,limitLabel:'25 MB'},activeEmojiBtn:null,replyTo:null,embedFields:[],compBlocks:[],arTimer:null,slashCmds:[],slashIdx:-1,editingChanId:null,msgFilter:''};
const BL=[26214400,52428800,104857600,524288000],BLL=['25 MB','50 MB','100 MB','500 MB'];

const $=id=>document.getElementById(id);
function toast(msg,type='ok',ms=2500){const t=$('toast');t.textContent=msg;t.className=`show ${type}`;clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),ms);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function avUrl(u,sz=40){if(!u)return'';if(u.avatar)return`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=${sz}`;const i=u.discriminator==='0'?Number(BigInt(u.id)>>22n)%6:Number(u.discriminator)%5;return`https://cdn.discordapp.com/embed/avatars/${i}.png`;}
function gIco(g,sz=64){return g.icon?`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=${sz}`:null;}
function fmtT(iso){return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
function fmtD(iso){const d=new Date(iso),t=new Date(),y=new Date(t);y.setDate(y.getDate()-1);if(d.toDateString()===t.toDateString())return"Aujourd'hui";if(d.toDateString()===y.toDateString())return'Hier';return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,300)+'px';}
async function api(path,opts={}){try{return await(await fetch(path,opts)).json();}catch{return{};}}
async function apiPost(p,body){return api(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}

function renderMD(text){
  let s=esc(text);
  s=s.replace(/```([\s\S]+?)```/g,'<div class="md-pre">$1</div>');
  s=s.replace(/`([^`]+)`/g,'<span class="md-code">$1</span>');
  s=s.replace(/\|\|(.+?)\|\|/g,'<span class="md-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
  s=s.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>');
  s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  s=s.replace(/__(.+?)__/g,'<u>$1</u>');
  s=s.replace(/\*(.+?)\*/g,'<em>$1</em>');
  s=s.replace(/~~(.+?)~~/g,'<s>$1</s>');
  s=s.replace(/^&gt; (.+)$/gm,'<div class="md-quote">$1</div>');
  s=s.replace(/&lt;@\d+&gt;/g,'<span class="md-mention">@user</span>');
  s=s.replace(/&lt;#(\d+)&gt;/g,'<span class="md-mention">#channel</span>');
  s=s.replace(/&lt;@&amp;\d+&gt;/g,'<span class="md-mention">@role</span>');
  s=s.replace(/&lt;a?:([^:]+):(\d+)&gt;/g,(_,n,id)=>`<img src="https://cdn.discordapp.com/emojis/${id}.webp?size=24" style="width:22px;height:22px;vertical-align:-4px" alt=":${n}:">`);
  s=s.replace(/(https?:\/\/[^\s<"]+)/g,'<a class="md-link" href="$1" target="_blank" rel="noopener">$1</a>');
  return s;
}

(async()=>{
  buildPollAnswers();renderEmojiCats();renderEmojiGrid(EC.flatMap(c=>c.e));loadTemplates();
  try{
    const cfg=await api('/api/config');
    if(cfg.token){
      $('bot-token-input').value=cfg.token;S.token=cfg.token;
      const ok=await connect(true);
      if(ok&&cfg.guildId){await selectGuild(cfg.guildId,true);if(cfg.channelId)await selectChannel(cfg.channelId,true);}
    }
  }catch{}
  document.addEventListener('click',e=>{
    const pk=$('emoji-picker');
    if(pk.classList.contains('show')&&!pk.contains(e.target)&&!e.target.closest('.ans-emoji-btn')&&e.target.id!=='emoji-btn-msg'){pk.classList.remove('show');S.activeEmojiBtn=null;}
    const td=$('tpl-dropdown');
    if(td.classList.contains('show')&&!td.contains(e.target)&&!e.target.closest('[onclick*="toggleTpl"]'))td.classList.remove('show');
    const sp=$('slash-popup');
    if(sp&&sp.classList.contains('show')&&!sp.contains(e.target))sp.classList.remove('show');
  });
})();

async function connect(silent=false){
  const token=$('bot-token-input').value.trim();
  if(!token){toast('Entrez un token','err');return false;}
  S.token=token;
  $('connect-btn').disabled=true;$('connect-btn').textContent='…';
  const r=await api(`/api/me?token=${encodeURIComponent(token)}`);
  $('connect-btn').disabled=false;$('connect-btn').textContent='Connecter';
  if(!r.id){if(!silent)toast(r.message||'Token invalide','err');return false;}
  S.bot=r;S.connected=true;
  const av=$('bot-av'),avU=avUrl(r,64);
  av.innerHTML=avU?`<img src="${avU}" alt=""/><div class="bot-status-ring"><div class="bot-status-dot online"></div></div>`:`🤖<div class="bot-status-ring"><div class="bot-status-dot online"></div></div>`;
  $('bot-name').textContent=r.global_name||r.username;$('bot-tag').textContent=`@${r.username}`;
  $('bot-info-wrap').style.display='flex';$('bot-info-wrap').style.flexDirection='column';
  $('connect-wrap').style.display='none';$('disconnect-btn').style.display='block';
  await apiPost('/api/config',{token,guildId:S.guildId,channelId:S.channelId});
  if(!silent)toast(`Connecté @${r.username} ✓`,'ok');
  await loadGuilds();return true;
}

async function disconnect(){
  S.connected=false;S.bot=null;S.token='';S.guildId=null;S.channelId=null;
  clearInterval(S.arTimer);
  $('bot-av').innerHTML='🤖';
  $('bot-info-wrap').style.display='none';$('connect-wrap').style.display='flex';$('disconnect-btn').style.display='none';
  $('bot-token-input').value='';$('guild-list').innerHTML='';$('channel-scroll').innerHTML='';
  $('messages-area').innerHTML='<div class="empty-state"><div class="ico">💬</div><p>Connectez votre bot et sélectionnez un salon</p></div>';
  $('sidebar-guild-name').textContent='Aucun serveur';$('chan-bar-name').textContent='Aucun salon';$('chan-bar-topic').textContent='';
  ['pins-btn','refresh-btn'].forEach(id=>{const el=$(id);if(el)el.style.display='none';});
  $('autorefresh-wrap').style.display='none';$('limit-badge').classList.remove('show');
  toast('Déconnecté','info');
}

async function loadGuilds(){
  const r=await api(`/api/guilds?token=${encodeURIComponent(S.token)}`);
  if(!Array.isArray(r))return;S.guilds=r;
  const list=$('guild-list');list.innerHTML='';
  for(const g of r){
    const el=document.createElement('div');el.className='guild-icon';el.title=g.name;el.dataset.id=g.id;
    const ico=gIco(g);
    el.innerHTML=ico?`<div class="guild-pill"></div><img src="${ico}" alt="${esc(g.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>`:`<div class="guild-pill"></div>${esc(g.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase())}`;
    el.onclick=()=>selectGuild(g.id);list.appendChild(el);
  }
}

const CHAN_ICONS={0:'#',2:'🔊',4:'📁',5:'📣',10:'🔁',11:'🔁',12:'🔁',13:'🎙',14:'📸',15:'📋'};
const collapsed=new Set();

async function selectGuild(guildId,silent=false){
  S.guildId=guildId;
  document.querySelectorAll('.guild-icon').forEach(el=>el.classList.toggle('active',el.dataset.id===guildId));
  const g=S.guilds.find(x=>x.id===guildId)||{name:guildId};
  $('sidebar-guild-name').textContent=g.name;
  $('channel-scroll').innerHTML='<div style="padding:16px;font-size:13px;color:var(--text-muted)">Chargement…</div>';
  const r=await api(`/api/channels?token=${encodeURIComponent(S.token)}&guildId=${guildId}`);
  if(!Array.isArray(r.channels))return;
  S.channels=r.channels;
  if(r.guild?.premium_tier!==undefined){const t=r.guild.premium_tier;S.guildLimit={tier:t,limitBytes:BL[t],limitLabel:BLL[t]};}
  api(`/api/emojis?token=${encodeURIComponent(S.token)}&guildId=${guildId}`).then(em=>{if(Array.isArray(em))S.guildEmojis=em;});
  if(S.bot?.id)api(`/api/slash-commands?token=${encodeURIComponent(S.token)}&appId=${S.bot.id}&guildId=${guildId}`).then(d=>{if(d.global||d.guild)S.slashCmds=[...(d.global||[]),...(d.guild||[])];});
  renderChannels(r.channels);
  if(!silent)await apiPost('/api/config',{token:S.token,guildId,channelId:S.channelId});
}

function renderChannels(channels){
  const scroll=$('channel-scroll');scroll.innerHTML='';
  const cats=channels.filter(c=>c.type===4).sort((a,b)=>a.position-b.position);
  const chans=channels.filter(c=>c.type!==4);
  chans.filter(c=>!c.parent_id).sort((a,b)=>a.position-b.position).forEach(c=>scroll.appendChild(buildChan(c)));
  for(const cat of cats){
    const kids=chans.filter(c=>c.parent_id===cat.id).sort((a,b)=>a.position-b.position);
    if(!kids.length)continue;
    const isCol=collapsed.has(cat.id);
    const catEl=document.createElement('div');catEl.className='cat-header';
    catEl.innerHTML=`<span class="cat-arrow ${isCol?'collapsed':''}">▾</span><span style="flex:1">${esc(cat.name).toUpperCase()}</span>`;
    const grp=document.createElement('div');grp.id=`cg-${cat.id}`;grp.style.display=isCol?'none':'';
    catEl.onclick=()=>{const c=collapsed.has(cat.id);c?collapsed.delete(cat.id):collapsed.add(cat.id);grp.style.display=c?'':'none';catEl.querySelector('.cat-arrow').classList.toggle('collapsed',!c);};
    scroll.appendChild(catEl);
    kids.forEach(c=>grp.appendChild(buildChan(c)));
    scroll.appendChild(grp);
  }
}

function buildChan(c){
  const el=document.createElement('div');
  el.className=`chan-item${c.id===S.channelId?' active':''}`;el.dataset.id=c.id;
  const ico=CHAN_ICONS[c.type]||'#';
  const edBtn=c.type===0?`<div class="chan-actions"><button class="chan-act-btn" title="Modifier" onclick="openChanEdit(event,'${c.id}','${esc(c.name).replace(/'/g,"\\'")}','${esc(c.topic||'').replace(/'/g,"\\'")}',${c.rate_limit_per_user||0},${!!c.nsfw})">✏️</button></div>`:'';
  el.innerHTML=`<span class="chan-icon">${ico}</span><div style="flex:1;min-width:0"><div class="chan-name">${esc(c.name)}</div>${c.topic?`<div class="chan-topic">${esc(c.topic)}</div>`:''}</div>${edBtn}`;
  if([0,5,15].includes(c.type))el.onclick=e=>{if(!e.target.closest('.chan-actions'))selectChannel(c.id);};
  return el;
}

async function selectChannel(channelId,silent=false){
  S.channelId=channelId;
  document.querySelectorAll('.chan-item').forEach(el=>el.classList.toggle('active',el.dataset.id===channelId));
  let chan = S.channels.find(c=>c.id===channelId);
  if(!chan && S.dms) chan = S.dms.find(c=>c.id===channelId);
  if(chan){
    if (chan.type === 1) {
      const user = chan.recipients?.[0];
      $('chan-bar-icon').textContent = '@';
      $('chan-bar-name').textContent = user ? (user.global_name || user.username) : 'Inconnu';
      $('chan-bar-topic').textContent = user ? `@${user.username}` : '';
    } else {
      $('chan-bar-icon').textContent=CHAN_ICONS[chan.type]||'#';
      $('chan-bar-name').textContent=chan.name;
      $('chan-bar-topic').textContent=chan.topic||'';
    }
  }
  ['refresh-btn','pins-btn'].forEach(id=>{const el=$(id);if(el)el.style.display='';});
  $('autorefresh-wrap').style.display='flex';$('limit-badge').classList.add('show');
  
  if (S.guildId) {
    $('limit-text').textContent=S.guildLimit.limitLabel+' max';
    $('limit-dot').className=`limit-dot tier${S.guildLimit.tier}`;
    if(!silent)await apiPost('/api/config',{token:S.token,guildId:S.guildId,channelId});
  } else {
    $('limit-badge').classList.remove('show');
  }
  
  await loadMessages();
}

async function showHome(){
  S.guildId = null;
  document.querySelectorAll('.guild-icon').forEach(el=>el.classList.remove('active'));
  $('home-icon').classList.add('active');
  $('sidebar-guild-name').textContent='Messages Privés';
  const scroll = $('channel-scroll');
  scroll.innerHTML='<div style="padding:16px;font-size:13px;color:var(--text-muted)">Chargement…</div>';
  const r = await api(`/api/dms?token=${encodeURIComponent(S.token)}`);
  if(!Array.isArray(r)){ scroll.innerHTML=''; return; }
  
  S.dms = r;
  scroll.innerHTML = `
    <div style="padding: 12px 8px; border-bottom: 1px solid var(--border); margin-bottom: 8px;">
      <input type="text" id="dm-search" style="width: 100%; background: var(--bg-tertiary); border: none; border-radius: var(--r4); color: var(--text-normal); font-family: var(--font); font-size: 13px; padding: 6px 10px; outline: none; transition: background .12s;" placeholder="Rechercher…" oninput="searchUsers(this.value)" />
    </div>
    <div id="dm-list-container"></div>
  `;
  renderDMList();
}

function renderDMList() {
  const container = $('dm-list-container');
  if(!container) return;
  container.innerHTML = '';
  S.dms.filter(c => c.type === 1).forEach(dm => {
    const user = dm.recipients?.[0];
    if(!user) return;
    const el = document.createElement('div');
    el.className = `chan-item${dm.id === S.channelId ? ' active' : ''}`;
    el.dataset.id = dm.id;
    const av = avUrl(user, 32);
    el.innerHTML = `<img src="${av}" style="width:28px;height:28px;border-radius:50%;margin-right:8px;object-fit:cover" onerror="this.style.display='none'"/>
                    <div style="flex:1;min-width:0"><div class="chan-name">${esc(user.global_name || user.username)}</div></div>`;
    el.onclick = () => selectChannel(dm.id);
    container.appendChild(el);
  });
}

let searchTimer = null;
function searchUsers(q) {
  clearTimeout(searchTimer);
  const container = $('dm-list-container');
  if(!container) return;
  if(!q || q.length < 2) {
    renderDMList();
    return;
  }
  searchTimer = setTimeout(async () => {
    container.innerHTML = '<div style="padding:16px;font-size:13px;color:var(--text-muted);text-align:center">Recherche globale…</div>';
    const r = await api(`/api/users/search?token=${encodeURIComponent(S.token)}&q=${encodeURIComponent(q)}`);
    container.innerHTML = '<div style="padding: 0 8px; font-size: 11px; font-weight: 700; color: var(--channel-default); text-transform: uppercase; margin-bottom: 4px;">Utilisateurs</div>';
    if(!Array.isArray(r) || !r.length) {
      container.innerHTML += '<div style="padding:16px;font-size:13px;color:var(--text-muted);text-align:center">Aucun résultat</div>';
      return;
    }
    r.forEach(user => {
      const el = document.createElement('div');
      el.className = 'chan-item';
      const av = avUrl(user, 32);
      el.innerHTML = `<img src="${av}" style="width:28px;height:28px;border-radius:50%;margin-right:8px;object-fit:cover" onerror="this.style.display='none'"/>
                      <div style="flex:1;min-width:0"><div class="chan-name">${esc(user.global_name || user.username)}</div>
                      <div class="chan-topic">@${esc(user.username)}</div></div>`;
      el.onclick = async () => {
        const createR = await apiPost('/api/dm', { token: S.token, recipient_id: user.id });
        if(createR.id) {
          $('dm-search').value = '';
          await showHome(); 
          await selectChannel(createR.id);
        } else {
          toast(createR.message || 'Erreur','err');
        }
      };
      container.appendChild(el);
    });
  }, 400);
}
// __CHUNK1_END__

async function loadMessages(silent=false){
  if(!S.channelId||!S.token)return;
  const r=await api(`/api/messages?token=${encodeURIComponent(S.token)}&channelId=${S.channelId}`);
  if(!Array.isArray(r))return;
  S.messages=r;renderMessages(r,S.msgFilter);
  if(silent&&r.length){const m=r[0];if(!S._lastMsgId||m.id!==S._lastMsgId){S._lastMsgId=m.id;toast(`💬 ${m.author?.username||'?'}: ${(m.content||'[fichier]').slice(0,50)}`,'info',3000);}return;}
  S._lastMsgId=r[0]?.id;
}

function renderMessages(msgs,filter=''){
  const area=$('messages-area');
  const list=filter?msgs.filter(m=>(m.content||'').toLowerCase().includes(filter.toLowerCase())):msgs;
  if(!list.length){area.innerHTML='<div class="empty-state"><div class="ico">💬</div><p>Aucun message</p></div>';return;}
  const botId=S.bot?.id;let html='<div class="msg-spacer"></div>';
  let lastDate='',lastAId='',lastTs=0;
  [...list].reverse().forEach(m=>{
    const a=m.author||{};
    const d=fmtD(m.timestamp),t=new Date(m.timestamp).getTime();
    if(d!==lastDate){html+=`<div class="msg-date-sep">${d}</div>`;lastDate=d;}
    const same=a.id===lastAId&&t-lastTs<300000&&!m.referenced_message;
    const av=avUrl(a,80),isBot=a.bot,isMine=a.id===botId;
    let refHtml='';
    if(m.referenced_message){const rf=m.referenced_message,rfa=rf.author||{};refHtml=`<div class="msg-reply-ref"><img class="msg-reply-av" src="${avUrl(rfa,32)}" onerror="this.style.display='none'"/><span class="msg-reply-name">${esc(rfa.global_name||rfa.username||'?')}</span><span class="msg-reply-text"> ${esc((rf.content||'[pièce jointe]').slice(0,60))}</span></div>`;}
    const cont=m.content?`<div class="msg-content${m.edited_timestamp?' edited':''}">${renderMD(m.content)}</div>`:'';
    const embs=(m.embeds||[]).map(renderEmbed).join('');
    const atts=renderAttach(m.attachments||[]);
    const poll=m.poll?renderPoll(m):'';
    const acts=`<div class="msg-actions"><button class="msg-act reply" onclick="setReply('${m.id}','${esc(a.global_name||a.username||'?').replace(/'/g,"\\'")}','${esc((m.content||'').slice(0,60)).replace(/'/g,"\\'")}')">↩</button>${isMine?`<button class="msg-act edit" onclick="startEdit('${m.id}','${(m.content||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/"/g,'\\"')}')">✏️</button><button class="msg-act del" onclick="delMsg('${m.id}')">🗑</button>`:''}</div>`;
    const editZ=`<div class="msg-edit-zone" id="ez-${m.id}"><textarea class="msg-edit-ta" id="eta-${m.id}" onkeydown="onEditKey(event,'${m.id}')"></textarea><div class="msg-edit-hint">Entrée = sauvegarder · Échap = annuler</div></div>`;
    if(!same){
      html+=`<div class="msg-group" id="msg-${m.id}">${refHtml}<img class="msg-av" src="${av}" onerror="this.src=''" loading="lazy" alt=""/><div class="msg-header"><span class="msg-author ${isBot?'is-bot':''}">${esc(a.global_name||a.username||'?')}${isBot?'<span class="bot-badge">BOT</span>':''}</span><span class="msg-ts">${fmtT(m.timestamp)}</span></div>${cont}${embs}${atts}${poll}${editZ}${acts}</div>`;
    }else{
      html+=`<div class="msg-continue" id="msg-${m.id}"><span class="msg-ts-small">${fmtT(m.timestamp)}</span>${cont}${embs}${atts}${poll}${editZ}${acts}</div>`;
    }
    lastAId=a.id;lastTs=t;
  });
  area.innerHTML=html;area.scrollTop=area.scrollHeight;
  area.querySelectorAll('.msg-img,.embed-image').forEach(img=>{img.onclick=()=>{$('lb-img').src=img.src;$('lightbox').classList.add('show');};});
}

function filterMessages(q){S.msgFilter=q;$('search-clear').style.display=q?'':'none';renderMessages(S.messages,q);}
function clearSearch(){$('msg-search').value='';filterMessages('');}

function renderEmbed(e){
  let h=`<div class="embed"><div class="embed-accent" style="background:${e.color?`#${e.color.toString(16).padStart(6,'0')}`:'var(--bg-modifier-hover)'}"></div><div class="embed-body">`;
  if(e.thumbnail?.url)h+=`<img class="embed-thumb" src="${esc(e.thumbnail.url)}" loading="lazy"/>`;
  if(e.author?.name)h+=`<div class="embed-author">${e.author.icon_url?`<img class="embed-author-icon" src="${esc(e.author.icon_url)}" loading="lazy"/>`:''}<span class="embed-author-name">${esc(e.author.name)}</span></div>`;
  if(e.title)h+=`<div class="embed-title ${e.url?'':'no-url'}">${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">`:''}${esc(e.title)}${e.url?'</a>':''}</div>`;
  if(e.description)h+=`<div class="embed-desc">${renderMD(e.description)}</div>`;
  if(e.fields?.length){
    h+='<div class="embed-fields">';
    let i=0;while(i<e.fields.length){const f=e.fields[i];if(f.inline){const grp=[f];let j=i+1;while(j<e.fields.length&&e.fields[j].inline&&grp.length<3){grp.push(e.fields[j]);j++;}h+=`<div style="display:grid;grid-template-columns:repeat(${grp.length},1fr);gap:8px">`;grp.forEach(ff=>h+=`<div class="embed-field"><div class="embed-field-name">${esc(ff.name)}</div><div class="embed-field-val">${renderMD(ff.value)}</div></div>`);h+='</div>';i=j;}else{h+=`<div class="embed-field"><div class="embed-field-name">${esc(f.name)}</div><div class="embed-field-val">${renderMD(f.value)}</div></div>`;i++;}}
    h+='</div>';
  }
  if(e.image?.url)h+=`<img class="embed-image" src="${esc(e.image.url)}" loading="lazy"/>`;
  if(e.footer?.text||e.timestamp)h+=`<div class="embed-footer">${e.footer?.icon_url?`<img class="embed-footer-icon" src="${esc(e.footer.icon_url)}" loading="lazy"/>`:''}<span>${esc(e.footer?.text||'')}</span>${e.timestamp?`<span class="embed-footer-right">${fmtD(e.timestamp)} ${fmtT(e.timestamp)}</span>`:''}</div>`;
  h+='</div></div>';return h;
}

function renderAttach(atts){
  let h='';
  const imgs=atts.filter(a=>/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(a.url));
  const rest=atts.filter(a=>!/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(a.url));
  if(imgs.length){h+='<div class="msg-imgs">';imgs.forEach(a=>{h+=`<img class="msg-img" src="${esc(a.url)}" loading="lazy" alt="${esc(a.filename)}"/>`;});h+='</div>';}
  rest.forEach(a=>{h+=`<div class="msg-file"><span class="msg-file-icon">📄</span><div><div class="msg-file-name"><a href="${esc(a.url)}" target="_blank">${esc(a.filename)}</a></div><div class="msg-file-size">${(a.size/1048576).toFixed(2)} MB</div></div></div>`;});
  return h;
}

function renderPoll(m){
  const p=m.poll;if(!p)return'';
  const tot=p.results?.answer_counts?.reduce((s,a)=>s+a.count,0)||0;
  let h=`<div class="poll-card"><div class="poll-q">📊 ${esc(p.question.text)}</div>`;
  (p.answers||[]).forEach(ans=>{const cnt=p.results?.answer_counts?.find(a=>a.id===ans.answer_id)?.count||0,pct=tot?Math.round(cnt/tot*100):0,emoji=ans.poll_media?.emoji?.name||'';
    h+=`<div class="poll-opt"><span class="poll-opt-emoji">${esc(emoji)}</span><div class="poll-bar-wrap"><div class="poll-bar" style="width:${pct}%"></div><span class="poll-bar-label">${esc(ans.poll_media?.text||'')}</span></div><span class="poll-pct">${pct}%</span></div>`;});
  h+=`<div class="poll-footer"><span>${tot} vote(s)</span>${!p.results?.is_finalized?`<button class="poll-end-btn" onclick="endPoll('${m.id}')">Terminer</button>`:'<span>Terminé ✓</span>'}</div></div>`;
  return h;
}
async function endPoll(mid){if(!confirm('Terminer ce sondage ?'))return;const r=await apiPost('/api/poll/end',{token:S.token,channelId:S.channelId,messageId:mid});if(r.ok||r.id){toast('Sondage terminé ✓');await loadMessages();}else toast(r.message||'Erreur','err');}

function setAutoRefresh(v){clearInterval(S.arTimer);S.arTimer=null;$('ar-dot').classList.toggle('active',v>0);if(v>0)S.arTimer=setInterval(()=>loadMessages(true),v*1000);}

function startEdit(mid,content){
  document.querySelectorAll('.msg-edit-zone.show').forEach(el=>el.classList.remove('show'));
  const zone=$(`ez-${mid}`),ta=$(`eta-${mid}`);if(!zone||!ta)return;
  ta.value=content.replace(/\\n/g,'\n');zone.classList.add('show');ta.focus();ta.selectionStart=ta.value.length;autoResize(ta);
}
function onEditKey(e,mid){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveEdit(mid);}if(e.key==='Escape')$(`ez-${mid}`).classList.remove('show');autoResize(e.target);}
async function saveEdit(mid){
  const ta=$(`eta-${mid}`);const content=ta.value.trim();if(!content)return;
  const r=await fetch('/api/message',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:S.token,channelId:S.channelId,messageId:mid,content})}).then(r=>r.json()).catch(()=>({}));
  if(r.id||r.ok){toast('Modifié ✓');$(`ez-${mid}`).classList.remove('show');await loadMessages();}else toast(r.message||'Erreur','err');
}
async function delMsg(mid){
  if(!confirm('Supprimer ce message ?'))return;
  const r=await fetch(`/api/message?token=${encodeURIComponent(S.token)}&channelId=${S.channelId}&messageId=${mid}`,{method:'DELETE'}).then(r=>r.json()).catch(()=>({}));
  if(r.ok){toast('Supprimé ✓');await loadMessages();}else toast(r.message||'Erreur','err');
}
function setReply(mid,author,preview){S.replyTo=mid;$('rb-author').textContent=author;$('rb-preview').textContent=preview;$('reply-bar').classList.add('show');$('msg-input').focus();}
function clearReply(){S.replyTo=null;$('reply-bar').classList.remove('show');}
// __CHUNK2_END__

// ═══ INPUT ═══
function setMode(m){
  S.mode=m;
  document.querySelectorAll('.mode-tab').forEach((t,i)=>t.classList.toggle('active',(i===0&&m==='msg')||(i===1&&m==='poll')||(i===2&&m==='comp')));
  $('msg-panel').style.display=m==='msg'?'':'none';
  $('poll-panel').style.display=m==='poll'?'':'none';
  $('comp-panel').style.display=m==='comp'?'':'none';
  if(m==='comp')updateCompPreview();
}

function onType(){
  const ta=$('msg-input');autoResize(ta);
  const v=ta.value;const len=v.length;
  const ctr=$('char-ctr');ctr.textContent=`${len} / 2000`;
  ctr.className=len>1800?'warn':'';if(len>2000)ctr.className='over';
  $('send-btn').disabled=len===0&&S.files.length===0&&!hasEmbed();
  // Slash commands
  if(v.startsWith('/')){
    const q=v.slice(1).toLowerCase();
    const matches=S.slashCmds.filter(c=>c.name.startsWith(q)).slice(0,10);
    renderSlashPopup(matches,v);
  }else{$('slash-popup').classList.remove('show');}
}

function renderSlashPopup(cmds,raw){
  const popup=$('slash-popup');
  if(!cmds.length){popup.classList.remove('show');return;}
  popup.classList.add('show');
  popup.innerHTML=cmds.map((c,i)=>`<div class="slash-cmd${i===S.slashIdx?' selected':''}" onclick="applySlash('${esc(c.name)}')">
    <div class="slash-cmd-icon">${c.name[0].toUpperCase()}</div>
    <div><div class="slash-cmd-name">/${esc(c.name)}</div><div class="slash-cmd-desc">${esc(c.description||'')}</div></div>
    <span class="slash-cmd-bot">${esc(c.application_id||'')}</span>
  </div>`).join('');
}

function applySlash(name){
  $('msg-input').value='/'+name+' ';
  $('slash-popup').classList.remove('show');
  $('msg-input').focus();onType();
}

function onKey(e){
  if(e.key==='Enter'&&!e.shiftKey&&S.mode==='msg'){e.preventDefault();sendMsg();}
  autoResize(e.target);
}

function onFiles(evt){
  const newF=Array.from(evt.target.files||[]);
  S.files=[...S.files,...newF].slice(0,10);
  evt.target.value='';renderPreviews();
  $('send-btn').disabled=false;
}
function renderPreviews(){
  const pr=$('previews');pr.innerHTML='';
  S.files.forEach((f,i)=>{
    const item=document.createElement('div');item.className='preview-item';
    if(f.type.startsWith('image/')){item.innerHTML=`<img src="${URL.createObjectURL(f)}" alt="${esc(f.name)}"/><button class="rm" onclick="rmFile(${i})">✕</button>`;}
    else{item.innerHTML=`<div class="preview-file-item">📄<br>${esc(f.name.slice(0,12))}</div><button class="rm" onclick="rmFile(${i})">✕</button>`;}
    pr.appendChild(item);
  });
}
function rmFile(i){S.files.splice(i,1);renderPreviews();$('send-btn').disabled=S.files.length===0&&!$('msg-input').value.trim()&&!hasEmbed();}

async function sendMsg(){
  if(!S.channelId){toast('Sélectionnez un salon','err');return;}
  const content=$('msg-input').value.slice(0,2000);
  const embedData=buildEmbedData();
  const hasFiles=S.files.length>0;
  $('send-btn').disabled=true;
  try{
    if(hasFiles){
      const fd=new FormData();
      fd.append('token',S.token);fd.append('channelId',S.channelId);
      if(content)fd.append('content',content);
      if(S.replyTo)fd.append('replyTo',S.replyTo);
      if(embedData)fd.append('embeds',JSON.stringify([embedData]));
      if(S.guildId)fd.append('guildId',S.guildId);
      S.files.forEach((f,i)=>fd.append(`files`,f,f.name));
      const r=await fetch('/api/send',{method:'POST',body:fd}).then(r=>r.json()).catch(()=>({}));
      if(r.id){reset();if(!S.arTimer)await loadMessages();}
      else if(r.error==='Fichier(s) trop volumineux'){showFileErr(r);}
      else toast(r.message||r.error||'Erreur','err');
    }else{
      const payload={token:S.token,channelId:S.channelId};
      if(content)payload.content=content;
      if(S.replyTo)payload.message_reference={message_id:S.replyTo,fail_if_not_exists:false};
      if(embedData)payload.embeds=[embedData];
      const r=await apiPost('/api/send',payload);
      if(r.id){reset();if(!S.arTimer)await loadMessages();}
      else toast(r.message||r.error||'Erreur','err');
    }
  }finally{$('send-btn').disabled=false;}
}

function reset(){
  $('msg-input').value='';$('msg-input').style.height='auto';
  S.files=[];renderPreviews();clearReply();clearEmbed();
  $('send-btn').disabled=true;$('char-ctr').textContent='0 / 2000';
}

function showFileErr(r){
  $('err-files-list').textContent=r.detail||'';$('err-limit-label').textContent=r.limitLabel||'?';
  [0,1,2,3].forEach(i=>{const el=$(`bl${i}`);if(el)el.classList.toggle('current',i===r.tier);});
  $('err-modal').classList.add('show');
}

// ═══ EMBED BUILDER ═══
function toggleEmbed(){const eb=$('embed-builder-wrap');eb.classList.toggle('show');$('embed-toggle-btn').classList.toggle('active',eb.classList.contains('show'));}
function hasEmbed(){return['eb-title','eb-desc','eb-url','eb-image','eb-thumb','eb-author','eb-footer'].some(id=>$(id)?.value?.trim());}
function buildEmbedData(){
  const title=$('eb-title')?.value?.trim()||'';const desc=$('eb-desc')?.value?.trim()||'';
  const url=$('eb-url')?.value?.trim()||'';const image=$('eb-image')?.value?.trim()||'';
  const thumb=$('eb-thumb')?.value?.trim()||'';const author=$('eb-author')?.value?.trim()||'';
  const footer=$('eb-footer')?.value?.trim()||'';
  const hex=$('eb-color-hex')?.value||'#5865f2';
  const color=parseInt(hex.replace('#',''),16)||5793266;
  if(!title&&!desc&&!url&&!image&&!thumb&&!author&&!footer&&!S.embedFields.length)return null;
  const emb={color};
  if(title)emb.title=title;if(url)emb.url=url;if(desc)emb.description=desc;
  if(author)emb.author={name:author};if(footer)emb.footer={text:footer};
  if(image)emb.image={url:image};if(thumb)emb.thumbnail={url:thumb};
  if(S.embedFields.length)emb.fields=S.embedFields.filter(f=>f.name||f.value);
  return emb;
}
function updateEmbedPreview(){}
function clearEmbed(){
  ['eb-title','eb-desc','eb-url','eb-image','eb-thumb','eb-author','eb-footer'].forEach(id=>{const el=$(id);if(el)el.value='';});
  S.embedFields=[];$('eb-fields').innerHTML='';
  syncEmbedColor('#5865f2');
}
function syncEmbedColor(v){$('eb-color-hex').value=v;$('eb-color-picker').value=v;$('eb-preview-bar').style.background=v;}
function syncEmbedColorHex(v){if(/^#[0-9a-f]{6}$/i.test(v)){$('eb-color-picker').value=v;$('eb-preview-bar').style.background=v;}}
function addEmbedField(){
  if(S.embedFields.length>=25)return;
  const idx=S.embedFields.length;S.embedFields.push({name:'',value:'',inline:false});
  const row=document.createElement('div');row.className='eb-field-item';
  row.innerHTML=`<input class="eb-input" placeholder="Nom" oninput="S.embedFields[${idx}].name=this.value"/>
    <input class="eb-input" placeholder="Valeur" oninput="S.embedFields[${idx}].value=this.value"/>
    <label class="eb-inline-check"><input type="checkbox" onchange="S.embedFields[${idx}].inline=this.checked"> Inline</label>
    <button class="eb-rm-field" onclick="rmEmbedField(${idx})">✕</button>`;
  $('eb-fields').appendChild(row);
}
function rmEmbedField(i){S.embedFields.splice(i,1);renderEmbedFields();}
function renderEmbedFields(){
  $('eb-fields').innerHTML='';S.embedFields.forEach((_,i)=>{const row=document.createElement('div');row.className='eb-field-item';
    row.innerHTML=`<input class="eb-input" placeholder="Nom" value="${esc(S.embedFields[i].name)}" oninput="S.embedFields[${i}].name=this.value"/>
      <input class="eb-input" placeholder="Valeur" value="${esc(S.embedFields[i].value)}" oninput="S.embedFields[${i}].value=this.value"/>
      <label class="eb-inline-check"><input type="checkbox" ${S.embedFields[i].inline?'checked':''} onchange="S.embedFields[${i}].inline=this.checked"> Inline</label>
      <button class="eb-rm-field" onclick="rmEmbedField(${i})">✕</button>`;
    $('eb-fields').appendChild(row);});
}

// ═══ POLL BUILDER ═══
const answers=[];
function buildPollAnswers(){answers.splice(0);answers.push({text:'',emoji:'',emojiId:''},{text:'',emoji:'',emojiId:''});renderAnswers();}
function renderAnswers(){
  const list=$('answers-list');list.innerHTML='';
  answers.forEach((a,i)=>{
    const row=document.createElement('div');row.className='ans-row';
    row.innerHTML=`<button class="ans-emoji-btn" onclick="openEmojiPicker(event,'ans',${i})">${a.emoji||'<span class="placeholder">+</span>'}</button>
      <input class="ans-input" placeholder="Réponse ${i+1}…" maxlength="55" value="${esc(a.text)}" oninput="answers[${i}].text=this.value;updPollBtn()"/>
      ${answers.length>2?`<button class="ans-rm" onclick="rmAnswer(${i})">✕</button>`:''}`;
    list.appendChild(row);
  });
  $('ans-count').textContent=`${answers.length} / 10`;
  updPollBtn();
}
function addAnswer(){if(answers.length>=10)return;answers.push({text:'',emoji:'',emojiId:''});renderAnswers();}
function rmAnswer(i){if(answers.length<=2)return;answers.splice(i,1);renderAnswers();}
function onPollQInput(){const v=$('poll-q').value;$('q-ctr').textContent=`${v.length} / 300`;updPollBtn();}
function updPollBtn(){const filled=answers.filter(a=>a.text.trim()).length;$('ans-filled').textContent=filled;$('send-poll-btn').disabled=!$('poll-q').value.trim()||filled<2;}
async function sendPoll(){
  if(!S.channelId){toast('Sélectionnez un salon','err');return;}
  const q=$('poll-q').value.trim();if(!q){toast('Question requise','err');return;}
  const r=await apiPost('/api/poll',{token:S.token,channelId:S.channelId,question:q,answers,duration:parseInt($('poll-dur').value),allow_multiselect:$('poll-multi').checked});
  if(r.id){toast('Sondage publié ✓');$('poll-q').value='';buildPollAnswers();if(!S.arTimer)await loadMessages();}
  else toast(r.message||'Erreur','err');
}

// ═══ COMPONENTS V2 ═══
const BCLR={1:'Primary',2:'Secondary',3:'Success',4:'Danger',5:'Link'};
function addCompBlock(type){
  const id=Date.now();
  const block={id,type,data:{}};
  if(type==='buttons')block.data.buttons=[{label:'Bouton',style:1,custom_id:`btn_${id}`}];
  if(type==='text')block.data.content='';
  if(type==='section')block.data.text='';
  S.compBlocks.push(block);renderCompBlocks();updateCompPreview();
}
function rmCompBlock(id){S.compBlocks=S.compBlocks.filter(b=>b.id!==id);renderCompBlocks();updateCompPreview();}
function moveComp(id,dir){const i=S.compBlocks.findIndex(b=>b.id===id);const j=i+dir;if(j<0||j>=S.compBlocks.length)return;[S.compBlocks[i],S.compBlocks[j]]=[S.compBlocks[j],S.compBlocks[i]];renderCompBlocks();updateCompPreview();}
function renderCompBlocks(){
  const el=$('comp-blocks');el.innerHTML='';
  S.compBlocks.forEach((b,i)=>{
    const cb=document.createElement('div');cb.className='cb';
    const type={'text':'📝 Texte','sep':'─ Séparateur','buttons':'🔘 Boutons','section':'📑 Section'}[b.type]||b.type;
    cb.innerHTML=`<div class="cb-head"><div class="cb-title">${type}<span class="cb-badge">#${i+1}</span></div>
      <div class="cb-btns">
        <button class="cb-ctrl" onclick="moveComp(${b.id},-1)" ${i===0?'disabled':''}>↑</button>
        <button class="cb-ctrl" onclick="moveComp(${b.id},1)" ${i===S.compBlocks.length-1?'disabled':''}>↓</button>
        <button class="cb-ctrl del" onclick="rmCompBlock(${b.id})">✕</button>
      </div></div>`;
    if(b.type==='text')cb.innerHTML+=`<textarea class="cb-textarea" placeholder="Texte Markdown…" oninput="S.compBlocks.find(x=>x.id===${b.id}).data.content=this.value;updateCompPreview()">${esc(b.data.content||'')}</textarea>`;
    if(b.type==='section')cb.innerHTML+=`<textarea class="cb-textarea" placeholder="Texte de section…" oninput="S.compBlocks.find(x=>x.id===${b.id}).data.text=this.value;updateCompPreview()">${esc(b.data.text||'')}</textarea>`;
    if(b.type==='buttons'){
      const bdata=b.data.buttons||[];
      cb.innerHTML+=bdata.map((btn,bi)=>`<div class="cb-row cb-3"><input class="cb-input" placeholder="Label" value="${esc(btn.label||'')}" oninput="S.compBlocks.find(x=>x.id===${b.id}).data.buttons[${bi}].label=this.value;updateCompPreview()"/>
        <select class="cb-select" onchange="S.compBlocks.find(x=>x.id===${b.id}).data.buttons[${bi}].style=+this.value;updateCompPreview()">${Object.entries(BCLR).map(([k,v])=>`<option value="${k}"${btn.style==k?' selected':''}>${v}</option>`).join('')}</select>
        <input class="cb-input" placeholder="custom_id ou URL" value="${esc(btn.custom_id||btn.url||'')}" oninput="const blk=S.compBlocks.find(x=>x.id===${b.id});const s=blk.data.buttons[${bi}].style;if(s==5){blk.data.buttons[${bi}].url=this.value;delete blk.data.buttons[${bi}].custom_id;}else{blk.data.buttons[${bi}].custom_id=this.value;delete blk.data.buttons[${bi}].url;}updateCompPreview()"/>
      </div>`).join('');
    }
    el.appendChild(cb);
  });
  const n=S.compBlocks.length;$('comp-hint').textContent=`${n} bloc${n!==1?'s':''}`;$('send-comp-btn').disabled=n===0;
}
function updateCompPreview(){
  const json=buildCompPayload();$('comp-json-pre').textContent=JSON.stringify(json,null,2);
  const n=S.compBlocks.length;$('comp-hint').textContent=`${n} bloc${n!==1?'s':''}`;$('send-comp-btn').disabled=n===0;
}
function buildCompPayload(){
  const comps=S.compBlocks.map(b=>{
    if(b.type==='text')return{type:10,content:b.data.content||''};
    if(b.type==='sep')return{type:14,divider:true,spacing:1};
    if(b.type==='buttons')return{type:1,components:(b.data.buttons||[]).map(btn=>{const c={type:2,label:btn.label||'',style:btn.style||1};if(btn.style==5)c.url=btn.url||'https://example.com';else c.custom_id=btn.custom_id||`btn_${Date.now()}`;return c;})};
    if(b.type==='section')return{type:9,components:[{type:10,content:b.data.text||''}]};
    return null;
  }).filter(Boolean);
  if($('comp-use-container')?.checked)return[{type:17,components:comps}];
  return comps;
}
async function sendComponents(){
  if(!S.channelId){toast('Sélectionnez un salon','err');return;}
  const components=buildCompPayload();
  const r=await apiPost('/api/send-components',{token:S.token,channelId:S.channelId,components});
  if(r.id){toast('Composants envoyés ✓');S.compBlocks=[];renderCompBlocks();if(!S.arTimer)await loadMessages();}
  else toast(r.message||'Erreur','err');
}

// ═══ EMOJI PICKER ═══
let epTarget='msg',epTargetIdx=-1;
function renderEmojiCats(){
  const cats=$('ep-cats');cats.innerHTML='';
  EC.forEach((c,i)=>{const btn=document.createElement('button');btn.className='ep-cat'+(i===0?' active':'');btn.textContent=c.l;btn.title=c.n;btn.onclick=()=>{document.querySelectorAll('.ep-cat').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderEmojiGrid(c.e);};cats.appendChild(btn);});
}
function renderEmojiGrid(emojis){
  const grid=$('ep-grid');grid.innerHTML='';
  if(S.guildEmojis.length){grid.innerHTML+='<div class="ep-section-label">Serveur</div>';
    S.guildEmojis.forEach(em=>{const btn=document.createElement('button');btn.className='ep-srv-emoji';btn.innerHTML=`<img src="https://cdn.discordapp.com/emojis/${em.id}.webp?size=32" loading="lazy" alt=":${em.name}:"/>`;btn.title=`:${em.name}:`;btn.onclick=()=>pickEmoji(em.name,em.id);grid.appendChild(btn);});
    grid.innerHTML+='<div class="ep-section-label">Standard</div>';}
  emojis.forEach(e=>{const btn=document.createElement('button');btn.className='ep-emoji';btn.textContent=e;btn.onclick=()=>pickEmoji(e);grid.appendChild(btn);});
}
function filterEmojis(q){
  if(!q)return renderEmojiGrid(EC.flatMap(c=>c.e));
  const ql=q.toLowerCase();renderEmojiGrid(EC.flatMap(c=>c.e).filter(e=>e.includes(ql)||EC.find(c=>c.e.includes(e))?.n.toLowerCase().includes(ql)));
}
function openEmojiPicker(evt,target,idx=-1){
  evt.stopPropagation();epTarget=target;epTargetIdx=idx;
  const pk=$('emoji-picker');pk.classList.add('show');
  const rect=evt.target.getBoundingClientRect();
  const top=rect.top-pk.offsetHeight-8;
  pk.style.left=Math.min(rect.left,window.innerWidth-310)+'px';
  pk.style.top=(top<8?rect.bottom+8:top)+'px';
  $('ep-remove-btn').style.display=(target==='ans'&&idx>=0)?'':'none';
}
function pickEmoji(emoji,emojiId=''){
  $('emoji-picker').classList.remove('show');
  if(epTarget==='msg'){const ta=$('msg-input');ta.value+=emoji;ta.focus();onType();}
  else if(epTarget==='ans'&&epTargetIdx>=0){answers[epTargetIdx].emoji=emoji;answers[epTargetIdx].emojiId=emojiId||'';renderAnswers();}
  S.activeEmojiBtn=null;
}
function removeEmoji(){if(epTarget==='ans'&&epTargetIdx>=0){answers[epTargetIdx].emoji='';answers[epTargetIdx].emojiId='';renderAnswers();}$('emoji-picker').classList.remove('show');}

// ═══ TEMPLATES ═══
function loadTemplates(){
  api('/api/templates').then(tpls=>{
    if(!Array.isArray(tpls))return;
    const list=$('tpl-list');$('tpl-count').textContent=tpls.length;
    if(!tpls.length){list.innerHTML='<div class="tpl-empty">Aucun template</div>';return;}
    list.innerHTML=tpls.map(t=>`<div class="tpl-item" onclick="applyTemplate('${esc(t.id)}')">
      <span class="tpl-item-name">${esc(t.name)}</span>
      <span class="tpl-item-type">${esc(t.type||'msg')}</span>
      <button class="tpl-item-rm" onclick="event.stopPropagation();delTemplate('${esc(t.id)}')">✕</button>
    </div>`).join('');
  });
}
function toggleTplDropdown(){$('tpl-dropdown').classList.toggle('show');}
async function saveTemplate(){
  const name=$('tpl-name-input').value.trim();if(!name)return;
  const emb=buildEmbedData();
  const tpl={name,type:S.mode,content:$('msg-input').value,embeds:emb?[emb]:[]};
  await apiPost('/api/templates',tpl);$('tpl-name-input').value='';loadTemplates();toast('Template sauvegardé ✓');
}
async function delTemplate(id){
  await fetch(`/api/templates/${id}`,{method:'DELETE'});loadTemplates();toast('Supprimé ✓');
}
function applyTemplate(id){
  api('/api/templates').then(tpls=>{const t=tpls.find(x=>x.id===id);if(!t)return;setMode(t.type||'msg');if(t.content)$('msg-input').value=t.content;onType();$('tpl-dropdown').classList.remove('show');});
}

// ═══ CHANNEL EDIT MODAL ═══
function openChanEdit(evt,chanId,name,topic,slowmode,nsfw){
  evt&&evt.stopPropagation();S.editingChanId=chanId;
  $('chan-edit-name').value=name;$('chan-edit-topic').value=topic;
  $('chan-edit-slowmode').value=slowmode||0;$('chan-edit-nsfw').checked=!!nsfw;
  $('chan-edit-modal').classList.add('show');
}
function closeChanEdit(){$('chan-edit-modal').classList.remove('show');S.editingChanId=null;}
async function saveChanEdit(){
  if(!S.editingChanId)return;
  $('chan-edit-save-btn').disabled=true;
  const r=await fetch(`/api/channel/${S.editingChanId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token:S.token,name:$('chan-edit-name').value,topic:$('chan-edit-topic').value,slowmode:$('chan-edit-slowmode').value,nsfw:$('chan-edit-nsfw').checked})}).then(r=>r.json()).catch(()=>({}));
  $('chan-edit-save-btn').disabled=false;
  if(r.id){toast('Salon modifié ✓');closeChanEdit();await selectGuild(S.guildId,true);}
  else toast(r.message||'Erreur','err');
}

// ═══ PINS MODAL ═══
async function openPins(){
  $('pins-modal').classList.add('show');
  $('pins-list').innerHTML='<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:20px">Chargement…</div>';
  const pins=await api(`/api/pins/${S.channelId}?token=${encodeURIComponent(S.token)}`);
  if(!Array.isArray(pins)||!pins.length){$('pins-list').innerHTML='<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:20px">Aucun message épinglé</div>';return;}
  $('pins-list').innerHTML=pins.map(m=>{const a=m.author||{},av=avUrl(a,64);
    return`<div class="pin-item"><img class="pin-av" src="${av}" onerror="this.style.display='none'" loading="lazy"/><div class="pin-body"><div><span class="pin-author">${esc(a.global_name||a.username||'?')}</span><span class="pin-ts">${fmtD(m.timestamp)} ${fmtT(m.timestamp)}</span></div><div class="pin-text">${esc((m.content||'[pièce jointe]').slice(0,120))}</div></div></div>`;
  }).join('');
}

