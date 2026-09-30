# Life Tracker — Plano de Implementação do MVP

> Funcionalidade inicial: **Linhas do tempo de progresso por fotografias** (emagrecimento/academia, tratamento capilar, tratamento facial e genérico), 100% local, com proteção por PIN/biometria e fotos criptografadas.

---

## 1. Decisões já tomadas

| Tema | Decisão |
|---|---|
| Base | **Expo (SDK 57) com dev build** + TypeScript strict. Expo Go não será usado (módulos nativos). Builds via **EAS** (permite gerar iOS a partir do Linux). |
| Acesso | **PIN 4–6 dígitos opcional + biometria** opcional como atalho. |
| Fotos | Pasta privada do app (sandbox) **+ criptografia AES-256-GCM**. Fotos da câmera do app nunca vão para a galeria. |
| Importação | Após importar da galeria, **oferecer "Remover da galeria?"** (confirmação do sistema). |
| Edição | Recortar/girar/espelhar, brilho/contraste, censura/desfoque, alinhamento com a foto anterior. |
| Extras do MVP | Comparação antes/depois, métricas por registro, lembretes locais, backup/exportação. |
| Idioma | pt-BR via arquivos de tradução (i18n pronto para en). |
| Contas | Nenhuma. 1 pessoa por instalação. Sem backend. |

---

## 2. Stack técnica

| Camada | Biblioteca | Motivo |
|---|---|---|
| Navegação | `expo-router` (file-based, `Stack.Protected`) | Rotas tipadas; rotas protegidas para a tela de bloqueio. |
| Banco local | `expo-sqlite` com **SQLCipher** (`useSQLCipher` no config plugin) + **Drizzle ORM** | Banco inteiro criptografado (métricas como peso são sensíveis); migrations versionadas; `useLiveQuery` para UI reativa. |
| Estado de UI/sessão | `zustand` | Leve; só para estado efêmero (sessão desbloqueada, rascunho de captura/edição). Dados persistentes vivem no SQLite. |
| Câmera | `expo-camera` (`CameraView`) | Suficiente para overlay fantasma, grade, timer, troca de câmera. `takePictureAsync` grava no cache, não na galeria. |
| Sensores | `expo-sensors` (`DeviceMotion`) | Indicador de nível/inclinação e disparo automático (modo coroa). |
| Galeria | `expo-image-picker` (seleção) | Importar fotos. |
| Edição | `expo-image-manipulator` (crop/rotate/flip/resize) + `@shopify/react-native-skia` (color matrix, blur de regiões, composição) | Skia também serve para comparação e gráficos. |
| Gestos/animação | `react-native-gesture-handler` + `react-native-reanimated` | Pinch/pan no editor, slider de comparação. |
| Criptografia | `react-native-quick-crypto` (JSI, API do Node `crypto`) | AES-GCM e PBKDF2 rápidos, nativos. |
| Segredos | `expo-secure-store` (Keychain/Keystore) | Chave mestra, chave do DB, hash do PIN. |
| Biometria | `expo-local-authentication` | Face ID / digital. |
| Privacidade de tela | `expo-screen-capture` + overlay no `AppState` inativo | Bloquear screenshot (opcional) e ocultar no alternador de apps. |
| Arquivos | `expo-file-system` (nova API `File`/`Directory`) | Leitura/escrita no sandbox. |
| Exibição de imagem | `expo-image` | Cache e performance. |
| Lembretes | `expo-notifications` (somente locais) | Agendamento por linha do tempo. |
| Backup | `react-native-zip-archive` + `expo-sharing` + `expo-document-picker` | Gerar/compartilhar/importar o arquivo de backup. |
| Gráficos | `victory-native` (Skia) | Evolução de métricas. |
| Formulários | `react-hook-form` + `zod` | Validação tipada, schemas reaproveitados. |
| i18n | `i18next` + `react-i18next` + `expo-localization` | |
| Estilo | `nativewind` (Tailwind) + tokens de tema (claro/escuro) | Padrão moderno, produtivo. |
| Qualidade | ESLint (flat config, `eslint-config-expo`) + Prettier + `eslint-plugin-boundaries` | Impõe as fronteiras da arquitetura. |
| Testes | `jest-expo` + React Native Testing Library; **Maestro** para E2E | |
| CI | GitHub Actions: lint, typecheck, testes; EAS Build sob demanda | |

---

## 3. Arquitetura

**Feature-based (vertical slices) com camadas simples.** Cada funcionalidade futura (hábitos, finanças, humor…) vira uma nova pasta em `features/` sem tocar nas demais.

