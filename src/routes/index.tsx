import { createFileRoute } from "@tanstack/react-router";
import { TRPCProvider } from "@/components/TRPCProvider";
import App from "@/App";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  return (
    <TRPCProvider>
      <App />
    </TRPCProvider>
  );
}
