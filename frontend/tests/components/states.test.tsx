import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState } from "@/components/common/states";

describe("ErrorState", () => {
  it("menampilkan judul, pesan, dan tombol retry yang berfungsi", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        message="Weather service is temporarily unavailable"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("DATA SOURCE UNAVAILABLE")).toBeInTheDocument();
    expect(
      screen.getByText(/Weather service is temporarily unavailable/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("tanpa onRetry → tidak ada tombol", () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("menampilkan judul dan deskripsi", () => {
    render(
      <EmptyState title="Belum ada data" description="Tunggu collector" />,
    );
    expect(screen.getByText("Belum ada data")).toBeInTheDocument();
    expect(screen.getByText("Tunggu collector")).toBeInTheDocument();
  });
});
