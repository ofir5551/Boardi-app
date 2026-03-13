# Soundboard Maker – MVP Technical Specification

## 1. Product Overview

A mobile app allowing users to create and play custom soundboards.

Users can:
- Create soundboards
- Assign audio files from their device
- Record audio clips
- Play sounds instantly
- Rename buttons
- Manage up to 5 soundboards

The app works fully offline.

**Primary goal of the MVP:** Validate the core interaction of quick sound playback from a custom board.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo |
| Language | TypeScript |
| Styling | NativeWind |
| Navigation | React Navigation |
| Audio playback | Expo AV |
| Audio recording | Expo AV |
| File access | Expo Document Picker |
| Filesystem | Expo FileSystem |
| Persistence | AsyncStorage |
| State management | Zustand |
| Haptics | Expo Haptics |

**Target platforms:** iOS, Android

---

## 3. Core Product Constraints

| Constraint | Value |
|---|---|
| Max soundboards | 5 |
| Buttons per soundboard | 8 |
| Grid layout | 2 columns × 4 rows |
| Max audio length | 10 seconds |
| Max file size | 5 MB |
| Playback mode | simultaneous |
| Supported formats | mp3, wav, m4a |

---

## 4. Application Architecture

```
App
│
├─ Screens
│
├─ Components
│
├─ State Layer (Zustand)
│
├─ Services
│   ├─ audioService
│   ├─ soundboardService
│   └─ fileService
│
├─ Storage
│   ├─ AsyncStorage (metadata)
│   └─ FileSystem (audio files)
│
└─ Navigation
```

**Design principles:**
- Clear separation between UI, state, and services
- All persistent logic centralized in services
- Components remain stateless whenever possible

---

## 5. Folder Structure

```
src
│
├── components
│   ├── SoundButton.tsx
│   ├── BoardGrid.tsx
│   └── Header.tsx
│
├── screens
│   ├── HomeScreen.tsx
│   ├── SoundboardScreen.tsx
│   └── EditButtonScreen.tsx
│
├── navigation
│   └── RootNavigator.tsx
│
├── store
│   └── soundboardStore.ts
│
├── services
│   ├── audioService.ts
│   ├── fileService.ts
│   └── soundboardService.ts
│
├── types
│   └── soundboard.ts
│
├── utils
│   └── id.ts
│
└── constants
    └── limits.ts
```

---

## 6. Data Model

### Soundboard

```ts
export type Soundboard = {
  id: string
  name: string
  createdAt: number
  buttons: SoundButton[]
}
```

### Sound Button

```ts
export type SoundButton = {
  id: string
  label: string
  soundUri: string | null
}
```

**Example board:**

```json
{
  "id": "board_1",
  "name": "Memes",
  "createdAt": 171200000,
  "buttons": [
    { "id": "b1", "label": "Bruh", "soundUri": "file://sounds/bruh.mp3" }
  ]
}
```

---

## 7. Storage Architecture

Two-layer storage.

### Metadata Storage

Stored in AsyncStorage.

- **Key:** `soundboards`
- **Value:** JSON array of `Soundboard` objects

### Audio Storage

Stored using Expo FileSystem.

- **Directory:** `FileSystem.documentDirectory/sounds/`

**Example:**

```
sounds/
  board1_button3.mp3
  board2_button1.m4a
```

Audio files are copied from the source to this directory.

---

## 8. Navigation Structure

```
Home
 ├─ Soundboard
 └─ EditButton
```

---

## 9. Screen Specifications

### Home Screen

Displays all soundboards.

**Features:**
- List soundboards
- Create board
- Delete board
- Open board

**Layout:**
```
My Soundboards

[ Meme Board ]
[ Reactions  ]
[ Work       ]

+ Create Board
```

**Rules:**
- Max 5 boards
- Show alert if limit reached

### Soundboard Screen

Displays soundboard grid.

