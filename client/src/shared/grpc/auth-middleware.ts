import {
  CallOptions,
  ClientError,
  ClientMiddlewareCall,
  Metadata,
  Status,
} from "nice-grpc-web";
import { appSessionStore } from "@/shared/session-mobx.ts";
import { publicApiClient } from "@/shared/api/client-axios.ts";

let refreshPromise: Promise<string | null> | null = null;

const getRefreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const result = await publicApiClient.post<{ token: string }>(
          "/refresh",
        );
        appSessionStore.setSessionToken(result.data.token);
        return result.data.token;
      } catch (error) {
        appSessionStore.removeSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

export async function* authMiddleware<Request, Response>(
  call: ClientMiddlewareCall<Request, Response>,
  options: CallOptions,
) {
  let refreshed = false;
  let token = appSessionStore.getSessionToken();

  if (!token || appSessionStore.isSessionExpired()) {
    token = await getRefreshToken();
    refreshed = true;
  }

  const metadata = Metadata(options.metadata).set(
    "Authorization",
    `Bearer ${token}`,
  );

  try {
    const response = yield* call.next(call.request, {
      ...options,
      metadata,
    });

    return response;
  } catch (error) {
    if (
      error instanceof ClientError &&
      error.code === Status.UNAUTHENTICATED &&
      !refreshed
    ) {
      const newToken = await getRefreshToken();
      if (newToken) {
        const newMetadata = Metadata(options.metadata).set(
          "Authorization",
          `Bearer ${newToken}`,
        );
        const response = yield* call.next(call.request, {
          ...options,
          metadata: newMetadata,
        });
        return response;
      }
      appSessionStore.removeSession();
    }

    if (error instanceof ClientError) {
      throw error;
    } else {
      throw error;
    }
  }
}
