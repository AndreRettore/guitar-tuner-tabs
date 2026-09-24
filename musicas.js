/*
  Lista de cifras.

  Cada música é um objeto com:
    id       identificador usado na URL (cifras.html#id), sem espaços nem acentos
    titulo   nome da música
    artista  nome do artista
    tom      tom original (ex.: 'G', 'Am', 'F#')
    fonte    link da página de onde a cifra foi tirada (aparece como crédito)
    cifra    texto da cifra, uma linha por linha exibida

  Formato do texto da cifra:
    # Refrão                 título de seção
    C  G  Am  F              linha só de acordes
    [C]Letra com [G]acordes  acorde entre colchetes antes da sílaba onde ele entra
    E|--0--3--|              tablatura (linhas que começam com E|, B|, G|, D|, A| ou e|)
    (linha em branco)        espaço entre blocos
*/
window.MUSICAS = [

  {
    id: "wish-you-were-here",
    titulo: "Wish You Were Here",
    artista: "Pink Floyd",
    tom: "G",
    fonte: "https://www.cifraclub.com.br/pink-floyd/wish-you-were-here/",
    cifra: `
# Intro
Em7  G  Em7  G
Em7  A7(4)  Em7  A7(4)  G

# Riffs
Em7  G  Em7  G  Em7  A7(4)  Em7  A7(4)  G

# Solo 1
(solo de guitarra)

# Primeira Parte
C  D/F#  Am/E  G  D/F#  C  Am/E  G
C  D/F#  Am/E  G  D/F#  C  Am/E  G

# Solo 2
(solo de guitarra)

# Refrão
C  D/F#  Am/E  G  D/F#  C  Am/E  G

# Solo 3
(solo de guitarra)
`,
  },
];