**Layout:**
```
[Btn1] [Btn2]
[Btn3] [Btn4]
[Btn5] [Btn6]
[Btn7] [Btn8]
```

**Button states:**

| State | Behavior |
|---|---|
| Empty | Open file picker |
| Has sound | Play sound |
| Long press | Edit |

Board loads preloaded sounds.

### Edit Button Screen

**Allows:**
- Rename button
- Replace sound
- Remove sound

**Fields:**
- Button name
- Replace sound
- Delete sound

---

## 10. Sound Button Interaction

| Gesture | Result |
|---|---|
| Tap empty | Choose sound |
| Tap with sound | Play sound |
| Long press | Edit |

**Button press triggers:**
- Haptic feedback
- Audio playback

---

## 11. Audio Engine

Implemented in `audioService`.

**Responsibilities:**
- Load sounds
- Cache sounds
- Play sounds
- Unload sounds

**Sound Cache:**

```ts
Map<buttonId, Audio.Sound>
```

Preloaded when board opens.

**API:**
```ts
loadBoard(board)
play(buttonId)
unloadBoard()
```

**Playback Rules:**
- Sounds play simultaneously
- Each press triggers a new instance

---

## 12. Audio Upload Flow

### Upload

```
tap empty button
    ↓
DocumentPicker
    ↓
validate file size
    ↓
copy file to filesystem
    ↓
load audio metadata
    ↓
validate duration
    ↓
update board
```

### Recording

```
tap record
    ↓
start microphone
    ↓
stop recording
    ↓
validate duration
    ↓
store file
```

---

## 13. Validation Rules

| Rule | Value |
|---|---|
| Max size | 5 MB |
| Max duration | 10 seconds |
| Allowed formats | mp3, wav, m4a |

Validation occurs before saving.

---

## 14. State Management

Global state stored using Zustand.

**Store structure:**

```ts
type SoundboardStore = {
  boards: Soundboard[]
  activeBoard: Soundboard | null

  loadBoards(): void
  createBoard(): void
  deleteBoard(id: string): void
  setActiveBoard(id: string): void
  updateButton(
    boardId: string,
    buttonId: string,
    data: Partial<SoundButton>
  ): void
}
```

Persistence handled through AsyncStorage integration.

---

## 15. Sound Button Component

**Responsibilities:**
- UI rendering
- Press handling
- Playback trigger

**Props:**

```ts
type Props = {
  button: SoundButton
  onPress(): void
  onLongPress(): void
}
```

---

## 16. Styling

Using NativeWind.

**Example:**

```tsx
<View className="bg-blue-500 rounded-xl p-6 items-center justify-center">
  <Text className="text-white font-bold">
    {label}
  </Text>
</View>
```

**Button style:**
- Rounded
- Large padding
- Centered label
- Visual press feedback

---

## 17. Haptic Feedback

Each press triggers vibration using Expo Haptics.

```ts
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
```

This greatly improves tactile responsiveness.

---

## 18. Development Roadmap

| Phase | Task |
|---|---|
| Phase 1 | Project Setup – install Expo, TypeScript, NativeWind, React Navigation, Zustand |
| Phase 2 | Core Models – implement `Soundboard`, `SoundButton`, constants |
| Phase 3 | Storage Layer – implement AsyncStorage service, filesystem service |
| Phase 4 | State Layer – create Zustand store (load, create, delete, update) |
| Phase 5 | Navigation – build navigation stack |
| Phase 6 | Home Screen – implement board list UI |
| Phase 7 | Soundboard Screen – build grid layout and button component |
| Phase 8 | File Picker + Recording – implement upload pipeline |
| Phase 9 | Audio Engine – implement playback and caching |
| Phase 10 | Haptics – add tactile feedback |

---

## 19. Edge Cases

| Scenario | Handling |
|---|---|
| Audio file deleted | Show error |
| Corrupted file | Ignore |
| Max boards reached | Alert |
| Audio longer than 10s | Reject |
