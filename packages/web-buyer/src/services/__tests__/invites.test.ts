import { describe, it, expect, beforeEach } from "vitest";
import { sendInvite, sendBulkInvites, generateInviteLink, getInviteStats, getInviteHistory } from "../invites";

beforeEach(() => {
  // @ts-expect-access-private-store
  const store = (globalThis as any).__INVITE_STORE__;
  if (store) store.clear();
});

describe("sendInvite", () => {
  it("creates an invite record for a single email", { timeout: 15000 }, async () => {
    const record = await sendInvite("user-1", "email", { name: "Alice", email: "alice@test.com" });
    expect(record.id).toMatch(/^INV-/);
    expect(record.channel).toBe("email");
    expect(record.recipientEmail).toBe("alice@test.com");
    expect(record.recipientName).toBe("Alice");
    expect(record.status).toBe("sent");
    expect(record.sentAt).toBeTruthy();
    expect(record.referrerId).toBe("user-1");
  });

  it("creates an invite record for WhatsApp", async () => {
    const record = await sendInvite("user-1", "whatsapp", { phone: "+22990123456" });
    expect(record.channel).toBe("whatsapp");
    expect(record.recipientPhone).toBe("+22990123456");
  });
});

describe("sendBulkInvites", () => {
  it("returns an array of records for multiple recipients", async () => {
    const recipients = [
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ];
    const records = await sendBulkInvites("user-1", "email", recipients);
    expect(records).toHaveLength(2);
    expect(records[0].recipientEmail).toBe("alice@test.com");
    expect(records[1].recipientEmail).toBe("bob@test.com");
  });
});

describe("generateInviteLink", () => {
  it("returns a valid URL with ref parameter", async () => {
    const link = await generateInviteLink("user-abc123");
    expect(link).toContain("/register?ref=");
  });
});

describe("getInviteStats", () => {
  it("returns zero stats for a user with no invites", async () => {
    const stats = await getInviteStats("new-user");
    expect(stats.totalSent).toBe(0);
    expect(stats.totalClicked).toBe(0);
    expect(stats.totalRegistered).toBe(0);
    expect(stats.conversionRate).toBe(0);
  });

  it("reflects sent invites in stats", async () => {
    await sendInvite("user-2", "email", { email: "x@test.com" });
    await sendInvite("user-2", "email", { email: "y@test.com" });
    const stats = await getInviteStats("user-2");
    expect(stats.totalSent).toBe(2);
  });

  it("calculates conversion rate correctly", async () => {
    await sendInvite("user-3", "email", { email: "a@test.com" });
    await sendInvite("user-3", "email", { email: "b@test.com" });
    const stats = await getInviteStats("user-3");
    expect(stats.totalSent).toBe(2);
    expect(stats.totalRegistered).toBe(0);
    expect(stats.conversionRate).toBe(0);
  });
});

describe("getInviteHistory", () => {
  it("returns empty array for a user with no invites", async () => {
    const history = await getInviteHistory("no-invites");
    expect(history).toEqual([]);
  });

  it("returns all invite records after sending", async () => {
    await sendInvite("user-4", "email", { email: "a@test.com" });
    const history = await getInviteHistory("user-4");
    expect(history).toHaveLength(1);
    expect(history[0].recipientEmail).toBe("a@test.com");
  });
});
