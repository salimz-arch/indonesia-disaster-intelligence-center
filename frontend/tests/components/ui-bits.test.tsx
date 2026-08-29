import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MagnitudeBadge } from "@/components/earthquake/magnitude-badge";
import { SeverityBadge } from "@/components/common/severity-badge";
import { SourceTag } from "@/components/common/source-tag";

describe("MagnitudeBadge", () => {
  it("menampilkan M dengan satu desimal", () => {
    render(<MagnitudeBadge magnitude={5.24} category="strong" />);
    expect(screen.getByText("M 5.2")).toBeInTheDocument();
  });
});

describe("SeverityBadge — teks + ikon dot", () => {
  it("critical menampilkan label CRITICAL", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });
});

describe("SourceTag — transparansi sumber (§40)", () => {
  it("menampilkan provider + waktu relatif", () => {
    render(
      <SourceTag
        source="bmkg"
        timestamp={new Date(Date.now() - 5 * 60_000).toISOString()}
      />,
    );
    expect(screen.getByText(/bmkg/i)).toBeInTheDocument();
    expect(screen.getByText(/mnt lalu/)).toBeInTheDocument();
  });

  it("tanpa props → render null (tidak crash)", () => {
    const { container } = render(<SourceTag />);
    expect(container).toBeEmptyDOMElement();
  });
});
