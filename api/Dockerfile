FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip && \
    pip install --no-cache-dir --break-system-packages openai openai-agents httpx requests python-dotenv pydantic
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"]
