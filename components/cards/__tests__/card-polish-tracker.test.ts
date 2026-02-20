import { type TicketType } from "@/lib/types";

type PolishStatus = "done" | "pending";

const CARD_POLISH_STATUS: Record<TicketType, PolishStatus> = {
  polaroid: "done",
  postcard: "pending",
  widget: "pending",
  ticket: "pending",
  minimal: "pending",
};

describe("Card polish tracker", () => {
  it("tracks every ticket type", () => {
    expect(Object.keys(CARD_POLISH_STATUS).sort()).toEqual([
      "minimal",
      "polaroid",
      "postcard",
      "ticket",
      "widget",
    ]);
  });

  it("shows completed card polish work", () => {
    const completed = Object.entries(CARD_POLISH_STATUS)
      .filter(([, status]) => status === "done")
      .map(([type]) => type)
      .sort();

    expect(completed).toEqual(["polaroid"]);
  });
});

Object.entries(CARD_POLISH_STATUS)
  .filter(([, status]) => status === "pending")
  .forEach(([type]) => {
    test.todo(`Polish ${type} card style`);
  });
