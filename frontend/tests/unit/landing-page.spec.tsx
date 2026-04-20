import { render, screen } from "@testing-library/react";
import React from "react";
import { expect, test } from "vitest";

import LandingPage from "../../app/page";

test("landing page shows main conversion entry", () => {
  render(<LandingPage />);
  expect(screen.getAllByText("Run My Free Audit").length).toBeGreaterThan(0);
});
