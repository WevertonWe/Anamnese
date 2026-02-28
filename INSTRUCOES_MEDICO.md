# 🩺 Agendha - Guia de Início Rápido

Bem-vindo ao sistema de Anamnese Inteligente Agendha. 
Este sistema interligará sua fala naturamente dita no consultório a uma Anamnese médica estruturada (Padrão SOAP ou customizada) utilizando Inteligência Artificial, de forma super rápida e totalmente privativa (Os áudios não são retidos no servidor).

---

## 1️⃣ Configurando a Inteligência Artificial

Antes de usar o processamento da transcrição, o sistema precisa da sua chave de acesso à OpenAI (ChatGPT) ou Google Gemini.

1. Acesse o servidor onde sua API/Aplicação está rodando, ou abra o arquivo **`.env`** na raiz do projeto.
2. Mude ou insira a linha contendo sua variável de API. Por exemplo, se usar o Google:
   \`\`\`env
   GEMINI_API_KEY="AIzaSy...Sua_Chave_Inteira..."
   \`\`\`
   <br/>*(Consulte o arquivo `.env.example` para as variáveis exatas).*
3. O sistema reconhecerá automaticamente e já enviará as análises.

---

## 2️⃣ Como usar a UI de Gravação e Extração

1. Na **Página Inicial (Nova Consulta)**, clique no ícone de Microfone Grande verde.
2. Conceda **permissão de Microfone** no seu navegador caso seja a primeira vez.
3. Fale as queixas do paciente naturalmente: *"Paciente chegou queixando de dor no ombro esquerdo há 3 semanas, nega trauma..."*
4. Clique no **quadrado vermelho** para parar de gravar.
5. Um botão preto **"Processar Clínico (IA)"** vai aparecer. Basta clicar.
6. Aguarde alguns segundos na animação enquanto a Inteligência Artificial faz a filtragem rigorosa das informações. O resultado virá organizado nas caixas prontas para o seu prontuário (E com as sugestões de CID-10)!

---

## 3️⃣ Painel de Templates (Estruturas Dinâmicas)

Se você precisa de uma estrutura diferente do SOAP clássico (Ex: Um layout só para Retornos de Ortopedia):
- No painel da direita "Estrutura de Preenchimento", o sistema lista os Templates.
- Se você acessar por um link futuramente e preencher os dados do banco PostgreSQL (Através do gerenciador conectado ao Prisma), os novos itens aparecerão ali automaticamente.
- A IA do componente *sempre tentará preencher o conteúdo baseando-se no Template* que estiver sendo exibido.

> **Modo Offline-First (PWA)**
> O Agendha foi feito para consultórios e hospitais. Você pode instalar o Agendha como Aplicativo tanto no iOs quando no Android.
> Gravações de áudios continuam sendo permitidas sem internet, armazenadas no seu celular de forma temporária até o reencontro do Wi-Fi.

Qualquer dúvida sistêmica, contate o administrador de infraestrutura médica.
