import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { aiChat, type ChatMessage } from "@/lib/ai.functions";

export const aiApi = {
  chat: {
    useMutation: (opts?: { onSuccess?: (data: { content: string }) => void; onError?: (e: any) => void }) => {
      const call = useServerFn(aiChat);
      return useMutation({
        mutationFn: async (input: { messages: ChatMessage[]; model?: string }) => {
          return await call({ data: input });
        },
        onSuccess: (d) => opts?.onSuccess?.(d),
        onError: (e) => opts?.onError?.(e),
      });
    },
  },
};
