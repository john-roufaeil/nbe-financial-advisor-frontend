import { create } from "zustand";

export interface ChatToolCall {
  toolName: string;
  args: Record<string, string | number | boolean | null>;
  result: unknown;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "document";
  name: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  toolCall?: ChatToolCall;
  attachments?: ChatAttachment[];
}

interface ChatThreadRecord {
  id: string;
  title: string;
  messages: ChatMessage[];
}

function createThread(): ChatThreadRecord {
  return { id: crypto.randomUUID(), title: "New chat", messages: [] };
}

interface ChatState {
  threads: Record<string, ChatThreadRecord>;
  order: string[];
  currentThreadId: string;
  isRunning: boolean;
  newThread: () => void;
  switchThread: (id: string) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  appendMessage: (threadId: string, message: Omit<ChatMessage, "createdAt">) => void;
  setRunning: (running: boolean) => void;
}

const firstThread = createThread();

export const useChatStore = create<ChatState>((set) => ({
  threads: { [firstThread.id]: firstThread },
  order: [firstThread.id],
  currentThreadId: firstThread.id,
  isRunning: false,
  newThread: () =>
    set((s) => {
      const t = createThread();
      return {
        threads: { ...s.threads, [t.id]: t },
        order: [t.id, ...s.order],
        currentThreadId: t.id,
      };
    }),
  switchThread: (id) => set({ currentThreadId: id }),
  deleteThread: (id) =>
    set((s) => {
      const rest = { ...s.threads };
      delete rest[id];
      const order = s.order.filter((tid) => tid !== id);
      const currentThreadId =
        s.currentThreadId === id ? (order[0] ?? "") : s.currentThreadId;
      return { threads: rest, order, currentThreadId };
    }),
  renameThread: (id, title) =>
    set((s) => ({ threads: { ...s.threads, [id]: { ...s.threads[id], title } } })),
  appendMessage: (threadId, message) =>
    set((s) => {
      const thread = s.threads[threadId];
      if (!thread) return s;
      const isFirstUserMessage = thread.messages.length === 0 && message.role === "user";
      const fullMessage: ChatMessage = { ...message, createdAt: Date.now() };
      return {
        threads: {
          ...s.threads,
          [threadId]: {
            ...thread,
            title: isFirstUserMessage ? message.text.slice(0, 40) : thread.title,
            messages: [...thread.messages, fullMessage],
          },
        },
      };
    }),
  setRunning: (running) => set({ isRunning: running }),
}));
