# 🩺 PLAN.md - Sprint 56: Validação de Deploy e Conexão Supabase

## 1. Production URL Audit
- **Objetivo:** Verificar se as Server Actions em `src/app/actions/history.actions.ts` estão usando o cliente Prisma corretamente.
- **Ação:** Checar se está puxando de `lib/prisma.ts` (ou similar) e verificar se há algum problema de configuração do adaptador `@prisma/adapter-pg` ou importações residuais do SQLite.

## 2. PWA Integrity Check
- **Objetivo:** Confirmar se o `manifest.json` está sendo servido corretamente sob o novo domínio `.vercel.app`.
- **Ação:** Inspecionar `public/manifest.json` para garantir URLs absolutas/relativas corretas (como o `start_url` e ícones) que não quebrem no ambiente de produção da Vercel.

## 3. Excel BOM Guard
- **Objetivo:** Garantir que o fix `\uFEFF` no `SettingsModal.tsx` está ativo na versão de produção para evitar bugs de acento na exportação.
- **Ação:** Inspecionar `src/components/SettingsModal.tsx` ou arquivos que geram o Excel para garantir a presença do Byte Order Mark (BOM) `\uFEFF` antes do conteúdo CSV/Excel.

---

## 🤖 Agents Envolvidos (Fase 2 - Implementação)
1. `backend-specialist`: Audita `history.actions.ts` e `lib/prisma` para conexão correta no Supabase.
2. `frontend-specialist`: Checa integridade do `manifest.json` e configuração PWA. Checa o BOM Guard no componente de exportação `SettingsModal.tsx`.
3. `test-engineer` / `security-auditor`: Roda validação do lint e possíveis scripts de checagem locais (security_scan/lint_runner) baseados nas modificações preventivas.

---

## Verificação e Testes
- A Vercel deve realizar build com sucesso após o push anterior.
- Acesso à URL Vercel deve carregar o Dashboard comunicando com o banco zerado do Postgres via Supabase.
- Exportação de Excel com acentuação mantida.
- Manifesto PWA detectado no Chrome/Safari em prod.
