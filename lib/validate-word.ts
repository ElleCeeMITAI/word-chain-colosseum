export async function isValidEnglishWord(word: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    return res.ok;
  } catch {
    // Fail open: if API is unreachable or times out, accept the word
    return true;
  }
}
