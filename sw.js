// Service worker: guarda o site no aparelho para funcionar sem internet.
// Com internet, busca sempre a versão nova (rede primeiro) e atualiza a cópia guardada;
// sem internet, ou com a rede demorando, usa a cópia guardada.

const CACHE = 'violao-v1';
const CRIPTO = 'musicas/criptografadas/';
const INDICE = CRIPTO + 'indice.js';
const BASE = [
  './',
  'index.html',
  'cifras.html',
  'musicas.js',
  'manifest.json',
  'img/favicon.svg',
  'img/apple-touch-icon.png',
  'img/icon-192.png',
  'img/og-image.png',
  INDICE,
];
const ESPERA = 3000; // ms esperando a rede antes de usar a cópia guardada

const url = caminho => new URL(caminho, self.registration.scope).href;
const buscar = u => fetch(u, { cache: 'no-cache' });

// Só guarda arquivos do site; de musicas/ só a pasta criptografada (fila.js e originais ficam de fora)
function guardavel(u) {
  const escopo = self.registration.scope;
  if (!u.startsWith(escopo)) return false;
  const caminho = u.slice(escopo.length).split(/[?#]/)[0];
  return !caminho.startsWith('musicas/') || caminho.startsWith(CRIPTO);
}

// Lê os nomes dos .enc.js no texto do indice.js (vale para os formatos v2 e v3)
const arquivosDoIndice = texto => [...new Set(texto.match(/[\w.-]+\.enc\.js/g) || [])].map(a => url(CRIPTO + a));

// Guarda os .enc.js que faltam e apaga os que saíram do índice
async function sincronizarCifras(cache, texto) {
  const lista = arquivosDoIndice(texto);
  const atuais = new Set(lista);
  const guardados = (await cache.keys()).map(r => r.url).filter(u => u.endsWith('.enc.js'));
  await Promise.all(guardados.filter(u => !atuais.has(u)).map(u => cache.delete(u)));
  const tem = new Set(guardados);
  await Promise.all(lista.filter(u => !tem.has(u)).map(async u => {
    try {
      const r = await buscar(u);
      if (r.ok) await cache.put(u, r);
    } catch {}
  }));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(BASE.map(async c => {
      try {
        const r = await buscar(url(c));
        if (r.ok) await cache.put(url(c), r);
      } catch {}
    }));
    const indice = await cache.match(url(INDICE));
    if (indice) await sincronizarCifras(cache, await indice.text());
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const nome of await caches.keys()) if (nome !== CACHE) await caches.delete(nome);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !guardavel(req.url)) return;
  const u = req.url.split('#')[0];

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const rede = buscar(u).then(async r => {
      if (r.ok) {
        await cache.put(u, r.clone());
        if (u === url(INDICE)) await sincronizarCifras(cache, await r.clone().text());
      }
      return r;
    });
    event.waitUntil(rede.catch(() => {}));

    const guardada = await cache.match(u, { ignoreSearch: true });
    if (!guardada) return rede;
    const espera = new Promise(ok => setTimeout(ok, ESPERA, guardada));
    return Promise.race([rede.then(r => r.ok ? r : guardada, () => guardada), espera]);
  })());
});
