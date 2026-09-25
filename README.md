# Life Tracker

App de "gestão de vida", 100% local. A primeira funcionalidade são **linhas do tempo de progresso por fotos** (emagrecimento/academia, tratamento capilar, tratamento facial e personalizado), com fotos e dados criptografados no aparelho.

- Plano: [docs/PLANO-MVP.md](docs/PLANO-MVP.md)
- Status, decisões e pendências: [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md)
- Convenções para quem for mexer no código: [AGENTS.md](AGENTS.md)

## Stack

Expo SDK 57 (dev build) · React Native 0.86 · TypeScript strict · Expo Router · SQLite com SQLCipher + Drizzle · react-native-quick-crypto (AES-256-GCM, PBKDF2) · Skia · NativeWind · i18next

## Desenvolvimento

```bash
npm install
npm run check          # typecheck + lint + prettier + testes
npm test               # Jest (projetos "app" e "skia")
npm run db:generate    # gerar migration após mudar um *.schema.ts
```

O app usa módulos nativos, então **não roda no Expo Go**. É preciso um dev build:

```bash
npx eas-cli@latest build --profile development --platform android   # ou ios
npm start                                                            # servidor de desenvolvimento
```

Testes E2E (Maestro) estão em [e2e/](e2e/).

## Arquitetura

```
src/
├── app/        # rotas (Expo Router), só composição
├── features/   # fatias verticais: progress-photos, security, backup, onboarding, settings, app-shell
├── core/       # infraestrutura: db, crypto, storage, secure-store, i18n, notifications, lifecycle
└── shared/     # UI, tema e utilitários genéricos
```

As fronteiras (`app → features → core/shared`, features isoladas entre si) são verificadas pelo ESLint.
