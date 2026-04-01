# Anamnese Inteligente PWA - Manual Técnico de Arquitetura e Engenharia

Este documento detalha o funcionamento das engrenagens internas da aplicação, focando na reestruturação arquitetural recente envolvendo monetização, segurança de dados em nuvem e features avançadas de UX.

---

## 1. Arquitetura de Subsrição SaaS (Modelagem de Tiers)

O sistema foi pivotado para um modelo _Software As A Service_ (SaaS) restritivo.

### 1.1 Modelagem Prisma (Database)
Os profissionais acessam a aplicação através de instâncias de `DoctorProfile`. Para monetização, esse modelo recebeu o injetor:
```prisma
enum Plan {
  NORMAL
  PREMIUM
  ADMIN
}

model DoctorProfile {
  ...
  plan      Plan     @default(NORMAL)
  isActive  Boolean  @default(true)
  expiresAt DateTime?
}
```

### 1.2 Regras de Negócio e Upgrades (`auth.actions.ts`)
1. **Cadastro Base**: O método `registerUser` atrela invariavelmente o nível de privilégio `NORMAL` a qualquer novo médico.
2. **Promover Tier (Upgrade)**: Desenvolvemos o método `upgradeToPremium(userId)`. Acioná-lo eleva o atributo para `PREMIUM` conferindo uma validade `expiresAt` automática de 30 dias.

### 1.3 Travas Lógicas na Camada Front-End
O sistema bloqueia ativamente recursos caros ou avançados checando dinamicamente `profile.plan`:
- O componente `AudioRecorder` oculta o motor generativo de IA e emite um _Paywall Visual_ (🔒) forçando o _Upsell_.
- O `TemplateForm` desativa a função "⚡ Puxar Dados Base" limitando o preenchimento automático a assinantes.
- O `/admin` exige `profile.role === 'ADMIN'` confirmado diretamente no banco para blindar a rota via `layout.tsx`. 

---

## 2. Segurança e LGPD - Criptografia em Repouso

Para estar alinhado às estritas normas de sigilo da área de saúde (LGPD e HIPAA), implementamos um escudo _Deep-Security_.

### 2.1 Criptografia Determinística (`src/lib/security.ts`)
O nome identificável dos pacientes nunca "encosta" no disco do banco de dados exposto; sempre cifrado.

- **O Motor**: `encryptDeterministic()` e `decryptDeterministic()`.
- **Implementação Tática**: Usamos `aes-256-cbc` com um IV estático (Vetor de Inicialização amarrado com `Buffer.alloc(16, 0)`).
- **Justificativa do IV Estático**: Uma "Criptografia forte não determinística" criaria um hash impossível de ser buscado pelo Prisma (sem descriptografar milhões de tuplas num SELECT longo). Ao fixar o IV, a string gerada para "Carlos" será *sempre a mesma hash*, permitindo que buscas no _Prisma Client_ como `where: { patientName: equals: hash("Carlos") }` tragam instantaneamente todos os prontuários de um paciente, assegurando segurança no banco **E** performance (índices _B-Tree_) na busca.

### 2.2 Blindagem Anti-XSS (Sanitização)
* A função `sanitizeObj(data)` atua como um desinfetante recursivo.
* Antes do _payload JSON_ de qualquer anamnese atingir a persistência Prisma, ele atravessa este filtro, erradicando todas as tags HTML (`<script>`, `<iframe>`) e ataques furtivos via _String Payload_.

---

## 3. Assistente Generativo (IA) e Monitoramento Clínico

### 3.1 Extração de Contexto Biométrico
O módulo de IA opera extraindo "insights invisíveis". Embora o formulário principal colete a anamnese orgânica, o modelo extrai paralelamente indicadores paramétricos da conversa natural.

#### Gráficos Resumo de Evolução Ponderal e IMC
Dentro do repositório lógico de histórico (`TemplateForm` e utilitários), o sistema varre iterativamente as consultas antigas de um paciente recorrente `getRecentPatientHistory()`:
1. **Extração Regex Ligeira**: Ele quebra o histórico em pacotes orientados por data/sessão, buscando os termos `Peso: X` e `Altura: Y`.
2. **Conversores Customizados**: `parsePeso` converte textos poluídos como _`"Pesando 85,4 kilos"`_ diretamente no `float` paramétrico de 85.4.
3. **Pintura e Rastreio**: Com a união paramétrica (Massa x Estatura), rodamos `calcularIMC()`.
4. **_Feedback_ Visual Mapeado**: O array iterado alimenta um painel visual Recharts (`<AreaChart>`), onde inserimos _Gradients Verdes_ sobre uma linha do tempo invisível para gerar a curva da "Evolução Ponderal". O médico adquire insights vitais de que "*Paciente ganhou 4kg nas últimas 2 consultas*" antes mesmo do paciente expressá-lo ativamente.

---

### Organização Técnica do Repositório (Arquitetura Revisada)
- `src/app/actions`: Rotas server-side hiper-protegidas via diretiva `"use server"` controlando permissões.
- `src/components/medical`: Repositório restritivo contendo os _Core-Components_ como `AudioRecorder` e `InsightsPreviewModal`.
- `src/lib`: Bibliotecas Core (`prisma.ts`, `security.ts`, engrenagens vitais do projeto).
- `src/types/index.ts`: Hub centralizador que acopla tipagens puras repassadas da estrutura de ORM do Prisma.
- `src/utils`: Componentes agnósticos (auxiliares lógicos, validações manuais).

> [!WARNING]
> Quaisquer modificações futuras no `security.ts` envolvendo a `ENCRYPTION_KEY` acarretará o travamento da decodificação de prontuários pretéritos. Realizar backup ou rotatividade de chave planejada antes de tal manobra.
