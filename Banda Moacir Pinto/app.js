// ╔══════════════════════════════════════════════════════════════════╗
// ║                      LÓGICA DO SISTEMA (app.js)                  ║
// ║                                                                  ║
// ║  Este arquivo nunca acessa localStorage nem fetch diretamente.   ║
// ║  Tudo passa por DB.listar / DB.salvar / DB.excluir               ║
// ║  definidos em db.js, controlados por config.js                   ║
// ╚══════════════════════════════════════════════════════════════════╝

// ══ TOAST ═════════════════════════════════════════════════════════════════════
function showToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = tipo === 'erro' ? '#7f1d1d' : 'var(--navy)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function showErro(msg) { showToast('⚠ ' + msg, 'erro'); }

// ══ SIDEBAR ═══════════════════════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay-mob').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay-mob').classList.remove('open');
}

// ══ TABS ══════════════════════════════════════════════════════════════════════
const tabTitles = {
  dashboard:     'Painel',
  musicos:       'Músicos',
  instrumentos:  'Instrumentos',
  repertorio:    'Repertório',
  apresentacoes: 'Apresentações',
  chamada:       'Lista de Chamada',
  videos:        'Vídeos das Apresentações'
};

function switchTab(t) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes("'" + t + "'"))
      b.classList.add('active');
  });
  document.getElementById('topbar-title').textContent = tabTitles[t] || t;
  closeSidebar();
  if (t === 'musicos')       renderMusicos();
  if (t === 'instrumentos')  renderInstrumentos();
  if (t === 'repertorio')    renderRepertorio();
  if (t === 'apresentacoes') renderApresentacoes();
  if (t === 'dashboard')     renderDashboard();
  if (t === 'videos')        renderVideos();
  if (t === 'chamada')       initChamada();
}

// ══ MODAL ═════════════════════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m =>
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); })
);

// ══ UTILS ═════════════════════════════════════════════════════════════════════
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function initials(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
function stateBadge(s) {
  return { 'Ótimo': 'b-green', 'Bom': 'b-blue', 'Regular': 'b-amber', 'Necessita reparo': 'b-red' }[s] || 'b-inativo';
}
function loading(tbodyId, colunas) {
  const tb = document.getElementById(tbodyId);
  if (tb) tb.innerHTML = `<tr><td colspan="${colunas}" style="text-align:center;padding:24px;color:var(--muted)"><i class="ti ti-loader" style="animation:spin 1s linear infinite;display:inline-block"></i> Carregando...</td></tr>`;
}

// ══ YOUTUBE ═══════════════════════════════════════════════════════════════════
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function getEmbedUrl(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
function getThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}
function previewVideo() {
  const url = document.getElementById('v-url').value;
  const embed = getEmbedUrl(url);
  const prev = document.getElementById('v-preview');
  if (embed) {
    document.getElementById('v-preview-frame').src = embed;
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }
}

// ══ LIGHTBOX ══════════════════════════════════════════════════════════════════
function openLightbox(url) {
  const embed = getEmbedUrl(url);
  if (!embed) return;
  document.getElementById('lightbox-frame').src = embed + '?autoplay=1';
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.closest('.lightbox-close')) return;
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightbox-frame').src = '';
}