Regras:
1. `app/` contém **apenas rotas** finas: importam telas de `features/*` e nada mais.
2. Uma feature expõe sua API pública por `features/<nome>/index.ts`. **Features não importam internos de outras features.**
3. `core/` = infraestrutura (DB, cripto, arquivos, segurança, i18n). Não conhece features.
4. `shared/` = UI e utilitários genéricos, sem regra de negócio.
5. Dependências permitidas: `app → features → (core, shared)`; `core ↛ features`; `shared ↛ core/features`. Verificado pelo ESLint.
6. Dentro da feature: `components` (UI) → `hooks` (orquestração) → `services` (regras) → `repositories` (acesso a dados). Telas nunca chamam o DB diretamente.

```
life-tracker/
├── app.config.ts                 # config Expo + plugins (sqlcipher, camera, image-picker…)
├── eas.json
├── drizzle.config.ts
├── docs/
├── e2e/                          # fluxos Maestro
└── src/
    ├── app/                      # Expo Router (rotas finas)
    │   ├── _layout.tsx           # providers + Stack.Protected (bloqueio)
    │   ├── lock.tsx
    │   ├── onboarding/
    │   ├── (tabs)/
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx         # Início: lista de linhas do tempo
    │   │   └── settings.tsx
    │   └── timeline/
    │       ├── new.tsx
    │       └── [timelineId]/
    │           ├── index.tsx     # timeline
    │           ├── capture.tsx   # câmera (?angleId=)
    │           ├── edit.tsx      # editor
    │           ├── compare.tsx
    │           ├── metrics.tsx
    │           └── entry/[entryId].tsx
    │
    ├── features/
    │   ├── progress-photos/      # a funcionalidade do MVP
    │   │   ├── index.ts
    │   │   ├── templates/        # modelos declarativos (dados, não código)
    │   │   │   ├── weight-loss.ts
    │   │   │   ├── hair.ts
    │   │   │   ├── face.ts
    │   │   │   ├── custom.ts
    │   │   │   └── overlays/     # silhuetas SVG por ângulo
    │   │   ├── capture/          # câmera, ghost, nível, timer, modo coroa
    │   │   ├── editor/           # pipeline de edição
    │   │   ├── compare/
    │   │   ├── metrics/
    │   │   ├── timeline/
    │   │   ├── db/schema.ts      # tabelas Drizzle da feature
    │   │   ├── repositories/
    │   │   ├── services/         # ex.: photo.service.ts (salvar = editar+cifrar+gravar+DB)
    │   │   ├── hooks/
    │   │   └── types.ts
    │   ├── security/             # PIN, biometria, auto-lock, privacy screen
    │   ├── reminders/
    │   ├── backup/
    │   ├── onboarding/
    │   └── settings/
    │
    ├── core/
    │   ├── db/                   # cliente, abertura com chave SQLCipher, migrations
    │   ├── crypto/               # aes-gcm, kdf, gestão de chaves
    │   ├── storage/              # secure-file-store (grava/lê .enc, cache temporário)
    │   ├── secure-store/
    │   ├── i18n/                 # config + locales/pt-BR/*.json
    │   └── config/
    │
    └── shared/
        ├── ui/                   # Button, Text, Sheet, EmptyState, PinPad…
        ├── theme/
        ├── hooks/
        └── lib/                  # datas, formatação, ids (uuid v7)
```

Por que não Clean Architecture completa (use-cases, entidades, adapters)? Para um app local de um usuário, geraria burocracia sem ganho. As regras acima mantêm o isolamento necessário e permitem evoluir: quando houver backend, os `repositories` ganham uma implementação remota/sincronizada sem mudar telas.

---

## 4. Modelo de dados (SQLite / Drizzle)

```
timelines            id, title, template_key (weight_loss|hair|face|custom), color, icon,
                     reminder_interval_days?, reminder_time?, archived_at?, created_at, updated_at
timeline_angles      id, timeline_id, key, label, overlay_key?, sort_order, is_active
entries              id, timeline_id, taken_at, note?, created_at          # um "registro/check-in"
photos               id, entry_id, angle_id, file_name, thumb_file_name, width, height,
                     source (camera|gallery), created_at
metric_definitions   id, timeline_id, key, label, unit, sort_order
metric_values        id, entry_id, metric_id, value
app_settings         key, value                                            # prefs não secretas
```

