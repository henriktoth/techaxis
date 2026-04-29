@echo off

cd server
call npx prisma db seed
cd ..

start cmd /k "cd client && npm run dev"

start cmd /k "cd server && npm run dev"

start cmd /k "cd server && npx prisma studio"

pause