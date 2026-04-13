import { expect, test } from "vitest";

import { loadDraft, saveDraft } from "../../lib/draft";

test("saves and loads test form draft", () => {
  saveDraft({
    companyName: "Acme",
    productKeyword: "云服务器",
    industry: "IT科技",
    provider: "chatgpt",
  });
  expect(loadDraft()?.companyName).toBe("Acme");
});
