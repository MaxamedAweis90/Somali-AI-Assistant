"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AI_IMAGE_DAILY_LIMIT,
  getAIModelOption,
  getDefaultChatModelId,
  normalizeAIModelId,
  type AIModelId,
  type AIToolMode,
} from "@/lib/ai/model-catalog";
import type { ChatImageQuota } from "@/types/chat";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeImageQuota(quota?: ChatImageQuota | null) {
  const today = getTodayKey();

  if (!quota || quota.dateKey !== today) {
    return {
      dateKey: today,
      used: 0,
    } satisfies ChatImageQuota;
  }

  return quota;
}

interface ChatUIState {
  isSidebarCollapsed: boolean;
  selectedModelId: AIModelId;
  selectedToolMode: AIToolMode;
  imageQuota: ChatImageQuota;
  webSearchEnabled: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSelectedModelId: (value: AIModelId) => void;
  setSelectedToolMode: (value: AIToolMode) => void;
  setWebSearchEnabled: (value: boolean) => void;
  consumeImageCredit: () => boolean;
}

export const useChatUIStore = create<ChatUIState>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      selectedModelId: getDefaultChatModelId(),
      selectedToolMode: "chat",
      imageQuota: normalizeImageQuota(),
      webSearchEnabled: true,
      setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
      toggleSidebarCollapsed: () =>
        set((state) => ({
          isSidebarCollapsed: !state.isSidebarCollapsed,
        })),
      setSelectedModelId: (value) => {
        const normalizedModelId = normalizeAIModelId(value);
        const nextModel = getAIModelOption(normalizedModelId);

        if (!nextModel || nextModel.capability !== "chat" || nextModel.status !== "ready") {
          return;
        }

        set({
          selectedModelId: nextModel.id,
          selectedToolMode: "chat",
        });
      },
      setSelectedToolMode: (value) => set({ selectedToolMode: value }),
      setWebSearchEnabled: (value) => set({ webSearchEnabled: value }),
      consumeImageCredit: () => {
        const quota = normalizeImageQuota(get().imageQuota);

        if (quota.used >= AI_IMAGE_DAILY_LIMIT) {
          set({ imageQuota: quota });
          return false;
        }

        set({
          imageQuota: {
            dateKey: quota.dateKey,
            used: quota.used + 1,
          },
        });

        return true;
      },
    }),
    {
      name: "garas-chat-ui-session",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<ChatUIState> | undefined;
        const selectedModelId = normalizeAIModelId(state?.selectedModelId);

        return {
          ...state,
          selectedModelId: selectedModelId ?? getDefaultChatModelId(),
        } as ChatUIState;
      },
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        selectedModelId: state.selectedModelId,
        selectedToolMode: state.selectedToolMode,
        imageQuota: normalizeImageQuota(state.imageQuota),
        webSearchEnabled: state.webSearchEnabled,
      }),
    }
  )
);