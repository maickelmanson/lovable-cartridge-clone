import { QueryClient } from "@tanstack/react-query";
import { trpc, createMockTRPCClient } from "@/lib/trpc";

const queryClient = new QueryClient();
const trpcClient = createMockTRPCClient();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}
