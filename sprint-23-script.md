# Sprint 23: Script de Instalação e Portabilidade

## Objetivo
Criar um guia de instalação automatizado para que o programador leve o projeto para qualquer PC.

## Tarefas (Orquestração)
- [x] Criar arquivo `setup-project.bat` (Executa npm install, prisma db push e prisma db seed).
- [x] Atualizar `README.md` com instruções de instalação (Node.js e .env).
- [x] Atualizar `.env.example` apenas com os nomes das variáveis (sem chaves parciais reais).

## Observações de Arquitetura
Como orientado no fluxo `/orchestrate`, esta atividade será realizada em duas fases principais:
- **Phase 1**: Validação deste plano.
- **Phase 2**: Execução paralela da modificação de frontend documentacional (`README`), configurações de sistema (`.bat` e `.env.example`).
