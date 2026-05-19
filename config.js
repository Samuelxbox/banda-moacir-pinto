// ╔══════════════════════════════════════════════════════════════════╗
// ║              CONFIGURAÇÃO DA BANDA MOACIR PINTO                  ║
// ║                                                                  ║
// ║  Para usar com XAMPP: mude MODE de 'local' para 'api'           ║
// ║  e coloque a URL correta do seu servidor em API_URL              ║
// ╚══════════════════════════════════════════════════════════════════╝

const CONFIG = {

  // ── MODO DE FUNCIONAMENTO ──────────────────────────────────────────
  // 'local' → salva no navegador (localStorage), sem precisar de servidor
  // 'api'   → salva no banco MySQL via XAMPP (PHP no servidor)
  MODE: 'local',

  // ── URL DA API (só usada quando MODE = 'api') ──────────────────────
  // Exemplo local:  'http://localhost/banda_moacir/api'
  // Exemplo online: 'https://seusite.com.br/banda_moacir/api'
  API_URL: 'http://localhost/banda_moacir/api',

};