- Um **entry** agrupa várias fotos da mesma data (ex.: frente + costas + lateral), permitindo comparar sessão contra sessão e ângulo contra ângulo.
- Ângulos e métricas nascem do modelo, mas o usuário pode adicionar/remover/renomear.
- IDs com UUID v7 (ordenáveis; prontos para sincronização futura).
- Todas as tabelas com `created_at/updated_at` (base para sync futuro).

---

## 5. Modelos (templates) de catalogação

Templates são **objetos declarativos** (ângulos, silhueta, câmera sugerida, dicas, métricas padrão, intervalo de lembrete sugerido). Novo modelo = novo arquivo.

### 5.1 Emagrecimento / academia
- **Ângulos:** corpo inteiro frente, costas, lateral esquerda, lateral direita; torso/abdômen; braços (relaxado e contraído); pernas; glúteos.
- **Câmera:** traseira, com **timer 3/5/10 s** e bipes (celular apoiado ou em tripé); silhueta de corpo por ângulo.
- **Dicas:** mesma hora (de manhã, em jejum), mesma luz e roupa, celular na altura do umbigo a ~2–3 m, postura relaxada, repetir a pose contraída.
- **Métricas padrão:** peso (kg), cintura (cm), quadril (cm), % gordura (opcional).
- **Lembrete sugerido:** 7 dias.

### 5.2 Tratamento capilar (baseado em pesquisa)
Protocolos clínicos usam ao menos 3 vistas (frontal, temporal, topo/coroa); apps do segmento (Hairline, BaldingAI, Follicle) usam câmera guiada + sobreposição fantasma e checklist de ângulos.
- **Ângulos:** linha frontal (cabelo puxado para trás), têmpora esquerda, têmpora direita, meio do couro cabeludo (repartido ao meio), coroa/vértice, nuca (área doadora).
- **Interface para autocaptura — o problema:** frontal e têmporas o usuário vê na tela (câmera frontal); **coroa e nuca, não**. Proposta:
  - **Frontal/têmporas:** câmera frontal, contorno oval de rosto + linha-guia da altura das sobrancelhas, ghost da foto anterior, indicador de nível.
  - **Modo coroa ("mãos livres"):** câmera traseira apontada para baixo sobre a cabeça. O app usa o sensor de movimento para guiar por **vibração e som** (vibração mais frequente = mais perto do nivelado). Quando o celular fica nivelado e estável ~1 s, **dispara sozinho uma rajada de 3 fotos**; depois o usuário escolhe a melhor na revisão. Alternativas no mesmo tela: "pedir ajuda a alguém" (modo normal) e timer.
  - **Nuca:** mesmo modo mãos-livres, com celular na vertical atrás da cabeça.
  - **Checklist de sessão:** cartões por ângulo com ✓, para que o usuário complete todas as vistas do registro.
- **Dicas:** cabelo seco e limpo, sem produto, mesmo penteado; mesma luz (luz de teto realça falhas — manter sempre a mesma); intervalo de 2–4 semanas.
- **Métricas padrão:** nenhuma obrigatória; campo de notas (ex.: medicação/dose) e escala subjetiva 1–5 opcional.
- **Lembrete sugerido:** 14 dias.

### 5.3 Tratamento facial
- **Ângulos:** frente, 45° esquerda, 45° direita, perfil esquerdo, perfil direito, close-up da área tratada.
- **Câmera:** frontal, oval de rosto + marcas de olhos/queixo; ghost.
- **Dicas:** sem maquiagem, cabelo preso, expressão neutra, luz natural difusa de frente, celular na altura dos olhos.
- **Lembrete sugerido:** 7 dias.

### 5.4 Genérico
Usuário define nome e ângulos livres; sem silhueta (apenas grade + ghost).

---

## 6. Fluxos principais

### 6.1 Captura (câmera)
1. Escolhe o ângulo → abre câmera com: silhueta do template, **foto fantasma** (última foto desse ângulo, opacidade ajustável 0–70%, liga/desliga), grade de terços, nível, timer, troca frontal/traseira, flash.
2. Foto vai para o **cache** → tela de revisão (refazer / editar / usar).
3. Salvar → pipeline de salvamento (6.4).

A foto fantasma é espelhada automaticamente quando a câmera frontal está ativa, para bater com o preview.

### 6.2 Importação da galeria
1. `expo-image-picker` (uma ou várias fotos). Usa a data EXIF como sugestão de data do registro (editável).
2. Editor → salvar.
3. Após sucesso: diálogo "Remover da galeria do celular?" → `MediaLibrary.deleteAssetsAsync` (sistema pede confirmação).
4. Se não for possível apagar (permissão negada/limitação do Android, ver §10), mostrar instrução para apagar manualmente.

