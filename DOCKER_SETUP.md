# Docker Setup s OrbStack - My Dashboard

Tento dokument popisuje, ako spustiť kompletný development stack pomocou Docker a OrbStack.

## 📋 Čo je zahrnuté

- **MySQL 8.0** - Databázový server
- **Backend API** - Node.js + Express + TypeScript + Prisma
- **Hot Reload** - Automatické reloadovanie pri zmenách kódu

## 🚀 Rýchly štart

### 1. Skontrolujte .env súbor

Skopírujte `.env.example` do `.env` a aktualizujte hodnoty:

```bash
cp .env.example .env
```

**Dôležité:** V `.env` nastavte tieto hodnoty:

```env
# MySQL Database
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=dashboard_db
MYSQL_USER=dashboard_user
MYSQL_PASSWORD=dashboard_pass

# Database URL (použite 'mysql' ako hostname pre Docker)
DATABASE_URL="mysql://dashboard_user:dashboard_pass@mysql:3306/dashboard_db"

# Vaše skutočné Google OAuth credentials
GOOGLE_CLIENT_ID="váš-google-client-id"
GOOGLE_CLIENT_SECRET="váš-google-client-secret"

# JWT secret (vygenerujte vlastný)
JWT_SECRET="nejaký-dlhý-tajný-kľúč-min-32-znakov"

PORT=4000
```

### 2. Spustite Docker stack

```bash
# Spustite všetky služby (MySQL + Backend)
docker-compose up -d

# Alebo s logmi v konzole:
docker-compose up
```

Prvé spustenie môže trvať 2-3 minúty (sťahovanie images, build, migrácie).

### 3. Overenie, že všetko beží

```bash
# Skontrolujte stav služieb
docker-compose ps

# Skontrolujte logy backendu
docker-compose logs -f backend

# Skontrolujte logy MySQL
docker-compose logs -f mysql
```

Backend by mal byť dostupný na: **http://localhost:4000**

Test health endpoint:
```bash
curl http://localhost:4000/health
```

## 🔧 Užitočné príkazy

### Základné operácie

```bash
# Spustenie stacku
docker-compose up -d

# Zastavenie stacku
docker-compose down

# Zastavenie + zmazanie volumes (POZOR: zmaže databázu!)
docker-compose down -v

# Reštart služieb
docker-compose restart

# Reštart len backendu
docker-compose restart backend
```

### Práca s databázou

```bash
# Pripojenie do MySQL kontajnera
docker-compose exec mysql mysql -u dashboard_user -p
# Heslo: dashboard_pass

# Spustenie Prisma migrácií
docker-compose exec backend npx prisma migrate deploy

# Generovanie Prisma Client
docker-compose exec backend npx prisma generate

# Prisma Studio (GUI pre databázu)
docker-compose exec backend npx prisma studio
```

### Práca s backendom

```bash
# Zobrazenie logov
docker-compose logs -f backend

# Vstup do backend kontajnera (bash)
docker-compose exec backend sh

# Reštart backendu (po zmene dependencies)
docker-compose restart backend

# Rebuild backendu
docker-compose up -d --build backend
```

### Debugovanie

```bash
# Skontrolujte všetky bežiace kontajnery
docker ps

# Skontrolujte Docker network
docker network ls

# Skontrolujte volumes
docker volume ls

# Vyčistite nepoužívané resources
docker system prune -a
```

## 📁 Štruktúra súborov

```
backend/
├── docker-compose.yml      # Definícia celého stacku
├── Dockerfile              # Build konfigurácia pre backend
├── .dockerignore           # Súbory ignorované pri build
├── .env                    # Environment variables (necommitujte!)
├── .env.example            # Šablóna pre .env
├── src/                    # Backend kód (hot reload)
├── prisma/                 # Prisma schéma a migrácie
└── DOCKER_SETUP.md         # Tento súbor
```

## 🔌 Pripojenie z frontendu

Frontend (React) by mal používať:

```env
VITE_API_BASE_URL="http://localhost:4000/api"
```

CORS je nakonfigurované pre `http://localhost:5173` (Vite default port).

## 🛠️ Riešenie problémov

### Backend sa nespustí

```bash
# Skontrolujte logy
docker-compose logs backend

# Častý problém: MySQL nie je ready
# Riešenie: Počkajte 30s a reštartujte backend
docker-compose restart backend
```

### Chyba "Prisma Client not found"

```bash
# Znova vygenerujte Prisma Client
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

### Port 3306 alebo 4000 už používaný

```bash
# Zistite, čo používa port
lsof -i :3306
lsof -i :4000

# Zastavte lokálny MySQL/backend a použite Docker
```

### MySQL connection refused

```bash
# Skontrolujte, či MySQL kontajner beží
docker-compose ps mysql

# Skontrolujte health check
docker-compose logs mysql

# Reštartujte MySQL
docker-compose restart mysql
```

### Potrebujem fresh databázu

```bash
# POZOR: Toto zmaže všetky data!
docker-compose down -v
docker-compose up -d

# Spustite migrácie a seed
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx tsx prisma/seed.ts
```

## 🎯 Development workflow

1. **Spustite Docker stack raz ráno**
   ```bash
   docker-compose up -d
   ```

2. **Upravujte kód normálne** - zmeny sa automaticky reloadujú vďaka volumes

3. **Keď pridáte dependencies**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Keď meníte Prisma schému**
   ```bash
   docker-compose exec backend npx prisma migrate dev --name nazov_zmeny
   ```

5. **Koniec dňa - vypnite stack**
   ```bash
   docker-compose down
   ```

## 🌟 Výhody OrbStack

- ⚡ **Rýchlejší** než Docker Desktop (3-5x)
- 💾 **Menej RAM** (700MB vs 3GB)
- 🖥️ **Lepšia integrácia** s macOS
- 🎨 **Prehľadné UI** pre správu kontajnerov

Otvorte OrbStack aplikáciu a uvidíte všetky bežiace kontajnery.

## 📊 Monitorovanie

V OrbStack UI môžete vidieť:
- Zoznam kontajnerov
- CPU a RAM usage
- Logy v reálnom čase
- Port mappings
- Volumes a networks

## 🔐 Produkčný deployment

Pre produkciu upravte:

1. **Dockerfile** - použite production build:
   ```dockerfile
   CMD ["node", "dist/index.js"]
   ```

2. **docker-compose.yml** - odstráňte dev volumes

3. **Environment variables** - použite strong passwords

4. **CORS** - nastavte produkčnú doménu

## 📚 Ďalšie zdroje

- [OrbStack dokumentácia](https://docs.orbstack.dev/)
- [Docker Compose docs](https://docs.docker.com/compose/)
- [Prisma Docker guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

---

**Vytvorené:** 2026-01-13
**Autor:** Claude Code + OrbStack setup
