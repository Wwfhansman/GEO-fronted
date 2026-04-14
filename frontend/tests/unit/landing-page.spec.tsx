import { render, screen } from "@testing-library/react";
import React from "react";
import { expect, test } from "vitest";

import LandingPage from "../../app/page";

test("landing page shows main conversion entry", () => {
  render(<LandingPage />);
  expect(screen.getAllByText("免费检测我的品牌").length).toBeGreaterThan(0);
});
