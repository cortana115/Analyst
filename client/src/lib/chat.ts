import { Domain, InsertMessage } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function sendMessage(message: string, domain: Domain, threadId: string) {
  const data: InsertMessage = {
    content: message,
    domain,
    role: "user",
    threadId,
    timestamp: Date.now(),
  };

  const response = await apiRequest("POST", "/api/chat", data);
  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}