import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendNotification, type SendNotificationInput } from "@/lib/notifications.functions";

export const notificationsApi = {
  enviar: {
    useMutation: () => {
      const call = useServerFn(sendNotification);
      return useMutation({
        mutationFn: async (input: SendNotificationInput) => {
          return await call({ data: input });
        },
      });
    },
  },
};
