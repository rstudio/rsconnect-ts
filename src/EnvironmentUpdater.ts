import { APIClient } from './APIClient'
import { Environment } from './Environment'
import { debugLog } from './debugLog'

export class EnvironmentUpdater {
  private readonly client: APIClient

  constructor (client: APIClient) {
    this.client = client
  }

  public async updateAppEnvironment (appGUID: string, dir: string = '.'): Promise<string[]> {
    debugLog(() => [
      'EnvironmentUpdater: loading environment for',
      `app=${appGUID}`,
      `dir=${dir}`
    ].join(' '))

    const curDir = process.cwd()
    const env = new Environment()

    try {
      process.chdir(dir)
      env.load()
    } finally {
      process.chdir(curDir)
    }

    if (env.size === 0) {
      debugLog(() => [
        'EnvironmentUpdater: no environment variables found for',
        `app=${appGUID}`,
        `dir=${dir}`
      ].join(' '))
    } else {
      debugLog(() => [
        'EnvironmentUpdater: updating environment for',
        `app=${appGUID}`,
        `dir=${dir}`
      ].join(' '))

      await this.client.updateAppEnvironment(appGUID, env)
    }

    return await this.client.getAppEnvironment(appGUID)
      .then((resp: string[]) => {
        debugLog(() => [
          'EnvironmentUpdater: active environment variables for',
          `app=${appGUID}`,
          `resp=${JSON.stringify(resp)}`
        ].join(' '))

        return resp
      })
  }
}
