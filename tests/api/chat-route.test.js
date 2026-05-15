import { beforeEach, describe, expect, it, vi } from "vitest";

const convertToModelMessagesMock = vi.fn(async (messages) => messages);
const normalizeSessionTokenMock = vi.fn((value) => typeof value === "string" ? value : null);
const recordChatAttemptMock = vi.fn(async () => undefined);
const toUIMessageStreamResponseMock = vi.fn(() => new Response("ok", { status: 200 }));
const streamTextMock = vi.fn(() => ({
  toUIMessageStreamResponse: toUIMessageStreamResponseMock,
}));

vi.mock("ai", () => ({
  consumeStream: vi.fn(),
  convertToModelMessages: convertToModelMessagesMock,
  streamText: streamTextMock,
}));

vi.mock("@/lib/chat-storage", () => ({
  normalizeSessionToken: normalizeSessionTokenMock,
  recordChatAttempt: recordChatAttemptMock,
}));

vi.mock("@/lib/request-guard", async () => {
  const actual = await import("../../lib/request-guard.ts");
  return actual;
});

describe("POST /api/chat", () => {
  beforeEach(async () => {
    vi.resetModules();
    convertToModelMessagesMock.mockClear();
    normalizeSessionTokenMock.mockClear();
    recordChatAttemptMock.mockClear();
    streamTextMock.mockClear();
    toUIMessageStreamResponseMock.mockClear();
    const { resetRequestGuardForTests } = await import("../../lib/request-guard.ts");
    resetRequestGuardForTests();
  });

  async function loadRoute() {
    return import("../../app/api/chat/route.ts");
  }

  function makeRequest(body, headers = {}) {
    return new Request("https://nexuradata.ca/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.20",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  it("rejects empty payloads", async () => {
    const { POST } = await loadRoute();
    const response = await POST(makeRequest({ messages: [] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid-chat-payload",
    });
    expect(streamTextMock).not.toHaveBeenCalled();
    expect(recordChatAttemptMock).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "rejected",
      errorCode: "invalid-chat-payload",
    }));
  });

  it("rejects very short user prompts", async () => {
    const { POST } = await loadRoute();
    const response = await POST(makeRequest({
      locale: "fr",
      messages: [{
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "a" }],
      }],
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "chat-message-too-short",
    });
    expect(streamTextMock).not.toHaveBeenCalled();
    expect(recordChatAttemptMock).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "rejected",
      errorCode: "chat-message-too-short",
      locale: "fr",
    }));
  });

  it("rejects oversized payloads", async () => {
    const { POST } = await loadRoute();
    const longText = "x".repeat(1100);
    const messages = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      role: "user",
      parts: [{ type: "text", text: longText }],
    }));

    const response = await POST(makeRequest({ locale: "en", messages }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "chat-payload-too-large",
    });
    expect(streamTextMock).not.toHaveBeenCalled();
    expect(recordChatAttemptMock).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "rejected",
      errorCode: "chat-payload-too-large",
      locale: "en",
    }));
  });

  it("normalizes incoming messages before sending them to the model", async () => {
    const { POST } = await loadRoute();
    const longText = "y".repeat(1200);
    const shortText = "z".repeat(300);
    const messages = [
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `assistant-${index}`,
        role: index % 2 === 0 ? "assistant" : "user",
        parts: [{
          type: "text",
          text: index < 2 ? longText : shortText,
        }],
      })),
      {
        id: "tool",
        role: "tool",
        parts: [{ type: "text", text: "ignore me" }],
      },
    ];

    const response = await POST(makeRequest({ locale: "es", sessionId: "chat_session_12345", messages }));

    expect(response.status).toBe(200);
    expect(convertToModelMessagesMock).toHaveBeenCalledTimes(1);
    expect(recordChatAttemptMock).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "accepted",
      locale: "en",
      sessionToken: "chat_session_12345",
    }));
    const normalizedMessages = convertToModelMessagesMock.mock.calls[0][0];
    expect(normalizedMessages).toHaveLength(9);
    expect(normalizedMessages.every((message) => message.role === "user" || message.role === "assistant")).toBe(true);
    expect(normalizedMessages.every((message) => message.parts[0].text.length <= 1000)).toBe(true);
    expect(streamTextMock.mock.calls[0][0].system).toContain("You are NEXURA's AI assistant");
    expect(toUIMessageStreamResponseMock).toHaveBeenCalledTimes(1);
  });
});
