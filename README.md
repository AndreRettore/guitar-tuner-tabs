# Afinador de Violão

Afinador online para violão em afinação padrão (E A D G B E), feito em um único `index.html` com HTML, CSS e JavaScript puros — sem bibliotecas.

## Como funciona

- Captura o microfone com a Web Audio API (`getUserMedia` + `AnalyserNode`).
- Detecta a frequência com o algoritmo **YIN** (de 70 Hz a 500 Hz), com filtros passa-altas e passa-baixas para limpar o sinal e correção de erros de oitava.
- Identifica automaticamente a corda mais próxima e mostra a nota, o desvio em cents e a frequência em Hz.
- Suaviza a leitura (mediana + média móvel exponencial) e ignora sinais abaixo de um limiar de volume.
- Fica verde quando a corda está a até ±5 cents da nota.

## Uso

Abra a página, toque em **Iniciar**, permita o acesso ao microfone e toque uma corda solta.

> O navegador só libera o microfone em **HTTPS** ou em `localhost`. Para testar localmente:
>
> ```bash
> python3 -m http.server 8000
> ```
>
> e abra http://localhost:8000.

## Ajustes

As constantes no início do `<script>` controlam o limiar de volume (`RMS_MIN`), a tolerância de afinação (`IN_TUNE`) e a suavização (`EMA_READING`, `EMA_NEEDLE`).
