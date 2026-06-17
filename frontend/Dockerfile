# ─── Development stage ───────────────────────────────────────────────────────
FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM dev AS build

ARG VITE_API_URL
ARG VITE_STREAM_URL

RUN npm run build

# ─── Production stage (nginx) ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
