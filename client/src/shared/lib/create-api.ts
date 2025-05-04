type RequestConfig = RequestInit & {
  url: string;
  json?: unknown;
};

class ApiError extends Error {
  constructor(
    public requestConfig: RequestConfig,
    public response: Response,
  ) {
    super(response.statusText);
  }
}

type RequestMiddleware = (
  config: RequestConfig,
) => Promise<RequestConfig> | RequestConfig;
type ResponseMiddleware = (
  response: Response,
  requsetConfig: RequestConfig,
) => Promise<Response> | Response;

type CreateApiParams = {
  baseUrl: string;
  requestMiddlewares?: RequestMiddleware[];
  responseMiddlewares?: ResponseMiddleware[];
};

export function createApi({
  baseUrl,
  requestMiddlewares = [],
  responseMiddlewares = [],
}: CreateApiParams) {
  return async function apiInstance<T>(config: RequestConfig) {
    config.url = `${baseUrl}${config.url}`;
    if (config.json) {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
      };
      config.body = JSON.stringify(config.json);
    }

    config = await requestMiddlewares.reduce(
      async (configPromise, middleware) => middleware(await configPromise),
      Promise.resolve(config),
    );

    let response = await fetch(config.url, config);

    response = await responseMiddlewares.reduce(
      async (responsePromise, middleware) =>
        middleware(await responsePromise, config),
      Promise.resolve(response),
    );

    if (!response.ok) {
      throw new ApiError(config, response);
    }

    return response.json() as Promise<T>;
  };
}
