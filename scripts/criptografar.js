#!/usr/bin/env node
/*
  Criptografa as cifras privadas (com letra) para publicar sem expor o conteúdo.

  Uso:  node scripts/criptografar.js

  Lê os originais em musicas/originais/*.js (um por música, com letra; a pasta
  inteira fica fora do git) e gera em musicas/criptografadas/:
    <artista-musica>.enc.js   uma cifra criptografada por música
    indice.js                 lista das músicas (título e artista) e dos arquivos
  Esses arquivos gerados podem ir para o GitHub: sem a senha o conteúdo é ilegível.

  A senha é pedida no terminal e não fica salva em lugar nenhum. Todas as
  músicas são recriptografadas juntas, com a mesma senha (serve para trocar a
  senha de todas). Para adicionar uma música só, use o importador do site.

  Se existir um .enc.js sem o original correspondente, o script para: sem o
  original não dá para recriptografar, e o arquivo ficaria impossível de abrir.

  Criptografia: AES-256-GCM, com chave derivada da senha por PBKDF2-SHA256.
  O cifras.html descriptografa no navegador com a mesma senha.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const readline = require('readline');

const ITERACOES = 600000;
const ORIGINAIS = path.join(__dirname, '..', 'musicas', 'originais');
const CRIPTOGRAFADAS = path.join(__dirname, '..', 'musicas', 'criptografadas');
const INDICE = 'indice.js';
const GERADO = '// Gerado automaticamente (site de cifras ou criptografar.js); não edite à mão.\n';

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function carregar(arquivo) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(arquivo, 'utf8'), sandbox, { filename: arquivo });
  const lista = sandbox.window.MUSICAS;
  if (!Array.isArray(lista)) throw new Error(`${path.basename(arquivo)} não define window.MUSICAS`);
  return lista;
}

// Lê a senha sem mostrar o que é digitado
function perguntar(texto) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let mudo = false;
    rl._writeToOutput = s => { if (!mudo) process.stdout.write(s); };
    rl.question(texto, resposta => { rl.close(); process.stdout.write('\n'); resolve(resposta); });
    mudo = true;
  });
}

async function main() {
  if (!fs.existsSync(ORIGINAIS)) throw new Error('Pasta musicas/originais/ não encontrada.');
  const originais = fs.readdirSync(ORIGINAIS).filter(f => f.endsWith('.js')).sort();
  if (!originais.length) throw new Error('Nenhuma cifra em musicas/originais/.');
  fs.mkdirSync(CRIPTOGRAFADAS, { recursive: true });

  // Nunca perde música: todo criptografado existente precisa ter o seu original
  const nomes = new Set();
  for (const arquivo of originais)
    for (const m of carregar(path.join(ORIGINAIS, arquivo))) nomes.add(slug(`${m.artista} ${m.titulo}`));
  const semOriginal = fs.readdirSync(CRIPTOGRAFADAS).filter(f => f.endsWith('.enc.js') && !nomes.has(f.slice(0, -7)));
  if (semOriginal.length) {
    throw new Error('estes arquivos não têm o original com letra em musicas/originais/, então não\n' +
      'podem ser recriptografados (o script parou para não perdê-los):\n' +
      semOriginal.map(f => '  musicas/criptografadas/' + f).join('\n') +
      '\nPara adicionar músicas, use o importador do site. Para trocar a senha, coloque os\n' +
      'originais de todas em musicas/originais/ (ou apague os .enc.js que não quiser mais).');
  }

  const porNome = new Map();
  for (const arquivo of originais) {
    for (const musica of carregar(path.join(ORIGINAIS, arquivo))) {
      const nome = slug(`${musica.artista} ${musica.titulo}`);
      if (porNome.has(nome)) console.warn(`Aviso: "${musica.titulo}" aparece mais de uma vez; vale a última.`);
      porNome.set(nome, musica);
    }
    console.log(`Lido: musicas/originais/${arquivo}`);
  }

  // CIFRAS_SENHA permite automatizar; no uso normal a senha é digitada
  let senha = process.env.CIFRAS_SENHA;
  if (!senha) {
    senha = await perguntar('Senha: ');
    if (senha !== await perguntar('Repita a senha: ')) throw new Error('As senhas não conferem.');
  }
  if (!senha) throw new Error('Senha vazia.');
  if (senha.length < 12) {
    console.warn('Aviso: senha curta. Como os arquivos .enc.js são públicos, ela pode ser adivinhada por tentativa e erro.');
  }

  // Uma chave para todas as músicas (a senha é digitada uma vez no site); um iv por arquivo
  const sal = crypto.randomBytes(16);
  const chave = crypto.pbkdf2Sync(senha, sal, ITERACOES, 32, 'sha256');

  const musicas = [];
  for (const [nome, musica] of porNome) {
    const iv = crypto.randomBytes(12);
    const cifra = crypto.createCipheriv('aes-256-gcm', chave, iv);
    // Mesmo formato do Web Crypto: texto cifrado seguido da tag de autenticação
    const dados = Buffer.concat([cifra.update(JSON.stringify(musica), 'utf8'), cifra.final(), cifra.getAuthTag()]);
    const arquivo = `${nome}.enc.js`;
    fs.writeFileSync(path.join(CRIPTOGRAFADAS, arquivo), GERADO +
      `(window.MUSICAS_CRIPTO_DADOS = window.MUSICAS_CRIPTO_DADOS || []).push(${JSON.stringify({ iv: iv.toString('base64'), data: dados.toString('base64') })});\n`);
    // Título e artista ficam abertos no índice, para a lista mostrar as músicas bloqueadas
    musicas.push({ arquivo, id: musica.id, titulo: musica.titulo, artista: musica.artista });
  }
  musicas.sort((a, b) => a.arquivo.localeCompare(b.arquivo));

  fs.writeFileSync(path.join(CRIPTOGRAFADAS, INDICE), GERADO +
    `window.MUSICAS_CRIPTO = ${JSON.stringify({ v: 3, iter: ITERACOES, salt: sal.toString('base64'), musicas }, null, 2)};\n`);

  for (const m of musicas) console.log(`Gerado: musicas/criptografadas/${m.arquivo}`);
  console.log(`Pronto: ${musicas.length} música(s) criptografada(s).`);
}

main().catch(e => { console.error('Erro: ' + e.message); process.exit(1); });
