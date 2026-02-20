import { decodeStoredGames } from "../game-storage-codec";
import {
  DEFAULT_CARD_MOUNT_STYLE,
  DEFAULT_POSTCARD_SIDE,
  DEFAULT_TICKET_TYPE,
} from "../types";

function baseGame(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "g-1",
    title: "Test Game",
    status: "playing",
    notes: [],
    ...overrides,
  };
}

describe("decodeStoredGames", () => {
  it("returns null for invalid JSON", () => {
    expect(decodeStoredGames("{")).toBeNull();
  });

  it("returns null when the parsed value is not an array", () => {
    expect(decodeStoredGames(JSON.stringify({ id: "not-array" }))).toBeNull();
  });

  it("returns an empty array for an empty payload", () => {
    expect(decodeStoredGames(JSON.stringify([]))).toEqual([]);
  });

  it("decodes a valid minimal game and applies defaults", () => {
    const result = decodeStoredGames(JSON.stringify([baseGame()]));

    expect(result).toEqual([
      {
        id: "g-1",
        title: "Test Game",
        status: "playing",
        notes: [],
        ticketType: DEFAULT_TICKET_TYPE,
        mountStyle: DEFAULT_CARD_MOUNT_STYLE,
        postcardSide: DEFAULT_POSTCARD_SIDE,
      },
    ]);
  });

  it("decodes all supported optional fields and strips unknown fields", () => {
    const raw = JSON.stringify([
      baseGame({
        ticketType: "postcard",
        mountStyle: "metal-pin",
        postcardSide: "back",
        imageUri: "file://cover.png",
        playtime: "19h",
        board: {
          x: 1,
          y: 2,
          w: 3,
          h: 4,
          columns: 5,
          extraBoard: "drop-me",
        },
        lastNote: {
          id: "n-last",
          timestamp: 123,
          whereLeftOff: "Boss room",
          quickThought: "Intense",
          extraLastNote: true,
        },
        notes: [
          {
            id: "n-1",
            timestamp: 100,
            whereLeftOff: "Checkpoint A",
            quickThought: "Nice level",
            extraNoteField: "drop-me",
          },
        ],
        extraRootField: "drop-me",
      }),
    ]);

    const result = decodeStoredGames(raw);

    expect(result).toEqual([
      {
        id: "g-1",
        title: "Test Game",
        status: "playing",
        notes: [
          {
            id: "n-1",
            timestamp: 100,
            whereLeftOff: "Checkpoint A",
            quickThought: "Nice level",
          },
        ],
        ticketType: "postcard",
        mountStyle: "metal-pin",
        postcardSide: "back",
        board: { x: 1, y: 2, w: 3, h: 4, columns: 5 },
        lastNote: {
          id: "n-last",
          timestamp: 123,
          whereLeftOff: "Boss room",
          quickThought: "Intense",
        },
        imageUri: "file://cover.png",
        playtime: "19h",
      },
    ]);
    expect(result?.[0]).not.toHaveProperty("extraRootField");
    expect(result?.[0].board).not.toHaveProperty("extraBoard");
    expect(result?.[0].notes[0]).not.toHaveProperty("extraNoteField");
  });

  it("normalizes unsupported card variants to defaults", () => {
    const result = decodeStoredGames(
      JSON.stringify([
        baseGame({
          ticketType: "legacy-ticket",
          mountStyle: "thumbtack",
          postcardSide: "left",
        }),
      ])
    );

    expect(result?.[0]).toMatchObject({
      ticketType: DEFAULT_TICKET_TYPE,
      mountStyle: DEFAULT_CARD_MOUNT_STYLE,
      postcardSide: DEFAULT_POSTCARD_SIDE,
    });
  });

  it("omits imageUri and playtime when they are not strings", () => {
    const result = decodeStoredGames(
      JSON.stringify([
        baseGame({
          imageUri: 123,
          playtime: false,
        }),
      ])
    );

    expect(result).toEqual([
      {
        id: "g-1",
        title: "Test Game",
        status: "playing",
        notes: [],
        ticketType: DEFAULT_TICKET_TYPE,
        mountStyle: DEFAULT_CARD_MOUNT_STYLE,
        postcardSide: DEFAULT_POSTCARD_SIDE,
      },
    ]);
  });

  it.each([
    { label: "entry is null", entry: null },
    { label: "entry is array", entry: [] },
    { label: "id is not string", entry: baseGame({ id: 1 }) },
    { label: "title is not string", entry: baseGame({ title: 1 }) },
    { label: "status is unknown", entry: baseGame({ status: "paused" }) },
    { label: "status is not string", entry: baseGame({ status: true }) },
    { label: "notes is not array", entry: baseGame({ notes: {} }) },
  ])("rejects invalid game shapes: $label", ({ entry }) => {
    expect(decodeStoredGames(JSON.stringify([entry]))).toBeNull();
  });

  it.each([
    { label: "note is null", note: null },
    { label: "note id is not string", note: { id: 1, timestamp: 1, whereLeftOff: "A" } },
    {
      label: "note timestamp is not finite",
      raw: '[{"id":"g-1","title":"T","status":"playing","notes":[{"id":"n","timestamp":1e309,"whereLeftOff":"A"}]}]',
    },
    {
      label: "note whereLeftOff is not string",
      note: { id: "n-1", timestamp: 1, whereLeftOff: 5 },
    },
    {
      label: "note quickThought has invalid type",
      note: { id: "n-1", timestamp: 1, whereLeftOff: "A", quickThought: 5 },
    },
  ])("rejects invalid note shapes: $label", ({ note, raw }) => {
    const payload =
      raw ??
      JSON.stringify([
        baseGame({
          notes: [note],
        }),
      ]);
    expect(decodeStoredGames(payload)).toBeNull();
  });

  it("rejects payload when any note in the notes array is invalid", () => {
    const result = decodeStoredGames(
      JSON.stringify([
        baseGame({
          notes: [
            { id: "n-ok", timestamp: 1, whereLeftOff: "A" },
            { id: "n-bad", timestamp: "oops", whereLeftOff: "B" },
          ],
        }),
      ])
    );

    expect(result).toBeNull();
  });

  it.each([
    {
      label: "board is not an object",
      board: "bad",
    },
    {
      label: "board contains non-finite numeric values",
      raw: '[{"id":"g-1","title":"T","status":"playing","notes":[],"board":{"x":1e309,"y":0,"w":1,"h":1,"columns":4}}]',
    },
    {
      label: "board is missing required numeric field",
      board: { x: 0, y: 0, w: 1, h: 1 },
    },
  ])("rejects invalid board placement: $label", ({ board, raw }) => {
    const payload =
      raw ??
      JSON.stringify([
        baseGame({
          board,
        }),
      ]);
    expect(decodeStoredGames(payload)).toBeNull();
  });

  it.each([
    {
      label: "lastNote id is invalid",
      lastNote: { id: 9, timestamp: 1, whereLeftOff: "A" },
    },
    {
      label: "lastNote timestamp is invalid",
      lastNote: { id: "n", timestamp: null, whereLeftOff: "A" },
    },
    {
      label: "lastNote whereLeftOff is invalid",
      lastNote: { id: "n", timestamp: 1, whereLeftOff: null },
    },
    {
      label: "lastNote quickThought is invalid",
      lastNote: { id: "n", timestamp: 1, whereLeftOff: "A", quickThought: {} },
    },
  ])("rejects invalid lastNote: $label", ({ lastNote }) => {
    const result = decodeStoredGames(
      JSON.stringify([
        baseGame({
          lastNote,
        }),
      ])
    );
    expect(result).toBeNull();
  });

  it("fails the entire payload when one item is invalid", () => {
    const payload = JSON.stringify([
      baseGame({ id: "good" }),
      baseGame({ id: "bad", notes: "not-array" }),
    ]);

    expect(decodeStoredGames(payload)).toBeNull();
  });

  it("is deterministic and stateless across repeated calls", () => {
    const raw = JSON.stringify([baseGame({ id: "repeatable" })]);

    const first = decodeStoredGames(raw);
    expect(first).not.toBeNull();
    first![0].title = "mutated-locally";

    const second = decodeStoredGames(raw);
    expect(second).toEqual([
      {
        id: "repeatable",
        title: "Test Game",
        status: "playing",
        notes: [],
        ticketType: DEFAULT_TICKET_TYPE,
        mountStyle: DEFAULT_CARD_MOUNT_STYLE,
        postcardSide: DEFAULT_POSTCARD_SIDE,
      },
    ]);
  });

  it("handles large valid payloads deterministically", () => {
    const entries = Array.from({ length: 300 }, (_, i) =>
      baseGame({
        id: `g-${i}`,
        title: `Game ${i}`,
        status: i % 2 === 0 ? "playing" : "finished",
      })
    );

    const result = decodeStoredGames(JSON.stringify(entries));

    expect(result).toHaveLength(300);
    expect(result?.[0].id).toBe("g-0");
    expect(result?.[299].id).toBe("g-299");
    expect(result?.every((game) => game.ticketType === DEFAULT_TICKET_TYPE)).toBe(true);
  });
});
