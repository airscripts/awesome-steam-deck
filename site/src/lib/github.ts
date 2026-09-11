const repository = "airscripts/awesome-steam-deck";

export async function getGithubStars(timeoutMs = 1500): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { accept: "application/vnd.github+json" },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const body = (await response.json()) as { stargazers_count?: unknown };

    return typeof body.stargazers_count === "number"
      ? body.stargazers_count
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export { repository };
