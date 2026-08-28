import { createFileRoute } from "@tanstack/react-router";
import { TRPCProvider } from "@/components/TRPCProvider";
import App from "@/App";

export const Route = createFileRoute("/$")({
  ssr: false,
  component: CatchAll,
});

function CatchAll() {
  return (
    <TRPCProvider>
      <App />
    </TRPCProvider>
  );
}
