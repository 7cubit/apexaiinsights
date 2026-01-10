# Apex AI Insights

Revolutionary WordPress Analytics plugin with an AI-powered intelligence engine.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![PHP](https://img.shields.io/badge/PHP-8.2+-purple)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Environment                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │  WordPress   │   │  Go Engine   │   │   React UI   │    │
│  │  (PHP 8.3)   │◄──│   (Fiber)    │◄──│   (Vite)     │    │
│  │  :8001       │   │   :8080      │   │   :5173      │    │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┘    │
│         │                  │                                 │
│  ┌──────▼───────┐   ┌──────▼───────┐                       │
│  │    MySQL     │   │    Redis     │                       │
│  │    :3306     │   │    :6379     │                       │
│  └──────────────┘   └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local dashboard development)
- Go 1.21+ (for local engine development)

### One-Command Setup

```bash
chmod +x setup.sh
./setup.sh
```

This will:

1. Create `.env` from template
2. Start all Docker containers
3. Install PHP dependencies
4. Build the React dashboard

### Manual Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start containers
docker compose up -d

# 3. Install PHP dependencies
docker exec apex-wp bash -c "cd /var/www/html/wp-content/plugins/apex-ai-insights && composer install"

# 4. Build dashboard
docker exec apex-dashboard npm run build
docker cp apex-dashboard:/app/../plugin-core/assets/dist/. ./plugin-core/assets/dist/
```

## 📁 Project Structure

```
apexaiinsights/
├── plugin-core/          # WordPress plugin (PHP)
│   ├── src/              # PSR-4 PHP classes
│   ├── assets/           # Frontend assets
│   │   └── dist/         # Built dashboard (generated)
│   └── composer.json
│
├── engine-go/            # Intelligence Engine (Go)
│   ├── main.go           # Entry point
│   ├── *_handler.go      # API handlers
│   └── Dockerfile
│
├── dashboard-ui/         # Admin Dashboard (React)
│   ├── src/              # React components
│   ├── vite.config.ts    # Build config
│   └── package.json
│
├── docker-compose.yml    # Container orchestration
├── setup.sh              # Automated setup
└── .env.example          # Environment template
```

## 🔧 Development

### Dashboard UI (Hot Reload)

The dashboard runs in dev mode by default at http://localhost:5173

```bash
cd dashboard-ui
npm run dev
```

### Go Engine

```bash
cd engine-go
go run .
```

### Rebuilding Dashboard

After making changes, rebuild and copy to plugin:

```bash
docker exec apex-dashboard npm run build
docker cp apex-dashboard:/app/../plugin-core/assets/dist/. ./plugin-core/assets/dist/
```

## 🌐 Access Points

| Service          | URL                                                            | Description         |
| ---------------- | -------------------------------------------------------------- | ------------------- |
| WordPress        | http://localhost:8001                                          | Main WordPress site |
| WP Admin         | http://localhost:8001/wp-admin                                 | Admin dashboard     |
| Plugin Dashboard | http://localhost:8001/wp-admin/admin.php?page=apex-ai-insights | Apex AI             |
| Dashboard Dev    | http://localhost:5173                                          | React hot reload    |
| Engine Health    | http://localhost:8080/health                                   | Go engine status    |

## 🔐 Environment Variables

See `.env.example` for all available options:

| Variable             | Required | Description               |
| -------------------- | -------- | ------------------------- |
| `OPENAI_API_KEY`     | For AI   | OpenAI API key            |
| `PERPLEXITY_API_KEY` | For AI   | Perplexity API key        |
| `JWT_SECRET`         | Yes      | API authentication secret |

## 📜 License

GPL-2.0 or later
