FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

EXPOSE 5173

# Vite necesita el flag --host para exponer el puerto desde Docker
CMD ["npm", "run", "dev", "--", "--host"]