# Projeto: Sistema de Anamnese Inteligente

## 🛑 Definições Arquiteturais (Aprovadas)
Os seguintes pontos cruciais da arquitetura e segurança foram definidos:

1. **Tech Stack do Frontend (PWA):** Next.js configurado como PWA autêntico (instalável, offline-first, sem aparência de site tradicional).
2. **Processamento de Áudio & Isolamento Offline:** Transcrição 100% local (Client-side) garantindo total privacidade e funcionamento offline sem restrições.
3. **Mecanismo de Templates Médicos:** Sistema flexível e dinâmico onde o médico monta o formulário e a IA preenche os campos correspondentes automaticamente.

## Visão Geral
Sistema médico para registro de consultas com suporte completo a PWA (Offline-First), formulários dinâmicos customizáveis e uma pipeline inteligente, sem retenção, de Inteligência Artificial para gerar anamnese automatizada a partir da consulta falada.

## 🏷 Tipo de Projeto
**WEB** (PWA Frontend) + **BACKEND** (API STT/LLM)

## Critérios de Sucesso
- **Offline First:** Aplicação 100% utilizável sem internet para leitura e input manual de texto.
- **Zero Storage do Áudio:** Arquivo ou buffer de áudio é transcrito dinamicamente e apagado logo em seguida, persistindo estritamente a transcrição validada e processada no template.
- **Templates Dinâmicos:** Criação facilitada pelo próprio médico.
- **Design Sensitivo (Sem Safe Harbors):** UI confiável, nítida para uso médico (evitando o violeta), com micro-interações fluidas adaptadas ao uso com 1 mão no mobile.

## Arquitetura Recomendada (Final)
- **Frontend (`frontend-specialist`)**: Next.js (App Router) PWA usando Zustand para gerência de state, TailwindCSS (estilo sem roxo). IndexedDB local para persistir estado offline e processamento STT WebAssembly.
- **Backend (`backend-specialist`)**: API configurada para suporte assíncrono à avaliação de IA sobre as transcrições.
- **Segurança (`security-auditor`)**: Garantia OWASP, uso apenas do client para microfone, encriptação at-rest com dados de pacientes.
- **Banco de Dados (`database-architect`)**: PostgreSQL (via Prisma ou Drizzle) modelado com JSONB para suportar Templates Dinâmicos criados pelos médicos, mais row-level security.

---

## 📋 Task Breakdown (Detalhamento)

### Fase 1: Setup e Infraestrutura Base
1. [ ] **Task 1: Setup do Repositório Frontend** (Agent: `frontend-specialist`)
   - **Input:** Config inicial Next.js/Vite sem Tailwind padrão, definindo tema sob medida (ex: Slate/Emerald/Coral).
   - **Output:** Estrutura PWA básica suportando offline via Service Workers e regras de tipagem robustas.
   - **Verify:** `npm run build` && Lightouse passa testes offline.
2. [ ] **Task 2: Setup da API e DB** (Agent: `backend-specialist` + `database-architect`)
   - **Input:** Spinup do ambiente FastAPI/Node + Prisma.
   - **Output:** Servidor rodando localmente com schema e ORM prontos (User, Template, Paciente, Consulta).
   - **Verify:** Migrações passam e `schema_validator.py` retorna success.

### Fase 2: Integração de STT, LLM e Segurança Core
3. [ ] **Task 3: Motor STT Local no PWA** (Agent: `frontend-specialist`)
   - **Input:** Áudio capturado pelo microfone via navegador.
   - **Output:** Texto processado via STT (Web Speech / Web Assembly) rodando totalmente no lado do cliente.
   - **Verify:** Transcrição funciona offline, e nenhum dado de áudio trafega na rede.
4. [ ] **Task 4: Pipeline de Preenchimento LLM Inteligente** (Agent: `backend-specialist`)
   - **Input:** Texto do STT + ID do Template do Médico.
   - **Output:** Engine do LLM gerando o JSON com a anamnese recheada na estrutura do formulário esperado.
   - **Verify:** Unit test validando um áudio mock extraindo sintomas e CID corretamente.
5. [ ] **Task 5: Revisão Antecipada de Criptografia** (Agent: `security-auditor`)
   - **Input:** Módulo de conexão DB e envio para LLM APIs.
   - **Output:** Anonimizador de PII via token de substituição / Criptografia At-rest.
   - **Verify:** `security_scan.py` aprova fluxo.

### Fase 3: Client Dinâmico e Workflow PWA
6. [ ] **Task 6: Motor Frontend de Criação de Templates** (Agent: `frontend-specialist`)
   - **Input:** Props flexíveis de JSON schema.
   - **Output:** UI Builder com form elements permitindo Drag & Drop para o template das sessões.
   - **Verify:** Formulário é renderizado corretamente com a "deep design" (ausência de grids massantes).
7. [ ] **Task 7: Hook API Áudio e Sync Local** (Agent: `frontend-specialist`)
   - **Input:** View de consulta ativada e botão de Hold-to-record.
   - **Output:** Lógica de captura, lock UX offline/online, sync handler com o servidor back de LLM.
   - **Verify:** E2E com Mock Service Worker interceptando queries HTTP para comportamento em offline mode.

---

## ✅ PHASE X COMPLETE (Pendente)
- Lint: ⏳ Pendente
- Security: ⏳ Pendente
- Build: ⏳ Pendente
- Date: [A Preencher ao Final]