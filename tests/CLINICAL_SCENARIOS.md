# Cenários Clínicos (CLINICAL_SCENARIOS.md)
Autor: `test-engineer`
Objetivo: Validar a capacidade de extração estruturada do modelo com casos altamente complexos.

## Cenário 1: Cardiopata Geriátrico com Alta Carga Medicamentosa
**Descrição**: Paciente de 78 anos, admitido com dispneia aos pequenos esforços, ortopneia e edema de membros inferiores. Refere ser hipertenso, diabético tipo 2 e ter sofrido IAM há 5 anos. Relata não ter alergias conhecidas.
**Medicamentos em Uso**:
- Losartana 50mg, 12/12h
- Hidroclorotiazida 25mg, pela manhã
- Metformina 850mg, após as refeições (2x ao dia)
- AAS 100mg, após o almoço
- Atorvastatina 40mg, à noite

### Resultados Esperados (Validação da IA):
- `paciente_idade_extraida`: 78
- `hipotese_diagnostica`: Insuficiência Cardíaca Descompensada, Hipertensão Arterial Sistêmica, Diabetes Mellitus Tipo 2, Pós IAM.
- `medicamentos_em_uso`: Deve listar todas as 5 drogas com as respectivas posologias sem truncamentos.
- `alergias`: Nega. (Não deve inventar alergias).

---

## Cenário 2: Gestante com Alergia Incomum e Restrição de Fármacos
**Descrição**: Paciente de 28 anos, gestante (G2P1A0) de 14 semanas, apresenta queixa de dor lombar à direita e disúria há 3 dias, associada a febre de 38.2°C medida em domicílio há 2 horas. Relata ser extremamente alérgica a dipirona e amoxicilina (descreve rash cutâneo grave e edema de glote). 

### Resultados Esperados (Validação da IA):
- `historia_gestacional`: Gestante 14 semanas (G2P1A0).
- `queixa_principal` / `sintomas`: Dor lombar à direita, disúria, dor há 3 dias, febre 38.2°C recente.
- `alergias`: "Dipirona", "Amoxicilina" - DEVE constar expressamente para evitar prescrição inadvertida.
- `hipotese_diagnostica`: Pielonefrite Aguda ou ITU associada à gestação.
- `conduta_sugerida`: Prescrição de antibióticos seguros na gestação (e.g. Cefalosporinas) devido à alergia a penicilinas, analgesia compatível (evitando dipirona).

---

## Cenário 3: Paciente Psiquiátrico com Relato Confuso e Múltiplas Queixas Difusas
**Descrição**: Paciente de 45 anos, histórico de esquizofrenia paranoide mal controlada. Trazido por familiar por estar "escutando vozes que mandam quebrar as coisas" há 2 semanas. Durante a consulta queixa-se de "dores na barriga porque tem um peixe vivo no estômago". Não relata uso correto de medicações por "medo do governo". Evidencia sudorese, taquicardia (FC 115) e tremores nas mãos.

### Resultados Esperados (Validação da IA):
- `queixa_principal`: Escutando vozes há 2 semanas, delírio somático ("peixe vivo no estômago").
- `sintomas_fisicos_extraidos`: Sudorese profusa, taquicardia (FC 115 bpm), tremores nas mãos.
- `observacoes_gerais`: Relato obtido de familiar, paciente confuso/delirante, má adesão medicamentosa.
- `hipotese_diagnostica`: Surto Psicótico (Esquizofrenia Descompensada).
- `conduta_sugerida`: Manejo emergencial da agitação, possível contenção química ou estabilização antipsicótica e revisão da medicação (Haloperidol, etc).