// ══ MÚSICOS ═══════════════════════════════════════════════════════════════════
async function renderMusicos() {
  loading('tbody-musicos', 8);
  try {
    const todos = await DB.listar('musicos');
    const q     = document.getElementById('search-musicos').value.toLowerCase();
    const naipe = document.getElementById('filter-naipe').value;
    const sit   = document.getElementById('filter-situacao').value;

    const rows = todos.filter(m =>
      (!q     || m.nome.toLowerCase().includes(q) || m.instrumento.toLowerCase().includes(q)) &&
      (!naipe || m.naipe === naipe) &&
      (!sit   || m.situacao === sit)
    );

    const tb = document.getElementById('tbody-musicos');
    if (!rows.length) {
      tb.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-music-off"></i><p>Nenhum músico encontrado</p></div></td></tr>`;
      return;
    }
    tb.innerHTML = rows.map((m, i) => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${i + 1}</td>
        <td style="font-weight:500">${m.nome}</td>
        <td><span class="badge b-blue">${m.instrumento}</span></td>
        <td><span class="badge b-purple">${m.naipe}</span></td>
        <td style="color:var(--muted)">${m.telefone}</td>
        <td style="color:var(--muted)">${fmtDate(m.ingresso)}</td>
        <td><span class="badge ${m.situacao === 'Ativo' ? 'b-ativo' : 'b-inativo'}">${m.situacao}</span></td>
        <td><div class="action-cell">
          <button class="btn sm" onclick="editMusico(${m.id})"><i class="ti ti-edit"></i> Editar</button>
          <button class="btn sm danger" onclick="deleteMusico(${m.id})"><i class="ti ti-trash"></i></button>
        </div></td>
      </tr>`).join('');
  } catch(e) { showErro('Erro ao carregar músicos'); }
}

async function editMusico(id) {
  const todos = await DB.listar('musicos');
  const m = todos.find(x => x.id === id);
  if (!m) return;
  document.getElementById('modal-musico-title').textContent = 'Editar músico';
  ['id','nome','instrumento','naipe','telefone','ingresso','situacao','obs'].forEach(f =>
    document.getElementById('m-' + f).value = m[f] || ''
  );
  openModal('modal-musico');
}

async function deleteMusico(id) {
  if (!confirm('Deseja excluir este músico?')) return;
  try {
    await DB.excluir('musicos', id);
    showToast('Músico excluído.');
    renderMusicos();
  } catch(e) { showErro('Erro ao excluir músico'); }
}

async function saveMusico() {
  const editId = parseInt(document.getElementById('m-id').value) || 0;
  const obj = {
    ...(editId ? { id: editId } : {}),
    nome:        document.getElementById('m-nome').value.trim()        || 'Sem nome',
    instrumento: document.getElementById('m-instrumento').value.trim() || '—',
    naipe:       document.getElementById('m-naipe').value,
    telefone:    document.getElementById('m-telefone').value.trim()    || '—',
    ingresso:    document.getElementById('m-ingresso').value,
    situacao:    document.getElementById('m-situacao').value,
    obs:         document.getElementById('m-obs').value.trim()
  };
  try {
    await DB.salvar('musicos', obj);
    document.getElementById('m-id').value = '';
    document.getElementById('modal-musico-title').textContent = 'Novo músico';
    closeModal('modal-musico');
    showToast(editId ? 'Músico atualizado!' : 'Músico adicionado!');
    renderMusicos();
  } catch(e) { showErro('Erro ao salvar músico'); }
}

// ══ INSTRUMENTOS ══════════════════════════════════════════════════════════════
async function renderInstrumentos() {
  loading('tbody-instrumentos', 8);
  try {
    const todos  = await DB.listar('instrumentos');
    const q      = document.getElementById('search-inst').value.toLowerCase();
    const naipe  = document.getElementById('filter-inst-naipe').value;

    const rows = todos.filter(i =>
      (!q    || i.nome.toLowerCase().includes(q) || i.responsavel.toLowerCase().includes(q)) &&
      (!naipe|| i.naipe === naipe)
    );

    const tb = document.getElementById('tbody-instrumentos');
    if (!rows.length) {
      tb.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="ti ti-tool"></i><p>Nenhum instrumento encontrado</p></div></td></tr>`;
      return;
    }
    tb.innerHTML = rows.map((i, n) => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${n + 1}</td>
        <td style="font-weight:500">${i.nome}</td>
        <td><span class="badge b-purple">${i.naipe}</span></td>
        <td style="font-family:monospace;color:var(--muted)">${i.patrimonio}</td>
        <td><span class="badge ${stateBadge(i.estado)}">${i.estado}</span></td>
        <td style="color:var(--muted)">${i.responsavel}</td>
        <td style="color:var(--muted);font-size:12px">${i.obs || '—'}</td>
        <td><div class="action-cell">
          <button class="btn sm" onclick="editInstrumento(${i.id})"><i class="ti ti-edit"></i> Editar</button>
          <button class="btn sm danger" onclick="deleteInstrumento(${i.id})"><i class="ti ti-trash"></i></button>
        </div></td>
      </tr>`).join('');
  } catch(e) { showErro('Erro ao carregar instrumentos'); }
}

async function editInstrumento(id) {
  const todos = await DB.listar('instrumentos');
  const i = todos.find(x => x.id === id);
  if (!i) return;
  document.getElementById('modal-inst-title').textContent = 'Editar instrumento';
  ['id','nome','naipe','patrimonio','estado','responsavel','obs'].forEach(f =>
    document.getElementById('i-' + f).value = i[f] || ''
  );
  openModal('modal-instrumento');
}

async function deleteInstrumento(id) {
  if (!confirm('Deseja excluir este instrumento?')) return;
  try {
    await DB.excluir('instrumentos', id);
    showToast('Instrumento excluído.');
    renderInstrumentos();
  } catch(e) { showErro('Erro ao excluir instrumento'); }
}

async function saveInstrumento() {
  const editId = parseInt(document.getElementById('i-id').value) || 0;
  const obj = {
    ...(editId ? { id: editId } : {}),
    nome:       document.getElementById('i-nome').value.trim()       || 'Sem nome',
    naipe:      document.getElementById('i-naipe').value,
    patrimonio: document.getElementById('i-patrimonio').value.trim() || '—',
    estado:     document.getElementById('i-estado').value,
    responsavel:document.getElementById('i-responsavel').value.trim()|| '—',
    obs:        document.getElementById('i-obs').value.trim()
  };
  try {
    await DB.salvar('instrumentos', obj);
    document.getElementById('i-id').value = '';
    closeModal('modal-instrumento');
    showToast(editId ? 'Instrumento atualizado!' : 'Instrumento adicionado!');
    renderInstrumentos();
  } catch(e) { showErro('Erro ao salvar instrumento'); }
}

// ══ REPERTÓRIO ════════════════════════════════════════════════════════════════
async function renderRepertorio() {
  loading('tbody-repertorio', 7);
  try {
    const todos = await DB.listar('repertorio');
    const q   = document.getElementById('search-rep').value.toLowerCase();
    const gen = document.getElementById('filter-genero').value;

    const rows = todos.filter(r =>
      (!q   || r.titulo.toLowerCase().includes(q) || r.compositor.toLowerCase().includes(q)) &&
      (!gen || r.genero === gen)
    );

    const tb = document.getElementById('tbody-repertorio');
    if (!rows.length) {
      tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="ti ti-playlist"></i><p>Nenhuma música encontrada</p></div></td></tr>`;
      return;
    }
    tb.innerHTML = rows.map((r, i) => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${i + 1}</td>
        <td style="font-weight:500">${r.titulo}</td>
        <td style="color:var(--muted)">${r.compositor}</td>
        <td><span class="badge b-purple">${r.genero}</span></td>
        <td style="color:var(--muted)">${r.duracao}</td>
        <td style="color:var(--muted);font-size:12px">${r.obs || '—'}</td>
        <td><div class="action-cell">
          <button class="btn sm" onclick="editMusicaRep(${r.id})"><i class="ti ti-edit"></i> Editar</button>
          <button class="btn sm danger" onclick="deleteMusicaRep(${r.id})"><i class="ti ti-trash"></i></button>
        </div></td>
      </tr>`).join('');
  } catch(e) { showErro('Erro ao carregar repertório'); }
}

async function editMusicaRep(id) {
  const todos = await DB.listar('repertorio');
  const r = todos.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modal-musica-title').textContent = 'Editar música';
  ['id','titulo','compositor','genero','duracao','obs'].forEach(f =>
    document.getElementById('r-' + f).value = r[f] || ''
  );
  openModal('modal-musica');
}

async function deleteMusicaRep(id) {
  if (!confirm('Deseja excluir esta música?')) return;
  try {
    await DB.excluir('repertorio', id);
    showToast('Música excluída.');
    renderRepertorio();
  } catch(e) { showErro('Erro ao excluir música'); }
}

async function saveMusicaRep() {
  const editId = parseInt(document.getElementById('r-id').value) || 0;
  const obj = {
    ...(editId ? { id: editId } : {}),
    titulo:     document.getElementById('r-titulo').value.trim()     || 'Sem título',
    compositor: document.getElementById('r-compositor').value.trim() || '—',
    genero:     document.getElementById('r-genero').value,
    duracao:    document.getElementById('r-duracao').value.trim()    || '—',
    obs:        document.getElementById('r-obs').value.trim()
  };
  try {
    await DB.salvar('repertorio', obj);
    document.getElementById('r-id').value = '';
    closeModal('modal-musica');
    showToast(editId ? 'Música atualizada!' : 'Música adicionada!');
    renderRepertorio();
  } catch(e) { showErro('Erro ao salvar música'); }
}

// ══ APRESENTAÇÕES ═════════════════════════════════════════════════════════════
async function renderApresentacoes() {
  loading('tbody-apresentacoes', 7);
  try {
    const todos = await DB.listar('apresentacoes');
    const q = document.getElementById('search-apres').value.toLowerCase();

    const rows = todos
      .filter(a => !q || a.evento.toLowerCase().includes(q) || a.local.toLowerCase().includes(q))
      .sort((a, b) => b.data.localeCompare(a.data));

    const tb = document.getElementById('tbody-apresentacoes');
    if (!rows.length) {
      tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="ti ti-calendar-off"></i><p>Nenhuma apresentação encontrada</p></div></td></tr>`;
      return;
    }
    tb.innerHTML = rows.map((a, i) => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${i + 1}</td>
        <td style="font-weight:500">${a.evento}</td>
        <td style="white-space:nowrap;color:var(--muted)">${fmtDate(a.data)}</td>
        <td style="color:var(--muted)">${a.local}</td>
        <td style="text-align:center"><span class="badge b-ativo">${a.musicos}</span></td>
        <td style="color:var(--muted);font-size:12px">${a.obs || '—'}</td>
        <td><div class="action-cell">
          <button class="btn sm" onclick="editApresentacao(${a.id})"><i class="ti ti-edit"></i> Editar</button>
          <button class="btn sm danger" onclick="deleteApresentacao(${a.id})"><i class="ti ti-trash"></i></button>
        </div></td>
      </tr>`).join('');
  } catch(e) { showErro('Erro ao carregar apresentações'); }
}

async function editApresentacao(id) {
  const todos = await DB.listar('apresentacoes');
  const a = todos.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modal-apres-title').textContent = 'Editar apresentação';
  document.getElementById('a-id').value = id;
  ['evento','data','local','musicos','obs'].forEach(f =>
    document.getElementById('a-' + f).value = a[f] || ''
  );
  openModal('modal-apresentacao');
}

async function deleteApresentacao(id) {
  if (!confirm('Deseja excluir esta apresentação?')) return;
  try {
    await DB.excluir('apresentacoes', id);
    showToast('Apresentação excluída.');
    renderApresentacoes();
  } catch(e) { showErro('Erro ao excluir apresentação'); }
}

async function saveApresentacao() {
  const editId = parseInt(document.getElementById('a-id').value) || 0;
  const obj = {
    ...(editId ? { id: editId } : {}),
    evento:  document.getElementById('a-evento').value.trim() || 'Sem nome',
    data:    document.getElementById('a-data').value          || '',
    local:   document.getElementById('a-local').value.trim()  || '—',
    musicos: parseInt(document.getElementById('a-musicos').value) || 0,
    obs:     document.getElementById('a-obs').value.trim()
  };
  try {
    await DB.salvar('apresentacoes', obj);
    document.getElementById('a-id').value = '';
    closeModal('modal-apresentacao');
    showToast(editId ? 'Apresentação atualizada!' : 'Apresentação adicionada!');
    renderApresentacoes();
  } catch(e) { showErro('Erro ao salvar apresentação'); }
}

// ══ VÍDEOS ════════════════════════════════════════════════════════════════════
async function renderVideos() {
  const cont = document.getElementById('video-grid-container');
  cont.innerHTML = '<div class="empty-state"><i class="ti ti-loader" style="animation:spin 1s linear infinite;display:inline-block"></i><p>Carregando...</p></div>';
  try {
    const todos = await DB.listar('videos');
    const q    = document.getElementById('search-video').value.toLowerCase();
    const tipo = document.getElementById('filter-video-tipo').value;

    const rows = todos
      .filter(v => (!q || v.titulo.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)) && (!tipo || v.tipo === tipo))
      .sort((a, b) => b.data.localeCompare(a.data));

    if (!rows.length) {
      cont.innerHTML = `<div class="empty-state"><i class="ti ti-brand-youtube"></i><p>Nenhum vídeo cadastrado ainda.<br>Clique em "Adicionar vídeo" para inserir um link do YouTube.</p></div>`;
      return;
    }

    const tipoColor = { Apresentação: 'b-blue', Ensaio: 'b-purple', Desfile: 'b-gold', Outro: 'b-inativo' };
    cont.innerHTML = `<div class="video-grid">${rows.map(v => {
      const thumb = getThumbnail(v.url);
      return `<div class="video-card">
        <div class="video-thumb">
          ${thumb ? `<img src="${thumb}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display='none'">` : ''}
          <div class="video-thumb-placeholder" onclick="openLightbox('${v.url}')">
            <i class="ti ti-player-play-filled"></i>
            <span>Assistir vídeo</span>
          </div>
        </div>
        <div class="video-info">
          <div class="video-title">${v.titulo}</div>
          <div class="video-meta">
            <span>${fmtDate(v.data)}</span>
            <span><span class="badge ${tipoColor[v.tipo] || 'b-inativo'}">${v.tipo}</span></span>
          </div>
          ${v.desc ? `<div style="font-size:12px;color:var(--muted);margin-top:6px">${v.desc}</div>` : ''}
        </div>
        <div class="video-actions">
          ${getEmbedUrl(v.url) ? `<button class="btn sm success" onclick="openLightbox('${v.url}')"><i class="ti ti-player-play"></i> Assistir</button>` : ''}
          ${v.url ? `<a class="btn sm" href="${v.url}" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> YouTube</a>` : ''}
          <button class="btn sm" onclick="editVideo(${v.id})"><i class="ti ti-edit"></i></button>
          <button class="btn sm danger" onclick="deleteVideo(${v.id})"><i class="ti ti-trash"></i></button>
        </div>
      </div>`;
    }).join('')}</div>`;
  } catch(e) { showErro('Erro ao carregar vídeos'); }
}

async function editVideo(id) {
  const todos = await DB.listar('videos');
  const v = todos.find(x => x.id === id);
  if (!v) return;
  document.getElementById('modal-video-title').textContent = 'Editar vídeo';
  document.getElementById('v-id').value    = id;
  document.getElementById('v-titulo').value= v.titulo;
  document.getElementById('v-url').value   = v.url;
  document.getElementById('v-data').value  = v.data;
  document.getElementById('v-tipo').value  = v.tipo;
  document.getElementById('v-desc').value  = v.desc;
  previewVideo();
  openModal('modal-video');
}

async function deleteVideo(id) {
  if (!confirm('Deseja excluir este vídeo?')) return;
  try {
    await DB.excluir('videos', id);
    showToast('Vídeo excluído.');
    renderVideos();
  } catch(e) { showErro('Erro ao excluir vídeo'); }
}

async function saveVideo() {
  const editId = parseInt(document.getElementById('v-id').value) || 0;
  const obj = {
    ...(editId ? { id: editId } : {}),
    titulo: document.getElementById('v-titulo').value.trim() || 'Sem título',
    url:    document.getElementById('v-url').value.trim(),
    data:   document.getElementById('v-data').value || '',
    tipo:   document.getElementById('v-tipo').value,
    desc:   document.getElementById('v-desc').value.trim()
  };
  try {
    await DB.salvar('videos', obj);
    document.getElementById('v-id').value = '';
    document.getElementById('modal-video-title').textContent = 'Adicionar vídeo';
    document.getElementById('v-preview').style.display = 'none';
    closeModal('modal-video');
    showToast(editId ? 'Vídeo atualizado!' : 'Vídeo adicionado!');
    renderVideos();
  } catch(e) { showErro('Erro ao salvar vídeo'); }
}

// ══ LISTA DE CHAMADA ══════════════════════════════════════════════════════════
let chamadaAtual = null;

async function initChamada() {
  document.getElementById('chamada-ativa').style.display    = 'none';
  document.getElementById('chamada-historico').style.display= 'none';
  if (!document.getElementById('chamada-data').value) {
    document.getElementById('chamada-data').value = new Date().toISOString().split('T')[0];
  }
  renderHistorico();
}

function switchChamadaView(v) {
  document.getElementById('chamada-ativa').style.display    = v === 'ativa'     ? 'block' : 'none';
  document.getElementById('chamada-historico').style.display= v === 'historico' ? 'block' : 'none';
}

async function iniciarChamada() {
  const tipo = document.getElementById('chamada-tipo').value;
  const data = document.getElementById('chamada-data').value;
  const desc = document.getElementById('chamada-desc').value.trim();
  if (!data) { showToast('Selecione a data da chamada.'); return; }

  const todos  = await DB.listar('musicos');
  const ativos = todos.filter(m => m.situacao === 'Ativo');
  chamadaAtual = { tipo, data, desc, presencas: {} };
  ativos.forEach(m => { chamadaAtual.presencas[m.id] = ''; });

  const tipoLabel = tipo === 'ensaio' ? 'Ensaio' : 'Apresentação';
  document.getElementById('chamada-titulo-header').textContent    = `${tipoLabel} — ${fmtDate(data)}`;
  document.getElementById('chamada-subtitulo-header').textContent = desc || 'Marque a presença de cada músico';

  await renderListaChamada();
  switchChamadaView('ativa');
}

async function renderListaChamada() {
  if (!chamadaAtual) return;
  const todos  = await DB.listar('musicos');
  const ativos = todos.filter(m => m.situacao === 'Ativo');
  const cont   = document.getElementById('lista-chamada');
  cont.innerHTML = ativos.map(m => {
    const p = chamadaAtual.presencas[m.id] || '';
    return `<div class="presenca-row" id="pr-${m.id}">
      <div class="presenca-avatar">${initials(m.nome)}</div>
      <div style="flex:1">
        <div class="presenca-nome">${m.nome}</div>
        <div class="presenca-instrumento">${m.instrumento} · ${m.naipe}</div>
      </div>
      <div class="presenca-toggle">
        <button class="toggle-btn ${p === 'P' ? 'presente' : ''}"    onclick="setPresenca(${m.id},'P')" title="Presente">✓</button>
        <button class="toggle-btn ${p === 'A' ? 'ausente' : ''}"     onclick="setPresenca(${m.id},'A')" title="Ausente">✗</button>
        <button class="toggle-btn ${p === 'J' ? 'justificado' : ''}" onclick="setPresenca(${m.id},'J')" title="Justificado">📝</button>
      </div>
    </div>`;
  }).join('');
  updateChamadaStats();
}

function setPresenca(id, val) {
  if (!chamadaAtual) return;
  chamadaAtual.presencas[id] = chamadaAtual.presencas[id] === val ? '' : val;
  renderListaChamada();
}

function marcarTodos(val) {
  if (!chamadaAtual) return;
  Object.keys(chamadaAtual.presencas).forEach(id => { chamadaAtual.presencas[id] = val; });
  renderListaChamada();
}

function updateChamadaStats() {
  if (!chamadaAtual) return;
  const vals = Object.values(chamadaAtual.presencas);
  document.getElementById('cs-presente').textContent    = vals.filter(v => v === 'P').length;
  document.getElementById('cs-ausente').textContent     = vals.filter(v => v === 'A').length;
  document.getElementById('cs-justificado').textContent = vals.filter(v => v === 'J').length;
}

async function salvarChamada() {
  if (!chamadaAtual) return;
  try {
    await DB.salvarChamada({ ...chamadaAtual });
    showToast('Chamada salva com sucesso!');
    chamadaAtual = null;
    switchChamadaView('historico');
    renderHistorico();
  } catch(e) { showErro('Erro ao salvar chamada'); }
}

function imprimirChamada() { window.print(); }

async function renderHistorico() {
  const cont = document.getElementById('historico-lista');
  try {
    const lista = await DB.listarChamadas();
    if (!lista.length) {
      cont.innerHTML = `<div class="empty-state"><i class="ti ti-clipboard"></i><p>Nenhuma chamada salva ainda.</p></div>`;
      return;
    }
    cont.innerHTML = lista.map(c => {
      const vals = Object.values(c.presencas);
      const p = vals.filter(v => v === 'P').length;
      const a = vals.filter(v => v === 'A').length;
      const j = vals.filter(v => v === 'J').length;
      const tipoLabel  = c.tipo === 'ensaio' ? 'Ensaio' : 'Apresentação';
      const iconColor  = c.tipo === 'ensaio' ? '#0ea5e9' : '#f59e0b';
      return `<div class="historico-card" onclick="verChamada(${c.id})">
        <div class="historico-icon" style="background:${iconColor}22">
          <i class="ti ti-clipboard-list" style="font-size:20px;color:${iconColor}"></i>
        </div>
        <div class="historico-info">
          <div class="historico-titulo">${tipoLabel} — ${fmtDate(c.data)}</div>
          <div class="historico-sub">${c.desc || 'Sem descrição'}</div>
        </div>
        <div class="presenca-badges">
          <span class="badge b-ativo">✓ ${p}</span>
          <span class="badge b-red">✗ ${a}</span>
          ${j ? `<span class="badge b-amber">📝 ${j}</span>` : ''}
          <i class="ti ti-chevron-right" style="color:var(--muted)"></i>
        </div>
      </div>`;
    }).join('');
  } catch(e) { showErro('Erro ao carregar histórico'); }
}

async function verChamada(id) {
  const lista = await DB.listarChamadas();
  const c = lista.find(x => x.id === id);
  if (!c) return;
  const tipoLabel = c.tipo === 'ensaio' ? 'Ensaio' : 'Apresentação';
  document.getElementById('modal-chamada-detalhe-title').textContent = `${tipoLabel} — ${fmtDate(c.data)}`;
  const statusMap = { P: ['✓ Presente','b-ativo'], A: ['✗ Ausente','b-red'], J: ['📝 Justificado','b-amber'], '': ['— Não marcado','b-inativo'] };
  const todos = await DB.listar('musicos');
  const rows = Object.entries(c.presencas).map(([mid, val]) => {
    const m = todos.find(x => x.id == mid);
    if (!m) return '';
    const [label, cls] = statusMap[val] || ['—','b-inativo'];
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--navy);flex-shrink:0">${initials(m.nome)}</div>
      <div style="flex:1">
        <div style="font-size:13.5px;font-weight:500">${m.nome}</div>
        <div style="font-size:11px;color:var(--muted)">${m.instrumento}</div>
      </div>
      <span class="badge ${cls}">${label}</span>
    </div>`;
  }).join('');
  document.getElementById('modal-chamada-detalhe-body').innerHTML = `
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px">${c.desc || 'Sem descrição'} · Salvo em ${new Date(c.salvoEm).toLocaleString('pt-BR')}</p>
    <div>${rows}</div>`;
  openModal('modal-chamada-detalhe');
}

