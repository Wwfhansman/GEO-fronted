import { render, screen } from "@testing-library/react";
import React from "react";
import { expect, test } from "vitest";

import LandingPage from "../../app/page";

test("landing page shows main conversion entry", () => {
  render(<LandingPage />);
  expect(screen.getByText("立即免费测试")).toBeTruthy();
});
