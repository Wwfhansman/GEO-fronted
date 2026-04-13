const KEY = "geo-test-draft";

export type TestDraft = {
  companyName: string;
  productKeyword: string;
  industry: string;
  provider: string;
};

export function saveDraft(draft: TestDraft) {
  localStorage.setItem(KEY, JSON.stringify(draft));
}

export function loadDraft(): TestDraft | null {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as TestDraft) : null;
}
