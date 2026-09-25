# Life Tracker — Status da implementação do MVP

Referência: [PLANO-MVP.md](PLANO-MVP.md). Atualizado em 25/09/2026.

## Fases

Cada fase tem um branch empilhado sobre a anterior (`feat/f0-fundacao` → … → `feat/f9-polimento`).

| Fase | Status | Observações |
|---|---|---|
| F0 — Fundação | ✅ | Expo SDK 57, TS strict, fronteiras no ESLint, NativeWind, i18n, crypto, SQLCipher + Drizzle, Jest, CI |
| F1 — Linhas do tempo | ✅ | Templates declarativos, CRUD, ângulos e métricas |
| F2 — Captura | ✅ código / ⏳ aparelho | Câmera, silhueta, fantasma, nível, timer, mãos-livres, galeria, salvamento seguro |
| F3 — Editor | ✅ código / ⏳ aparelho | Enquadrar/alinhar, girar, espelhar, luz, censura; renderizador testado com Skia real |
| F4 — Timeline e métricas | ✅ | Feed, filtro por ângulo, visualizador, edição do registro, gráficos |
| F5 — Comparação | ✅ | Lado a lado, deslizar, sobrepor, exportar imagem |
| F6 — Segurança | ✅ código / ⏳ aparelho | PIN, biometria, auto-bloqueio, privacidade de tela, apagar tudo |
| F7 — Lembretes | ✅ código / ⏳ aparelho | Notificações locais opt-in por linha do tempo |
| F8 — Backup | ✅ | `.ltbackup` com senha; restauração validada antes de apagar |
| F9 — Polimento | 🟡 parcial | Onboarding, Maestro, rascunho da política de privacidade. Faltam os itens abaixo |

"⏳ aparelho" = lógica coberta por testes, mas a integração nativa (câmera, sensores, notificações, Keychain) só pode ser validada num dev build.

## Decisões tomadas durante a implementação (desvios do plano)

1. **Tela de bloqueio como overlay** em vez de `Stack.Protected`: preserva a navegação (ex.: voltar do segundo plano no meio de uma edição) e cobre todo o conteúdo.
2. **Lembretes dentro da feature de fotos + `core/notifications`** em vez de `features/reminders`: dependem dos dados das linhas do tempo, e features não importam umas às outras.
3. **Lembrete nasce desligado**: o intervalo do template é só sugestão; a permissão de notificação é pedida ao ativar.
4. **Gráfico próprio em Skia** em vez de `victory-native`: só precisamos de uma linha simples; uma dependência a menos.
5. **Backup em contêiner próprio** (sem zip nativo) e **seletor de arquivo do `expo-file-system`** (sem `expo-document-picker`). Os dados já vão cifrados, e compactar não traria ganho.
6. **"Bloquear capturas de tela" ligado por padrão**: no Android, só o `FLAG_SECURE` esconde o app na tela de recentes.
7. **Remoção do original da galeria no Android**: o seletor moderno não devolve o `assetId`, então no Android o caminho principal deve ser a instrução "apague manualmente". No iOS a remoção funciona com acesso total à biblioteca. **Confirmar em aparelho.**
8. **PIN com 210k iterações PBKDF2** (plano); backup com 600k (recomendação OWASP para SHA-256).

## Pendências que dependem de você

- [ ] **Identificador do app**: `com.andreluiz.lifetracker` é provisório (`app.config.ts`).
- [ ] **Contas**: Expo (EAS) e Apple Developer (para instalar no iPhone).
- [ ] **Primeiro dev build**: `npx eas-cli@latest build --profile development --platform android` (e `ios`).
- [ ] **Ícone e splash** definitivos (hoje são os do template Expo).
- [ ] **Imagens de exemplo do template** em `assets/images/` (não versionadas) podem ser apagadas.
- [ ] **Política de privacidade**: revisar o rascunho em `docs/POLITICA-DE-PRIVACIDADE.md` e publicar numa URL (exigência das lojas).
- [ ] **Silhuetas**: os traços atuais são geométricos/provisórios; vale um design dedicado.

## Checklist de teste em aparelho

Captura
- [ ] Câmera frontal/traseira, flash, grade, silhueta e foto fantasma (espelhada na frontal)
- [ ] Timer 3/5/10 s com bipes (e silêncio no modo mudo do iOS)
- [ ] Nível: a bolha anda na direção certa ao inclinar (sinal dos eixos por plataforma)
- [ ] Mãos-livres (coroa): vibração acelera perto do nível e dispara rajada de 3; calibrar limiares
- [ ] Revisão: escolher da rajada, refazer, usar, editar
- [ ] Importar da galeria (data EXIF) e remover original (iOS / Android)

Editor
- [ ] Arrastar/pinça fluidos; foto anterior sobreposta alinhada
- [ ] Girar/espelhar/proporções; brilho/contraste; censuras (desfoque, pixelado, tarja)
- [ ] Foto salva igual à prévia; desempenho com fotos de 48 MP

Segurança
- [ ] PIN, erro e atraso progressivo; biometria (Face ID/digital)
- [ ] Auto-bloqueio imediato/1/5 min; galeria/compartilhar não disparam bloqueio
- [ ] App no alternador aparece coberto (iOS desfoque, Android em branco)
- [ ] "Apagar todos os dados" deixa o app como recém-instalado

Lembretes e backup
- [ ] Permissão só ao ativar; notificação com texto genérico; toque abre a linha do tempo
- [ ] Exportar backup, reinstalar o app, restaurar e conferir fotos e métricas
- [ ] Build Android release com SQLCipher + quick-crypto juntos (histórico de conflito de OpenSSL)
