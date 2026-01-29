import { APIClient } from './APIClient'
import { Content } from './api-types'
import { keysToCamel } from './conversions'
import { debugLog } from './debugLog'

export class ListContentPager {
  private readonly client: APIClient

  constructor (client: APIClient) {
    this.client = client
  }

  public async * listContent (maxRecords?: number): AsyncGenerator<Content, unknown, unknown> {
    if (maxRecords === undefined || maxRecords === null || maxRecords <= 0) {
      maxRecords = Infinity
    }

    debugLog(() => 'ListContentPager: fetching all content')
    const result = await this.client.listContent()

    let n = 0
    for (const item of result.content) {
      if (n >= maxRecords) {
        debugLog(() => `ListContentPager: breaking at max records limit ${(maxRecords).toString()}`)
        return n
      }
      n++

      const contentRecord = keysToCamel(item)
      debugLog(() => `ListContentPager: yielding content record ${JSON.stringify(contentRecord)}`)
      yield contentRecord
    }

    return n
  }
}
