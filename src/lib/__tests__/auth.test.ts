import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockCookieSet, mockCookieGet, mockSign, mockSignJWT, mockJwtVerify } = vi.hoisted(() => {
  const mockCookieSet = vi.fn();
  const mockCookieGet = vi.fn();
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSignJWT = vi.fn().mockReturnValue({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  });
  const mockJwtVerify = vi.fn();
  return { mockCookieSet, mockCookieGet, mockSign, mockSignJWT, mockJwtVerify };
});

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ set: mockCookieSet, get: mockCookieGet }),
}));

vi.mock("jose", () => ({
  SignJWT: mockSignJWT,
  jwtVerify: mockJwtVerify,
}));

import { createSession, getSession } from "@/lib/auth";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSign.mockResolvedValue("mock-jwt-token");
  });

  test("creates a JWT with the correct payload", async () => {
    await createSession("user-123", "user@example.com");

    expect(mockSignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        email: "user@example.com",
      })
    );
  });

  test("signs the JWT with HS256 algorithm", async () => {
    const instance = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: mockSign,
    };
    mockSignJWT.mockReturnValueOnce(instance);

    await createSession("user-123", "user@example.com");

    expect(instance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
    expect(instance.setExpirationTime).toHaveBeenCalledWith("7d");
    expect(instance.setIssuedAt).toHaveBeenCalled();
  });

  test("sets an httpOnly cookie with the token", async () => {
    await createSession("user-123", "user@example.com");

    expect(mockCookieSet).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  test("sets cookie expiry approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-123", "user@example.com");
    const after = Date.now();

    const { expires } = mockCookieSet.mock.calls[0][2];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("sets secure cookie in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await createSession("user-123", "user@example.com");

    expect(mockCookieSet).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({ secure: true })
    );

    vi.unstubAllEnvs();
  });

  test("sets non-secure cookie outside production", async () => {
    await createSession("user-123", "user@example.com");

    expect(mockCookieSet).toHaveBeenCalledWith(
      "auth-token",
      "mock-jwt-token",
      expect.objectContaining({ secure: false })
    );
  });
});

describe("getSession", () => {
  const mockPayload = {
    userId: "user-123",
    email: "user@example.com",
    expiresAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null when no cookie is present", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await getSession();

    expect(result).toBeNull();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  test("returns the session payload when the token is valid", async () => {
    mockCookieGet.mockReturnValue({ value: "valid-token" });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(result).toEqual(mockPayload);
  });

  test("verifies the token from the auth-token cookie", async () => {
    mockCookieGet.mockReturnValue({ value: "valid-token" });
    mockJwtVerify.mockResolvedValue({ payload: mockPayload });

    await getSession();

    expect(mockJwtVerify).toHaveBeenCalledWith("valid-token", expect.any(Object));
  });

  test("returns null when the token is invalid", async () => {
    mockCookieGet.mockReturnValue({ value: "bad-token" });
    mockJwtVerify.mockRejectedValue(new Error("invalid signature"));

    const result = await getSession();

    expect(result).toBeNull();
  });

  test("returns null when the token is expired", async () => {
    mockCookieGet.mockReturnValue({ value: "expired-token" });
    mockJwtVerify.mockRejectedValue(new Error("token expired"));

    const result = await getSession();

    expect(result).toBeNull();
  });
});
