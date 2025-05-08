import {
  CallOptions,
  ClientError,
  ClientMiddlewareCall,
  Status,
} from "nice-grpc-web";

export class ServerError extends Error {
  constructor(
    public code: Status | null,
    public description: string,
    public originalError?: unknown,
  ) {
    super(description);
    this.name = "ServerError";
  }
}

export async function* errorMiddleware<Request, Response>(
  call: ClientMiddlewareCall<Request, Response>,
  options: CallOptions,
): AsyncGenerator<Response, void | Response, undefined> {
  try {
    const response = yield* call.next(call.request, options);

    return response;
  } catch (e) {
    if (e instanceof ClientError) {
      throw new ServerError(e.code, e.details || "gRPC client error", e);
    }

    if (e instanceof Error) {
      throw new ServerError(null, e.message, e);
    }

    throw new ServerError(null, "Unknown error", e);
  }
}
