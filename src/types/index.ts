import { DoctorProfile, User, PatientRecord, Template, Role } from '@prisma/client';

/**
 * Ponto central de exportação das Tipagens fortes do projeto, orquestradas diretamente pelo Prisma ORM (schema.prisma).
 * Esta "estação central" reduz as chamadas descentralizadas (DRY) a toda a base de Data-Models e Enums.
 * 
 * **Enums Principais na Base:**
 * - `Plan`: Enumera a hierarquia SaaS (NORMAL, PREMIUM, ADMIN).
 * - `Role`: Define os vetos básicos no nível do ecossistema legadO (DOCTOR, PATIENT, ADMIN).
 * 
 * **Models Centrais:**
 * - `DoctorProfile`: A raiz de usuário e monetização do médico.
 * - `User`: Conta básica global do ecossistema.
 * - `PatientRecord`: Todo laudo relacional gerado com base nos Templates.
 */
export type { DoctorProfile, User, PatientRecord, Template, Role };
