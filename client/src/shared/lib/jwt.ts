// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const parseJwt = <T = {}>(
  token: string
):
  | (T & {
      exp: number;
      iat: number;
    })
  | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    );
    return JSON.parse(payloadJson) as T & {
      exp: number;
      iat: number;
    };
  } catch {
    return null;
  }
};
