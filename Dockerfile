FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:prod \
  && mkdir -p /app/dist-output \
  && if [ -d "dist/tetris-angular/browser" ]; then \
    cp -r dist/tetris-angular/browser/. /app/dist-output/; \
  elif [ -d "dist/tetris-angular" ]; then \
    cp -r dist/tetris-angular/. /app/dist-output/; \
  else \
    echo "Dossier de build Angular introuvable dans dist/tetris-angular"; \
    exit 1; \
  fi

FROM nginx:alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist-output/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
