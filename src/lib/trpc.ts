// Mock tRPC client for the browser bundle.
// The original project used @trpc/server on a Node backend; in this
// Lovable port that package cannot run in the client, so we provide a
// runtime-safe proxy that returns empty/successful query and mutation
// hooks so the UI can render without a real backend.

const noop = () => {};
const noopAsync = async () => ({});

function createHookProxy(): any {
  return new Proxy(() => {}, {
    get(_target, prop) {
      if (prop === "useQuery") {
        return () => ({
          data: undefined,
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          isError: false,
          error: null,
          refetch: noop,
        });
      }
      if (prop === "useInfiniteQuery") {
        return () => ({
          data: null,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
          fetchNextPage: noop,
          hasNextPage: false,
        });
      }
      if (prop === "useMutation") {
        return () => ({
          mutate: noop,
          mutateAsync: noopAsync,
          isPending: false,
          isSuccess: false,
          isError: false,
          error: null,
          reset: noop,
        });
      }
      if (prop === "useContext" || prop === "useUtils") {
        return () => ({
          invalidate: noop,
          refetch: noop,
          reset: noop,
        });
      }
      return createHookProxy();
    },
    apply(_target, _thisArg, _args) {
      return createHookProxy();
    },
  });
}

export const trpc = createHookProxy();

export function createMockTRPCClient() {
  return {} as any;
}
