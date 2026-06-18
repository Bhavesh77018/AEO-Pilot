FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000
# Dev server for the MVP. For prod, `npm run build` + `npm start`.
CMD ["npm", "run", "dev"]
