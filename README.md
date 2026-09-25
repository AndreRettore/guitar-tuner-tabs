# Afinador de Violão + Cifras

Site para violão em HTML, CSS e JavaScript puros — sem bibliotecas. Duas páginas, com um botão no topo para alternar entre elas:

- `index.html` — afinador em afinação padrão (E A D G B E)
- `cifras.html` — cifras com transposição de tom, diagramas de acordes, tamanho de texto e rolagem automática

## Afinador

- Captura o microfone com a Web Audio API (`getUserMedia` + `AnalyserNode`).
- Detecta a frequência com o algoritmo **YIN** (de 70 Hz a 500 Hz), com filtros passa-altas e passa-baixas para limpar o sinal e correção de erros de oitava.
- Identifica automaticamente a corda mais próxima e mostra a nota, o desvio em cents e a frequência em Hz.
- Suaviza a leitura (mediana + média móvel exponencial) e ignora sons que não passam de um limiar de volume ajustado ao ruído ambiente.
- Fica verde quando a corda está a até ±5 cents da nota.

### Uso

Abra a página, toque em **Iniciar**, permita o acesso ao microfone e toque uma corda solta.

> O navegador só libera o microfone em **HTTPS** ou em `localhost`. Para testar localmente:
>
> ```bash
> python3 -m http.server 8000
> ```
>
> e abra http://localhost:8000.

### Ajustes

As constantes no início do `<script>` controlam a sensibilidade ao volume (`RMS_FLOOR`, o mínimo absoluto, e `NOISE_MARGIN`, quanto o som precisa estar acima do ruído ambiente), a tolerância de afinação (`IN_TUNE`) e a suavização (`EMA_READING`, `EMA_NEEDLE`).

## Cifras

As músicas ficam em `musicas.js`.

### Importar de um site de cifras

1. Na página de cifras, clique em **+ Importar cifra**.
2. No site de cifras, selecione a cifra (do primeiro trecho até o fim), copie e cole no campo de texto. O PDF não serve: ele não guarda a posição dos acordes.
3. Preencha título, artista e o link da página da cifra (o tom é detectado sozinho), confira a prévia e clique em **Copiar**.
4. Cole o código no fim do `musicas.js`, antes do `];`.

### Formato manual

Para escrever uma música à mão, copie um bloco existente e edite:

```js
{
  id: 'nome-da-musica',        // aparece na URL: cifras.html#nome-da-musica
  titulo: 'Nome da Música',
  artista: 'Artista',
  tom: 'G',
  fonte: 'https://site-de-cifras.com/artista/musica/', // crédito exibido na página
  cifra: `
# Verso
[G]Letra com o acorde [C]antes da sílaba
C  G  D  Em
`,
},
```

Formato do texto: `# Título` cria uma seção, `[Acorde]` no meio da letra posiciona o acorde acima da sílaba, uma linha só com acordes é exibida como sequência, e linhas que começam com `E|`, `B|` etc. são exibidas como tablatura.

O tom transposto, o tamanho do texto e a velocidade da rolagem ficam salvos no navegador.

### Cifras privadas (com senha)

As cifras com letra ficam em duas pastas:

```
musicas/
  criptografadas/   artista-musica.enc.js + indice.js   → vão para o GitHub
  originais/        artista-musica.js (com letra)       → ficam só no computador
```

O `.gitignore` deixa passar apenas `musicas/criptografadas/`: a pasta `originais/`, e qualquer arquivo solto em `musicas/`, nunca é enviado. Sem a senha, o conteúdo dos `.enc.js` é ilegível. O `indice.js` guarda título e artista em texto aberto: com a página bloqueada, todas as músicas aparecem na lista, e abrir uma protegida pede a senha. Músicas que também existem no `musicas.js` (como Wish You Were Here) abrem a versão pública enquanto a página está bloqueada.

**Adicionar uma música (direto no site):**

1. Rode o site em `localhost` e abra **+ Importar** na página de cifras.
2. Preencha os campos, cole a cifra e digite a senha.
3. Clique em **Criptografar e salvar** e escolha a pasta `musicas/` do projeto (Chrome ou Edge). O site grava a versão criptografada em `criptografadas/` e o original em `originais/`. Em outros navegadores os arquivos vão para Downloads e precisam ser movidos para essas pastas.
4. Faça commit e push de `musicas/criptografadas/`.

Todas as músicas usam a mesma senha. Deixe marcado **Salvar também o original**: sem o original, não há como trocar a senha daquela música.

**Abrir no site:** clique numa música protegida (ou em **Desbloquear**) e digite a senha. As versões privadas substituem as públicas de mesmo id. **Lembrar neste aparelho** guarda só a chave no navegador, nunca a senha.

**Trocar a senha de todas:** rode `node criptografar.js`. Ele recriptografa todos os originais de `musicas/originais/` com a nova senha, e só roda se todas as músicas tiverem o original (senão para, sem apagar nada). Se esquecer a senha, não há como recuperar os `.enc.js`: guarde os originais com backup.

## Licença

O código está sob a [licença MIT](LICENSE). As cifras em `musicas.js` (acordes, estrutura e letras) pertencem aos respectivos autores e não são cobertas por essa licença; cada música traz o link da fonte.
