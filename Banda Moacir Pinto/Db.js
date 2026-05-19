// ╔══════════════════════════════════════════════════════════════════╗
// ║                     CAMADA DE DADOS (db.js)                      ║
// ║                                                                  ║
// ║  Este arquivo cuida de ONDE os dados são salvos.                 ║
// ║  O resto do sistema (app.js) não precisa saber se é              ║
// ║  localStorage ou banco MySQL — ele chama sempre as               ║
// ║  mesmas funções: DB.listar(), DB.salvar(), DB.excluir()          ║
// ╚══════════════════════════════════════════════════════════════════╝

const DB = (() => {

  // ── STORAGE LOCAL (localStorage) ────────────────────────────────────
  const STORAGE_KEY = 'banda_moacir_db_v3';

  function _carregarLocal() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      const data = s ? JSON.parse(s) : _estruturaVazia();
      // garantir que todos os campos existam
      if (!data.videos)   { data.videos   = []; data.nextId.videos   = 1; }
      if (!data.chamadas) { data.chamadas = []; data.nextId.chamadas = 1; }
      return data;
    } catch(e) {
      return _estruturaVazia();
    }
  }

  function _salvarLocal(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch(e) { console.error('Erro ao salvar no localStorage:', e); }
  }

  function _estruturaVazia() {
    return {
      musicos:      [],
      instrumentos: [],
      repertorio:   [],
      apresentacoes:[],
      videos:       [],
      chamadas:     [],
      nextId: { musicos:1, instrumentos:1, repertorio:1, apresentacoes:1, videos:1, chamadas:1 }
    };
  }

  // Dados em memória (modo local)
  let _data = _carregarLocal();

  // ── MODO LOCAL ───────────────────────────────────────────────────────
  const Local = {

    async listar(tabela) {
      return [...(_data[tabela] || [])];
    },

    async salvar(tabela, obj) {
      const lista = _data[tabela];
      if (obj.id) {
        // editar existente
        const idx = lista.findIndex(x => x.id === obj.id);
        if (idx >= 0) lista[idx] = obj;
      } else {
        // novo registro
        obj.id = _data.nextId[tabela]++;
        lista.push(obj);
      }
      _salvarLocal(_data);
      return obj;
    },

    async excluir(tabela, id) {
      _data[tabela] = _data[tabela].filter(x => x.id !== id);
      _salvarLocal(_data);
      return true;
    },

    // Chamadas têm lógica especial (salva presencas junto)
    async salvarChamada(chamada) {
      chamada.id = _data.nextId.chamadas++;
      chamada.salvoEm = new Date().toISOString();
      _data.chamadas.unshift(chamada);
      _salvarLocal(_data);
      return chamada;
    },

    async listarChamadas() {
      return [..._data.chamadas];
    },

    async excluirChamada(id) {
      _data.chamadas = _data.chamadas.filter(x => x.id !== id);
      _salvarLocal(_data);
      return true;
    }
  };

  // ── MODO API (XAMPP / PHP) ───────────────────────────────────────────
  // Quando MODE = 'api', todas as chamadas vão para o servidor PHP.
  // Você não precisa mexer aqui — só mude o config.js.
  const Api = {

    async listar(tabela) {
      const res = await fetch(`${CONFIG.API_URL}/${tabela}.php`);
      if (!res.ok) throw new Error(`Erro ao buscar ${tabela}`);
      return await res.json();
    },

    async salvar(tabela, obj) {
      const method = obj.id ? 'PUT' : 'POST';
      const res = await fetch(`${CONFIG.API_URL}/${tabela}.php`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
      if (!res.ok) throw new Error(`Erro ao salvar em ${tabela}`);
      return await res.json();
    },

    async excluir(tabela, id) {
      const res = await fetch(`${CONFIG.API_URL}/${tabela}.php?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Erro ao excluir de ${tabela}`);
      return true;
    },

    async salvarChamada(chamada) {
      const res = await fetch(`${CONFIG.API_URL}/chamadas.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chamada)
      });
      if (!res.ok) throw new Error('Erro ao salvar chamada');
      return await res.json();
    },

    async listarChamadas() {
      const res = await fetch(`${CONFIG.API_URL}/chamadas.php`);
      if (!res.ok) throw new Error('Erro ao buscar chamadas');
      return await res.json();
    },

    async excluirChamada(id) {
      const res = await fetch(`${CONFIG.API_URL}/chamadas.php?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Erro ao excluir chamada');
      return true;
    }
  };

  // ── INTERFACE PÚBLICA ────────────────────────────────────────────────
  // app.js sempre chama DB.listar(), DB.salvar(), etc.
  // Este bloco decide automaticamente se vai para Local ou Api
  // com base no CONFIG.MODE definido em config.js

  function _driver() {
    return CONFIG.MODE === 'api' ? Api : Local;
  }

  return {
    listar:         (tabela)     => _driver().listar(tabela),
    salvar:         (tabela, obj)=> _driver().salvar(tabela, obj),
    excluir:        (tabela, id) => _driver().excluir(tabela, id),
    salvarChamada:  (c)          => _driver().salvarChamada(c),
    listarChamadas: ()           => _driver().listarChamadas(),
    excluirChamada: (id)         => _driver().excluirChamada(id),
  };

})();