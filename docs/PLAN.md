# 🩺 PLAN.md - Sprint 25: Tradução Real, Diagnóstico IA e Refino de PDF

## 1. Fix PDF Labels
- **Problema:** O PDF estava utilizando as chaves (ex: `hda`) em vez dos rótulos reais (`História da Doença Atual`).
- **Solução:** No `exportPdf.ts`, vamos ler `record.template.schema` caso exista, fazer o parse do JSON associado, e criar um dicionário de mapeamento `{ id: label }`. O `autoTable` usará esse dicionário para imprimir os títulos da tabela corretamente.

## 2. Full i18n Activation
- **Implementação Base:** Utilizaremos o padrão `next-intl` (ou um middleware customizado leve que injete as _messages_ globais caso `next-intl` adicione muita complexidade, mas daremos preferência à solução padrão de dicionários de servidor).
- **Middleware:** Criar `src/middleware.ts` para capturar a rota (ou interceptar cookies/headers) e definir o `locale` atual. O cookie `locale` será atualizado na ação de salvar o perfil (`profile.actions.ts`).
- **Tradução na UI:** Envolver as views em um provedor de tradução, consumindo `src/messages/{pt,es,en}.json`.

## 3. Medical Insights Fields (Global)
- **Prompt LLM:** Atualizar `generateAnamnesis` em `src/app/actions/anamnese.actions.ts` indicando claramente que o modelo DEVE extrair / inferir adicionalmente:
  1. `hipotese_diagnostica`: Breve hipótese baseada no relato.
  2. `conduta_sugerida`: Sugestão inicial de conduta.
  3. Re-reforçar o preenchimento obrigatório de `cid_sugerido`.
- **Frontend / Form:** Incluir os campos "Hipótese Diagnóstica" e "Conduta Sugerida" no `TemplateForm` para permitir visualização/edição após a IA responder, mesmo que o template dinâmico não os tenha nativamente.

## 4. AI Template Creator
- **Backend:** Criar `src/app/actions/aiTemplate.actions.ts`. O LLM receberá uma "Especialidade" e devolverá uma estrutura JSON no formato exato que o banco espera para a coluna `schema` da tabela `Template` (ex: `{"fields": [{"id":"...", "label":"...", "type":"textarea"}]}`).
- **Frontend UX:** Criar um atalho "Gerar via IA ✨" no modal de Criação de Templates (`TemplateSelector.tsx` ou nova tela). O usuário escreve "Cardiologia - Primeira Consulta" e o sistema gera os inputs.

## 5. Fix Settings Error
- **O que ocorreu:** O erro `"Falha ao gravar configurações"` possivelmente foi originado pois o TypeScript tipou o Schema adequadamente, mas faltou assegurar que o input seja validado no Frontend ou que o Prisma retorne sem exceptions.
- **Resolução:** Como rodamos o `prisma db push` e `generate` com o novo schema contento o campo `language`, validaremos no `SettingsModal.tsx` o acionamento de um cookie no front `document.cookie = "NEXT_LOCALE=..."` concomitantemente à Action.

---

## 🤖 Agents Envolvidos (Para Fase 2)
1. `backend-specialist`: Atualiza Prompt para Insights / CID e constrói nova Action de Geração de Template. Corrige Middleware e i18n handler.
2. `frontend-specialist`: Insere Insights no Form, Conecta Geração de Template Mágica na UI e conserta os loops no PDF.
3. `test-engineer` (via scripts locais): Checa formatação e build da aplicação PWA.

---

## Verificação e Testes
- Trocar idioma em "Configurações" -> O Site deve re-renderizar imediatamente em INGLÊS.
- Gravar um áudio -> O Output na UI deve vir atracado com Diagnóstico, Conduta e CID;
- Gerar Template "Pediatria" 🪄 -> Deve criar formulário estruturado para Pediatria;
- Gerar PDF de uma anamnese -> Os labels da tabela 100% legíveis invés de IDs.
