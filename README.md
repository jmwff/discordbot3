# ${config.botName}

A professional, high-performance, modular Discord.js v14 bot written in TypeScript and fully optimized for FiveM RP servers.

## Features

- **Modular TypeScript Architecture**: Structured commands sorted by permission tiers (Member, Staff, Admin, Leadership).
- **FiveM State Integration**: Built-in endpoints to lookup active players, in-game IDs, and server uptime.
- **Durable Warns Database**: Local warning management stored safely in a synchronized JSON database.
- **Cloud Run / Railway Ready**: Pre-packaged with `Procfile` and modular configurations for 24/7 cloud hosting.

## Project Structure

```text
├── src/
│   ├── index.ts              # Bot Entrypoint (Command handler)
│   ├── config.ts             # Live Configurations & Credentials
│   └── commands/             # Categorized Command Directory
│       ├── Member/           # General player utilities
│       ├── Staff/            # Moderator / Server Staff utilities
│       ├── Admin/            # Admin controls (Global ban, etc.)
│       └── Leadership/       # Guild & Server Administration
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Installation & Running

1. Clone or download this repository.
2. Run `npm install` to install all dependencies.
3. Create a `.env` file in the root directory (use the copy button from the builder).
4. Run `npm run dev` for hot-reloading in development.
5. Run `npm run build && npm start` to run in production.
