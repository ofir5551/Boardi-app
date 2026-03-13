import { create } from "zustand";
import type { Soundboard, SoundButton } from "@/src/types/soundboard";
import * as soundboardService from "@/src/services/soundboardService";
import * as fileService from "@/src/services/fileService";
import { generateId } from "@/src/utils/id";
import { MAX_BOARDS, BUTTONS_PER_BOARD } from "@/src/constants/limits";

type SoundboardStore = {
  boards: Soundboard[];
  activeBoard: Soundboard | null;
  isLoading: boolean;

  loadBoards: () => Promise<void>;
  createBoard: (name: string) => Promise<boolean>;
  deleteBoard: (id: string) => Promise<void>;
  setActiveBoard: (id: string) => void;
  clearActiveBoard: () => void;
  updateButton: (
    boardId: string,
    buttonId: string,
    data: Partial<SoundButton>
  ) => Promise<void>;
};

function makeEmptyButtons(): SoundButton[] {
  return Array.from({ length: BUTTONS_PER_BOARD }, (_, i) => ({
    id: generateId() + `_${i}`,
    label: "",
    soundUri: null,
  }));
}

export const useSoundboardStore = create<SoundboardStore>((set, get) => ({
  boards: [],
  activeBoard: null,
  isLoading: false,

  loadBoards: async () => {
    set({ isLoading: true });
    const boards = await soundboardService.loadAll();
    set({ boards, isLoading: false });
  },

  createBoard: async (name: string) => {
    const { boards } = get();
    if (boards.length >= MAX_BOARDS) return false;
    const newBoard: Soundboard = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      buttons: makeEmptyButtons(),
    };
    const updated = [...boards, newBoard];
    await soundboardService.saveAll(updated);
    set({ boards: updated });
    return true;
  },

  deleteBoard: async (id: string) => {
    const { boards } = get();
    const board = boards.find((b) => b.id === id);
    // Remove metadata first, then best-effort file cleanup
    const updated = boards.filter((b) => b.id !== id);
    await soundboardService.saveAll(updated);
    set({ boards: updated, activeBoard: null });
    if (board) {
      for (const btn of board.buttons) {
        if (btn.soundUri) {
          fileService.deleteAudioFile(btn.soundUri);
        }
      }
    }
  },

  setActiveBoard: (id: string) => {
    const board = get().boards.find((b) => b.id === id) ?? null;
    set({ activeBoard: board });
  },

  clearActiveBoard: () => set({ activeBoard: null }),

  updateButton: async (boardId, buttonId, data) => {
    const { boards } = get();
    const updated = boards.map((board) => {
      if (board.id !== boardId) return board;
      return {
        ...board,
        buttons: board.buttons.map((btn) =>
          btn.id === buttonId ? { ...btn, ...data } : btn
        ),
      };
    });
    await soundboardService.saveAll(updated);
    const activeBoard = updated.find((b) => b.id === boardId) ?? null;
    set({ boards: updated, activeBoard });
  },
}));
