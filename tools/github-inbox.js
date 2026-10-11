// Commits captured play sessions to a GitHub branch.
//
// A hosted play server (Render, for play away from home) has a disk that is
// wiped on every restart, and agents cannot reach it anyway. Agents read the
// repository, so the server writes each new session there as well. `main` is
// protected and refuses direct pushes, so sessions land on their own branch
// (PLAY_INBOX_BRANCH, default `play-inbox`), which is created from the
// repository's default branch on first use.
//
// The token needs Contents read/write on this one repository and nothing more.
const DEFAULT_API = 'https://api.github.com';

function createGithubInbox({ token, repo, branch = 'play-inbox', apiBase = DEFAULT_API, fetchImpl = fetch,
  attempts = 4, retryDelayMs = 2000, log = (line) => process.stderr.write(`${line}\n`) } = {}) {
  if (!token) throw new Error('GitHub inbox needs a token');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error('GitHub inbox needs a repo as owner/name');
  const headers = {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': '2022-11-28',
    'user-agent': 'map-elites-2248-play-server',
  };
  const api = (route, options = {}) => fetchImpl(`${apiBase}/repos/${repo}${route}`, {
    ...options,
    headers: { ...headers, ...(options.body ? { 'content-type': 'application/json' } : {}) },
  });
  let branchReady = null;

  async function createBranch() {
    const info = await api('');
    if (!info.ok) throw new Error(`could not read repository (HTTP ${info.status})`);
    const base = (await info.json()).default_branch;
    const head = await api(`/git/ref/heads/${encodeURIComponent(base)}`);
    if (!head.ok) throw new Error(`could not read ${base} (HTTP ${head.status})`);
    const created = await api('/git/refs', {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: (await head.json()).object.sha }),
    });
    // 422 here means another request created the branch first.
    if (!created.ok && created.status !== 422) throw new Error(`could not create ${branch} (HTTP ${created.status})`);
  }

  function ensureBranch() {
    branchReady ||= (async () => {
      const found = await api(`/git/ref/heads/${encodeURIComponent(branch)}`);
      if (found.ok) return;
      if (found.status !== 404) throw new Error(`could not read ${branch} (HTTP ${found.status})`);
      await createBranch();
    })().catch((error) => { branchReady = null; throw error; });
    return branchReady;
  }

  async function putOnce(filePath, body, message) {
    await ensureBranch();
    const response = await api(`/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'PUT',
      body: JSON.stringify({ message, branch, content: Buffer.from(body, 'utf8').toString('base64') }),
    });
    if (response.ok) return 'committed';
    // Without a sha GitHub refuses to overwrite: the file is already there.
    if (response.status === 422) return 'already present';
    throw new Error(`commit failed (HTTP ${response.status})`);
  }

  async function publish(filePath, body, message = `play session ${filePath}`) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        const result = await putOnce(filePath, body, message);
        log(`inbox: ${filePath} ${result} on ${branch}`);
        return result;
      } catch (error) {
        if (attempt >= attempts) {
          log(`inbox: ${filePath} NOT saved to GitHub after ${attempts} attempts: ${error.message}`);
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * 2 ** (attempt - 1)));
      }
    }
  }

  return { publish, branch };
}

function inboxFromEnv(env = process.env) {
  if (!env.GITHUB_TOKEN || !env.PLAY_INBOX_REPO) return null;
  return createGithubInbox({ token: env.GITHUB_TOKEN, repo: env.PLAY_INBOX_REPO, branch: env.PLAY_INBOX_BRANCH || undefined });
}

module.exports = { createGithubInbox, inboxFromEnv };
