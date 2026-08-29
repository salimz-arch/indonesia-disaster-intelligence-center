import { render, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LiveBadge } from "@/components/common/live-badge";

describe("LiveBadge — §16 & §27 (ikon+teks, bukan warna saja)", () => {
  afterEach(() => cleanup());

  it.each([
    ["live", "LIVE"],
    ["degraded", "DEGRADED"],
    ["reconnecting", "RECONNECTING…"],
    ["offline", "OFFLINE"],
    ["connecting", "CONNECTING…"],
  ] as const)("status %s menampilkan %s", (status, label) => {
    const { container } = render(<LiveBadge status={status} />);
    const el = within(container).getByRole("status");
    expect(el).toHaveTextContent(label);
    expect(el).toHaveAccessibleName(`Connection status: ${label}`);
  });
});
