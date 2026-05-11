import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const owner = process.env.GITHUB_REPOSITORY_OWNER ?? 'OpenCoworkAI';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'open-codesign';
const token = process.env.GITHUB_TOKEN;
const outputDirectory = process.env.ACTIVITY_SNAPSHOT_DIR ?? 'repository-activity';

if (!token) {
  throw new Error('GITHUB_TOKEN is required to collect repository activity snapshots');
}

const apiBase = `https://api.github.com/repos/${owner}/${repository}`;
const headers = {
  accept: 'application/vnd.github+json',
  authorization: `Bearer ${token}`,
  'x-github-api-version': '2022-11-28',
};

async function getJson(path) {
  const response = await fetch(`${apiBase}${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${path} failed with ${response.status}: ${body}`);
  }
  return response.json();
}

const fetchedAt = new Date().toISOString();
const [views, clones, popularPaths, popularReferrers] = await Promise.all([
  getJson('/traffic/views'),
  getJson('/traffic/clones'),
  getJson('/traffic/popular/paths'),
  getJson('/traffic/popular/referrers'),
]);

const snapshot = {
  repository: `${owner}/${repository}`,
  fetched_at: fetchedAt,
  retention_note:
    'GitHub repository metrics APIs expose only recent aggregate data. This file preserves the current aggregate response without adding product or site telemetry.',
  views,
  clones,
  popular_paths: popularPaths,
  popular_referrers: popularReferrers,
};

await mkdir(outputDirectory, { recursive: true });
const day = fetchedAt.slice(0, 10);
await writeFile(join(outputDirectory, `${day}.json`), `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      repository: snapshot.repository,
      fetched_at: snapshot.fetched_at,
      output: `${outputDirectory}/${day}.json`,
      views: { count: views.count, uniques: views.uniques },
      clones: { count: clones.count, uniques: clones.uniques },
      top_referrer: popularReferrers[0]?.referrer ?? null,
      top_path: popularPaths[0]?.path ?? null,
    },
    null,
    2,
  ),
);
