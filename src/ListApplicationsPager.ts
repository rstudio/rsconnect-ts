import { APIClient } from './APIClient'
import { Application } from './api-types'
import { keysToCamel } from './conversions'
import { debugLog } from './debugLog'

export class ListApplicationsPager {
  private readonly client: APIClient

  constructor (client: APIClient) {
    this.client = client
  }

  public async * listApplications (maxRecords?: number): AsyncGenerator<Application, unknown, unknown> {
    if (maxRecords === undefined || maxRecords === null || maxRecords <= 0) {
      maxRecords = Infinity
    }

    debugLog(() => 'ListApplicationsPager: fetching all applications')
    const result = await this.client.listApplications()

    let n = 0
    for (const app of result.applications) {
      if (n >= maxRecords) {
        debugLog(() => `ListApplicationsPager: breaking at max records limit ${(maxRecords as number).toString()}`)
        return n
      }
      n++

      const appRecord = keysToCamel(app)
      debugLog(() => `ListApplicationsPager: yielding app record ${JSON.stringify(appRecord)}`)
      yield appRecord
    }

    return n
  }
}
