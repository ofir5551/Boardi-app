# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Keep your replies extremely concise and focus on converying the key information. No unnecessary fluff. no long code snippets.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Launch on Android emulator
npm run ios            # Launch on iOS simulator
npm run web            # Launch web version
npm run lint           # Run ESLint
```

No test runner is configured yet.

## Project

**Boardi** is an offline-only mobile soundboard app. Users create up to 5 soundboards, each with 8 buttons arranged in a 2×4 grid. Buttons play audio files (mp3/wav/m4a, max 10s / 5MB) or can trigger recording. The full spec is in `SPEC.md`.

The project is in early setup — currently at the Expo template scaffold. No features are implemented yet.

## Planned Architecture (from SPEC.md)

Source code will live under `src/`:

```
src/
├── screens/        # HomeScreen, SoundboardScreen, EditButtonScreen
├── components/     # SoundButton, BoardGrid, Header
├── navigation/     # RootNavigator (stack: Home → Soundboard → EditButton)
├── store/          # soundboardStore.ts (Zustand)
├── services/       # audioService.ts, fileService.ts, soundboardService.ts
├── types/          # soundboard.ts (Soundboard, SoundButton types)
├── utils/          # id.ts
└── constants/      # limits.ts
```

**State:** Zustand store holds `boards[]` and `activeBoard`. Mutations go through the store which delegates persistence to services.

**Storage:** Two-layer — AsyncStorage for board metadata (key: `soundboards`), Expo FileSystem for audio files (`documentDirectory/sounds/`).

**Audio engine** (`audioService`): preloads sounds into a `Map<buttonId, Audio.Sound>` cache when a board opens, plays simultaneously on each tap, unloads when leaving the board.

**Key constraints:**
- Max 5 boards, 8 buttons each
- Audio: mp3/wav/m4a, ≤10s, ≤5MB
- Simultaneous playback (each tap spawns a new instance)
- Haptics on every button press (`ImpactFeedbackStyle.Medium`)

## Tech Stack

- **Expo ~54** with New Architecture enabled, React 19, React Native 0.81
- **Expo Router ~6** for file-based routing (current template tabs layout)
- **TypeScript** — strict mode, path alias `@/*` → root
- **NativeWind** for styling (Tailwind-style class names) — not yet installed
- **Zustand** for state management — not yet installed
- **Expo AV** for audio playback and recording — not yet installed
- **Expo Document Picker + FileSystem** for file management — not yet installed
- **AsyncStorage** for metadata persistence — not yet installed