### 6.3 Editor
Ordem do pipeline (sempre sobre a imagem original em memória, com desfazer):
1. **Alinhar com a anterior:** foto anterior semitransparente sobreposta; pinch/pan/rotate na nova até alinhar.
2. **Recortar / girar 90° / espelhar**; proporções pré-definidas (3:4, 1:1, 9:16, livre) — padrão do ângulo definido pelo template, para que todas as fotos da timeline fiquem iguais.
3. **Brilho / contraste** (color matrix Skia, preview em tempo real).
4. **Censura:** pincel de desfoque/pixelização ou retângulo preto sobre regiões.
5. Exportar: Skia renderiza offscreen → JPEG (qualidade ~0.85, lado maior ≤ 2560 px) + miniatura (≤ 400 px).

A imagem final é "gravada" (edição destrutiva); o original não editado não é guardado — mais simples e mais privado. *(Pode mudar para edição não destrutiva depois, se desejar.)*

### 6.4 Salvamento seguro (`photo.service.ts`)
```
JPEG (memória) → AES-256-GCM com a chave mestra → photos/<id>.enc
miniatura      → AES-256-GCM                    → thumbs/<id>.enc
transação SQL: insere entry (se nova) + photo
apaga arquivos temporários do cache
```
Se a transação falhar, os arquivos são removidos (sem órfãos). Rotina de verificação de integridade no início do app remove arquivos sem registro.

### 6.5 Timeline / visualização
- Início: cartões das linhas do tempo (capa = miniatura mais recente, dias desde o último registro, próximo lembrete).
- Timeline: lista vertical por data; filtro por ângulo; métricas do registro inline.
- Visualizador em tela cheia com swipe entre datas do **mesmo ângulo**.

### 6.6 Comparação
- Escolher duas datas (padrão: primeira × última) e um ângulo.
- Modos: **lado a lado**, **slider** (arrasta divisor) e **sobreposição** (opacidade).
- Rótulos com data e diferença de dias; diferença de métricas (ex.: −4,2 kg).
- Exportar a comparação como imagem (compartilhamento explícito pelo usuário; nunca automático).

### 6.7 Métricas
Formulário no registro; tela de gráfico por métrica (victory-native) com linha do tempo e variação total.

---

## 7. Segurança e privacidade

