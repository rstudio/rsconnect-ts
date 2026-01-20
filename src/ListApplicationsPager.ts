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
    let resetMaxRecords = false

    if (maxRecords === undefined || maxRecords === null || maxRecords <= 0) {
      maxRecords = Infinity
      resetMaxRecords = true
    }

    let n = 0
    const pageSize = maxRecords < 100 ? maxRecords : 100
    let pageNumber = 1

    while (n < maxRecords) {
      const pageParams = { pageSize, pageNumber }
      debugLog(() => `ListApplicationsPager: fetching page of applications with pageParams: ${JSON.stringify(pageParams)}`)
      const page = await this.client.listApplications(pageParams)

      if (n === 0) {
        if (resetMaxRecords || maxRecords > page.totalCount) {
          debugLog(() => `ListApplicationsPager: setting max records to page totalCount: ${page.totalCount}`)
          maxRecords = page.totalCount
        }
      }

      if (page.applications.length === 0) {
        debugLog(() => 'ListApplicationsPager: no more applications returned')
        return n
      }

      for (let i = 0; i < page.applications.length; i++) {
        if (n >= maxRecords) {
          debugLog(() => `ListApplicationsPager: breaking at max records limit ${(maxRecords as number).toString()}`)
          return n
        }
        n++

        const appRecord = keysToCamel(page.applications[i])

        debugLog(() => `ListApplicationsPager: yielding app record ${JSON.stringify(appRecord)}`)

        yield appRecord
      }

      pageNumber++
    }

    return n
  }
}
