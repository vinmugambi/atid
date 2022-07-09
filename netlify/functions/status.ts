import { start } from "./elarian";

export async function handler(event, context) {
  start();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "App is running" }),
  };
}