**Chaves**
- Na primeira execução: gera **chave mestra** (32 bytes aleatórios) e **chave do DB**; guardadas no `expo-secure-store` (Keychain iOS / Keystore Android), `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (não vai para backup do iCloud/Google).
- Arquivos: AES-256-GCM, IV aleatório por arquivo, formato `[versão|IV|tag|ciphertext]`.

**PIN (opcional)**
- Armazenado apenas como hash **PBKDF2-SHA256 (≥ 210k iterações) + salt** no SecureStore.
- Tentativas erradas: atraso progressivo (30 s, 1 min, 5 min…).
- Biometria como atalho, só se o PIN estiver ativo; o PIN sempre funciona como fallback.
- **Auto-lock** ao voltar do background após tempo configurável (imediato / 1 / 5 min).
- Ao ir para background: overlay que oculta o conteúdo no alternador de apps e **limpeza do cache de fotos descriptografadas**.
- Opção "Bloquear capturas de tela" (`expo-screen-capture`).

**Esqueci o PIN**: como não há conta nem servidor, a única saída é **apagar todos os dados do app** (ou restaurar de um backup com a senha do backup). Isso fica claro ao criar o PIN.

> Nota honesta: o PIN é uma barreira de acesso ao app; a proteção dos dados em repouso vem do sandbox + criptografia com chave no hardware seguro do aparelho. Derivar a chave do PIN não acrescentaria segurança real (PIN de 6 dígitos é quebrável offline) e impediria recuperação.

**Exibição de fotos**
- Miniaturas: descriptografadas em memória (cache LRU limitado).
- Foto cheia: descriptografada para `cache/decrypted/` e exibida; apagada ao sair da tela, ao bloquear e ao ir para background.

**Notificações**: texto genérico ("Hora do seu registro 📸"), sem nome da linha do tempo, para não expor informação na tela bloqueada.

---

## 8. Backup e restauração
- **Exportar:** usuário define uma **senha do backup** → chave via PBKDF2/scrypt → gera `.ltbackup` (zip) contendo `manifest.json` cifrado (dump do DB) + fotos re-cifradas com a chave do backup → `expo-sharing` (Arquivos, Drive, e-mail…).
- **Importar:** `expo-document-picker` → senha → valida versão/integridade → substituir tudo (MVP) — mesclagem fica para depois.
- Lembrete opcional de "faça um backup" a cada N registros, já que desinstalar o app apaga tudo.

---

## 9. Roadmap de implementação

Cada fase termina com app rodando, testes passando e um commit/PR.

| Fase | Entregas |
|---|---|
| **F0 — Fundação** | Projeto Expo + TS strict, estrutura de pastas, ESLint (fronteiras) + Prettier, NativeWind + tema claro/escuro, i18n, Expo Router com tabs, `core/crypto`, `core/storage`, `core/db` (SQLCipher + Drizzle + migrations), Jest, GitHub Actions, `eas.json` com perfil development. |
| **F1 — Linhas do tempo** | Templates declarativos, criar/editar/arquivar/excluir linha do tempo, gerenciar ângulos e métricas, tela Início. |
| **F2 — Captura** | Câmera com silhueta, ghost, grade, nível, timer; modo coroa mãos-livres; revisão; importação da galeria + remoção do original; salvamento seguro. |
| **F3 — Editor** | Alinhar, crop/rotate/flip, brilho/contraste, censura, exportação + miniatura. |
| **F4 — Timeline e métricas** | Lista por data, filtros por ângulo, visualizador, registro de métricas, gráficos. |
| **F5 — Comparação** | Lado a lado, slider, sobreposição, exportar imagem. |
| **F6 — Segurança** | Onboarding de PIN, tela de bloqueio, biometria, auto-lock, privacy overlay, bloqueio de screenshot, limpeza de cache, "apagar tudo". |
| **F7 — Lembretes** | Agendamento por linha do tempo, permissões, reagendar ao registrar. |
| **F8 — Backup** | Exportar/importar `.ltbackup` com senha. |
| **F9 — Polimento e lojas** | Onboarding com dicas, estados vazios, acessibilidade, fluxos Maestro, ícone/splash, textos de permissão, política de privacidade, builds de produção. |

---

## 10. Riscos e pontos de atenção
1. **Apagar da galeria no Android:** o seletor de fotos do sistema devolve URIs que o app não pode apagar diretamente; apagar exige acesso à biblioteca de mídia (`READ_MEDIA_IMAGES`), e a **política do Google Play restringe essa permissão** a apps cujo propósito central é gerenciar fotos. Mitigação: pedir a permissão só na hora de apagar, justificar na ficha da loja, e ter fallback de "apague manualmente" caso seja negado/recusado na revisão. No iOS funciona com confirmação do sistema.
2. **iOS a partir do Linux:** builds via EAS na nuvem; testes exigem um iPhone físico (simulador precisa de macOS). É necessária conta Apple Developer para instalar dev builds em iPhone.
3. **Memória no editor/criptografia:** fotos de 12–48 MP. Redimensionar logo na entrada (≤ 2560 px) antes de Skia e cifragem.
4. **Perda de dados:** sem nuvem, desinstalar = perder tudo. Mitigado por backup e avisos.
5. **Modo coroa:** a precisão do sensor varia por aparelho; calibrar limiares em testes reais.

---

## 11. Evolução prevista (fora do MVP)
- Novas features de "gestão de vida" como novas pastas em `features/` (hábitos, humor, finanças, sono…), com a tela Início virando um painel.
- Timelapse/GIF da evolução; edição não destrutiva.
- Backend opcional com sincronização E2E (repositories remotos; UUID v7 e timestamps já preparados), contas e multiusuário.
- Análise automática (ex.: detecção de pose/rosto para validar enquadramento).

---

### Referências da pesquisa (capilar)
- [Trichometrics — How to Take Hair Loss Progress Photos](https://trichometrics.com/hair-loss-progress-photos)
- [Standardization of Clinical Photos for Tracking Hair Loss (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12330203/)
- [IMI — Hair Loss Photography: A Guide to Good Practice](https://www.imi.org.uk/wp-content/uploads/2024/06/NG_HairLoss_1_0_S.pdf)
- [Chin–Nose–Brow Rest standardization (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6706991/)
- [Hairline: Hair Loss Tracker (App Store)](https://apps.apple.com/us/app/hairline-hair-loss-tracker/id6780453702)
- [Follicle — Hair Loss Tracker (App Store)](https://apps.apple.com/us/app/follicle-hair-loss-tracker/id6759066308)
- [Balding AI](https://hairlosstracker.app/)
