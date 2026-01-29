import path from 'path'

import { debugLog } from './debugLog'
import { MiniGit } from './MiniGit'
import { Git } from './Git'

export class ApplicationPather {
  private readonly git: Git

  constructor (git?: Git) {
    this.git = (
      git !== undefined && git !== null
        ? git
        : new MiniGit()
    )
  }

  public resolve (manifestPath?: string, appPath?: string): string {
    if (appPath !== null && appPath !== undefined) {
      debugLog(() => `ApplicationPather: returning non-empty app path=${appPath}`)
      return ApplicationPather.strictAppPath(appPath)
    }

    if (manifestPath === null || manifestPath === undefined) {
      debugLog(() => 'ApplicationPather: returning empty app path')
      return ''
    }

    const gitTopLevel = this.git.showTopLevel()
    if (gitTopLevel === null) {
      const gitLessPath = path.basename(path.dirname(manifestPath))

      debugLog(() => [
        'ApplicationPather: returning without git prefix removed app',
        `path=${JSON.stringify(gitLessPath)}`
      ].join(' '))

      return ApplicationPather.strictAppPath(gitLessPath)
    }

    let gitPrefix = ''
    const gitRemoteURL = this.git.remoteURL()
    if (gitRemoteURL === null) {
      const curDir = (
        process.env.PWD !== undefined
          ? process.env.PWD
          : process.cwd()
      )
      gitPrefix = path.basename(curDir)
      debugLog(() => [
        'ApplicationPather: deriving git',
        `prefix=${JSON.stringify(gitPrefix)}`,
        'from current',
        `dir=${JSON.stringify(curDir)}`
      ].join(' '))
    } else {
      gitPrefix = this.pathFromGitRemoteURL(gitRemoteURL)
    }

    const relPath = ApplicationPather.strictAppPath([
      gitPrefix,
      path.dirname(manifestPath).replace(gitTopLevel, '')
    ].join('/'))

    debugLog(() => [
      'ApplicationPather: returning with git',
      `prefix=${JSON.stringify(gitPrefix)}`,
      `path=${JSON.stringify(relPath)}`
    ].join(' '))

    return relPath
  }

  public static strictAppPath (appPath: string): string {
    const inSlashes = (
      '/' +
      appPath.trim().replace(/${path.sep}/g, '/') +
      '/'
    )
    return inSlashes
      .replace(/\.\//g, '/')
      .replace(/( +|[^-_a-z0-9/])/ig, '_')
      .replace(/\/\//g, '/')
      .replace(/\/_+/, '/_')
  }

  private pathFromGitRemoteURL (gitRemoteURL: string): string {
    let rawURL = gitRemoteURL
    if (gitRemoteURL.match(/[^/]+:[^/]+/) !== null) {
      rawURL = 'ssh://' + gitRemoteURL.replace(/:/, '/')
    }

    try {
      const parsedURL = new URL(rawURL)
      return this.sansScheme(
        this.sansTrailingGit([parsedURL.host, parsedURL.pathname].join('/'))
      )
    } catch (err: any) {
      debugLog(() => `ApplicationPather: failed to parse raw git URL ${rawURL}`)
      return this.sansScheme(this.sansTrailingGit(rawURL))
    }
  }

  private sansTrailingGit (s: string): string {
    return s.replace(/\.git$/, '')
  }

  private sansScheme (s: string): string {
    return s.replace(/^[a-z]+:\/\//i, '')
  }
}
