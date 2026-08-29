import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Bersihkan DOM antar test — tanpa ini, render test sebelumnya bocor
afterEach(() => {
  cleanup();
});