// ══ DASHBOARD ═════════════════════════════════════════════════════════════════
async function renderDashboard() {
  try {
    const [musicos, instrumentos, repertorio, apresentacoes, videos, chamadas] = await Promise.all([
      DB.listar('musicos'),
      DB.listar('instrumentos'),
      DB.listar('repertorio'),
      DB.listar('apresentacoes'),
      DB.listar('videos'),
      DB.listarChamadas()
    ]);

    const ativos = musicos.filter(m => m.situacao === 'Ativo').length;
    const reparo = instrumentos.filter(i => i.estado === 'Necessita reparo').length;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card"><div class="s-label">Total de músicos</div><div class="s-value">${musicos.length}</div><div class="s-sub">${ativos} ativos</div></div>
      <div class="stat-card"><div class="s-label">Instrumentos</div><div class="s-value">${instrumentos.length}</div><div class="s-sub">${reparo} precisam reparo</div></div>
      <div class="stat-card"><div class="s-label">Repertório</div><div class="s-value">${repertorio.length}</div><div class="s-sub">músicas cadastradas</div></div>
      <div class="stat-card"><div class="s-label">Apresentações</div><div class="s-value">${apresentacoes.length}</div><div class="s-sub">registradas</div></div>
      <div class="stat-card"><div class="s-label">Vídeos</div><div class="s-value">${videos.length}</div><div class="s-sub">no acervo</div></div>
      <div class="stat-card"><div class="s-label">Chamadas</div><div class="s-value">${chamadas.length}</div><div class="s-sub">registradas</div></div>
    `;

    const naipes = {};
    musicos.forEach(m => { naipes[m.naipe] = (naipes[m.naipe] || 0) + 1; });
    const maxN = Math.max(...Object.values(naipes), 1);
    document.getElementById('chart-naipe').innerHTML = Object.entries(naipes).map(([k, v]) =>
      `<div class="bar-row"><span class="bar-label">${k}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/maxN*100)}%"></div></div><span class="bar-count">${v}</span></div>`
    ).join('');

    const generos = {};
    repertorio.forEach(r => { generos[r.genero] = (generos[r.genero] || 0) + 1; });
    document.getElementById('chart-genero').innerHTML = Object.entries(generos).map(([k, v]) =>
      `<div class="pill"><span class="pill-count">${v}</span><span class="pill-name">${k}</span></div>`
    ).join('');

    const sorted = [...apresentacoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3);
    document.getElementById('dash-apresentacoes').innerHTML = sorted.length
      ? sorted.map(a => `
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
            <div style="width:44px;height:44px;background:var(--cream2);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="ti ti-calendar-event" style="font-size:20px;color:var(--gold)"></i>
            </div>
            <div style="flex:1">
              <div style="font-weight:500;font-size:14px">${a.evento}</div>
              <div style="font-size:12px;color:var(--muted)">${fmtDate(a.data)} · ${a.local}</div>
            </div>
            <span class="badge b-ativo">${a.musicos} músicos</span>
          </div>`).join('')
      : '<p style="color:var(--muted);font-size:13px">Nenhuma apresentação registrada.</p>';

  } catch(e) { showErro('Erro ao carregar painel'); }
}

// ══ INIT ══════════════════════════════════════════════════════════════════════
document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

// Animação de loading
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

renderDashboard();