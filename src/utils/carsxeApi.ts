import * as dotenv from "dotenv";
// import * as path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../../.env") });

const CARSXE_API_BASE = "https://api.carsxe.com";

function buildCarsxeUrl(
  endpoint: string,
  apiKey: string,
  params: Record<string, string> = {},
): string {
  const queryParams = new URLSearchParams({
    key: apiKey,
    source: "mcp",
    ...params,
  });
  return `${CARSXE_API_BASE}/${endpoint}?${queryParams.toString()}`;
}

export async function carsxeApiRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T | null> {
  const url = buildCarsxeUrl(endpoint, apiKey, params);
  try {
    const response = await fetch(url);
    try {
      return (await response.json()) as T;
    } catch {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      throw new Error("Invalid JSON response");
    }
  } catch (error) {
    console.error(`Error making CarsXE request to ${endpoint}:`, error);
    return null;
  }
}

export async function carsxeApiPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  apiKey: string,
): Promise<T | null> {
  const url = buildCarsxeUrl(endpoint, apiKey);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error making CarsXE POST to ${endpoint}:`, error);
    return null;
  }
}

export async function carsxeApiRequestText(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<string | null> {
  const url = buildCarsxeUrl(endpoint, apiKey, params);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Error making CarsXE request to ${endpoint}:`, error);
    return null;
  }
}
