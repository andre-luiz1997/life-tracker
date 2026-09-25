This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project: Life Tracker

Plano completo: `docs/PLANO-MVP.md`. App 100% local (sem backend), dados sensíveis criptografados. UI em pt-BR via i18n.

### Arquitetura (verificada pelo ESLint — `eslint-plugin-boundaries`)

- `src/app/` — somente rotas finas que reexportam telas de `features/*`.
- `src/features/<nome>/` — fatias verticais. API pública em `index.ts`; features não importam internos de outras features.
- `src/core/` — infraestrutura (db, crypto, storage, secure-store, i18n). Não conhece features.
- `src/shared/` — UI, tema e utilitários genéricos. Não importa `core` nem `features`.
- Dentro da feature: `components` → `hooks` → `services` → `repositories`. Telas nunca acessam o DB diretamente.

### Convenções

- Tabelas Drizzle ficam em `**/db/*.schema.ts`; gere migrations com `npm run db:generate` (saída em `src/core/db/migrations`, não editar à mão).
- IDs: `uuidv7()` de `@/shared/lib/id`. Timestamps: `timestamps` de `@/core/db`.
- Estilo: NativeWind v4 (Tailwind 3) com tokens semânticos (`bg-background`, `text-foreground`, `text-muted`, `bg-primary`…) definidos em `src/shared/theme/tokens.ts`.
- Todo texto visível passa por `t()`; adicione chaves em `pt-BR` e `en` (teste garante paridade).
- Testes: Jest (`jest-expo`) + RNTL v14 (`await render(...)` e `await fireEvent.press(...)`; ambos são assíncronos). Módulos nativos de crypto são substituídos pelo `node:crypto` em `test/mocks`.
- Antes de concluir: `npm run check` (typecheck, lint, prettier, testes).
- Imagens descriptografadas: sempre `cachePolicy="none"` no `expo-image` (o padrão grava em disco sem criptografia). Miniaturas via `useThumbnail` (memória), fotos cheias via `useFullPhoto` (cache temporário, limpo por `clearDecryptedPhotos`).
- Todo arquivo temporário em texto puro (câmera, seletor, manipulator) deve ser apagado com `discardTempImage` assim que for cifrado ou descartado.
- `expo-media-library`: usar a API nova (`Asset`), a antiga lança erro no SDK 57. Não passar `cameraPermission: false` ao `expo-image-picker` (bloqueia a câmera no Android).
- UI do sistema aberta pelo app (seletor de fotos, compartilhar, prompts de permissão/biometria) deve ser envolvida em `withExternalActivity` (`@/core/lifecycle`), senão dispara o auto-bloqueio e a limpeza de cache.
- Testes com Skia real: arquivos `*.skia.test.ts` rodam no projeto Jest `skia` (CanvasKit/WASM).
