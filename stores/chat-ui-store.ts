"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ChatUIState {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useChatUIStore = create<ChatUIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
      toggleSidebarCollapsed: () =>
        set((state) => ({
          isSidebarCollapsed: !state.isSidebarCollapsed,
        })),
    }),
    {
      name: "garas-chat-ui-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);