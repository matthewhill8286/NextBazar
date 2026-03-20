import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FavoriteButton from "@/app/components/favorite-button";

// ---------------------------------------------------------------------------
// Supabase mock — shared mutable chain object so individual tests can override
// terminal method return values.
// ---------------------------------------------------------------------------

const mockMaybeSingle = vi.fn();
const mockDelete = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockRpc = vi.fn().mockResolvedValue({ error: null });

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
  eq: mockEq,
  maybeSingle: mockMaybeSingle,
}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no authenticated user
  mockGetUser.mockResolvedValue({ data: { user: null } });
  // Default: listing not in favorites
  mockMaybeSingle.mockResolvedValue({ data: null });
  // Make delete + insert chain resolvable
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
  mockInsert.mockResolvedValue({ error: null });
});

describe("FavoriteButton", () => {
  it("renders a button", () => {
    render(<FavoriteButton listingId="abc" userId={null} initialSaved={false} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders Heart icon (SVG inside button)", () => {
    render(<FavoriteButton listingId="abc" userId={null} initialSaved={false} />);
    const btn = screen.getByRole("button");
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("does NOT call supabase.auth.getUser when userId prop is provided", async () => {
    render(<FavoriteButton listingId="abc" userId="user-123" initialSaved={false} />);
    // Allow useEffect to settle
    await waitFor(() => {
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });

  it("calls supabase.auth.getUser when no userId prop is given", async () => {
    render(<FavoriteButton listingId="abc" />);
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledOnce();
    });
  });

  it("shows heart as unfilled when initialSaved is false", () => {
    render(<FavoriteButton listingId="abc" userId="user-1" initialSaved={false} />);
    const svg = screen.getByRole("button").querySelector("svg");
    // SVG className is an SVGAnimatedString in jsdom — use getAttribute
    const classes = svg?.getAttribute("class") ?? "";
    expect(classes).not.toContain("fill-red-500");
  });

  it("shows heart as filled (red) when initialSaved is true", () => {
    render(<FavoriteButton listingId="abc" userId="user-1" initialSaved={true} />);
    const svg = screen.getByRole("button").querySelector("svg");
    const classes = svg?.getAttribute("class") ?? "";
    expect(classes).toContain("fill-red-500");
  });

  it("redirects to /auth/login when userId is null and button is clicked", async () => {
    // jsdom doesn't navigate, but we can detect location.href assignment
    const originalHref = window.location.href;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: originalHref },
    });

    render(<FavoriteButton listingId="abc" userId={null} initialSaved={false} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(window.location.href).toBe("/auth/login");
    });
  });

  it("calls supabase delete when toggling off a saved listing", async () => {
    // Setup delete chain to be awaitable
    const mockDeleteEq1 = vi.fn().mockReturnThis();
    const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValueOnce({
      delete: vi.fn().mockReturnValue({ eq: mockDeleteEq1 }),
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    });
    mockDeleteEq1.mockReturnValue({ eq: mockDeleteEq2 });

    render(<FavoriteButton listingId="listing-1" userId="user-1" initialSaved={true} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockDeleteEq2).toHaveBeenCalled();
    });
  });

  it("calls supabase insert when toggling on an unsaved listing", async () => {
    const mockInsertResolved = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValueOnce({
      insert: mockInsertResolved,
      delete: mockDelete,
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    });

    render(<FavoriteButton listingId="listing-2" userId="user-1" initialSaved={false} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockInsertResolved).toHaveBeenCalledWith({
        user_id: "user-1",
        listing_id: "listing-2",
      });
    });
  });

  it("calls onToggle with new saved state after toggling", async () => {
    const mockInsertResolved = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsertResolved,
      delete: mockDelete,
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    });

    const onToggle = vi.fn();
    render(
      <FavoriteButton
        listingId="listing-3"
        userId="user-1"
        initialSaved={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });
});
