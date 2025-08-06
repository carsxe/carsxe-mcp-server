import * as dotenv from "dotenv";
// import * as path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../../.env") });

export async function carsxeApiRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T | null> {
  const CARSXE_API_BASE = "https://api.carsxe.com";
  const queryParams = new URLSearchParams({ key: apiKey, ...params });
  const url = `${CARSXE_API_BASE}/${endpoint}?${queryParams.toString()}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error making CarsXE request to ${endpoint}:`, error);
    return null;
  }
}
