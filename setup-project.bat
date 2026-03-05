@echo off
echo ==========================================
echo Configurando o Projeto Anamnese
echo ==========================================

echo [1/3] Instalando dependencias do Node...
call npm install

echo [2/3] Atualizando o banco de dados com Prisma...
call npx prisma db push

echo [3/3] Semeando o banco de dados...
call npx prisma db seed

echo ==========================================
echo Configuracao concluida!
echo Para rodar o servidor, execute: npm run dev
echo ==========================================
pause
