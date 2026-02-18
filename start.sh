#!/bin/bash

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT


(cd server && npx prisma db seed)

(cd client && npm run dev) &

(cd server && npm run dev) &

(cd server && npx prisma studio) &

wait
