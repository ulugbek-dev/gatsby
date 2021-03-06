const { createHash } = require(`crypto`)
const { basename } = require(`path`)
const { execSync } = require(`child_process`)
const gitUp = require(`git-up`)

const getRepositoryId = () => {
  const gitRepo = getGitRemoteWithGit() || getRepositoryFromNetlifyEnv()
  if (gitRepo) {
    return gitRepo
  } else {
    const repo = getRepositoryIdFromPath()
    return { repositoryId: `pwd:${hash(repo)}` }
  }
}

const getRepoMetadata = url => {
  try {
    // This throws for invalid urls
    const { resource: provider, pathname } = gitUp(url)
    const res = { provider: hash(provider) }

    const userAndRepo = pathname.split(`/`)
    if (userAndRepo.length == 3) {
      res.owner = hash(userAndRepo[1])
      res.name = hash(userAndRepo[2].replace(`.git`, ``))
    }

    return res
  } catch (e) {
    // ignore
  }
  return null
}

const getRepositoryIdFromPath = () => basename(process.cwd())

const getGitRemoteWithGit = () => {
  try {
    // we may live multiple levels in git repo
    const originBuffer = execSync(
      `git config --local --get remote.origin.url`,
      { timeout: 1000, stdio: `pipe` }
    )
    const repo = String(originBuffer).trim()
    if (repo) {
      return {
        repositoryId: `git:${hash(repo)}`,
        repositoryData: getRepoMetadata(repo),
      }
    }
  } catch (e) {
    // ignore
  }
  return null
}

const getRepositoryFromNetlifyEnv = () => {
  if (process.env.NETLIFY) {
    try {
      const url = process.env.REPOSITORY_URL
      const repoPart = url.split(`@`)[1]
      if (repoPart) {
        return {
          repositoryId: `git:${hash(repoPart)}`,
          repositoryData: getRepoMetadata(url),
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return null
}

const hash = str => createHash(`sha256`).update(str).digest(`hex`)

module.exports = {
  getRepositoryId,
  getRepoMetadata,
}
