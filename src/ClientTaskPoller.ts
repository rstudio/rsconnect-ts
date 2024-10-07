import { debugLog } from './debugLog'
import { APIClient } from './APIClient'
import { ClientTaskV1Response } from './api-types'

export class ClientTaskPoller {
  private readonly client: APIClient
  private readonly taskId: string
  private readonly wait: number

  constructor (client: APIClient, taskId: string, wait?: number) {
    this.client = client
    this.taskId = taskId
    this.wait = (wait !== null && wait !== undefined) ? wait : 1
  }

  public async * poll (timeout?: number): AsyncGenerator<ClientTaskPollResult> {
    const pollTimeout = (
      timeout !== null && timeout !== undefined
        ? ((Date.now() / 1000 | 0) + timeout)
        : Infinity
    )
    let first: number | undefined
    while ((Date.now() / 1000 | 0) < pollTimeout) {
      if (this.taskId === '') {
        debugLog(() => 'ClientTaskPollResult: returning due to empty task id')
        return
      }

      debugLog(() => [
        'ClientTaskPollResult: getting',
        `task=${JSON.stringify(this.taskId)}`,
        `first=${JSON.stringify(first)}`,
        `wait=${JSON.stringify(this.wait)}`
      ].join(' '))

      const curTask: ClientTaskV1Response = await this.client.getTask(
        this.taskId, first, this.wait
      )

      const res = {
        output: curTask.output,
        type: curTask.result?.type,
        data: curTask.result?.data
      }

      debugLog(() => [
        'ClientTaskPollResult: yielding',
        `result=${JSON.stringify(res)}`
      ].join(' '))

      yield res

      first = curTask.last
      if (curTask.finished) {
        debugLog(() => 'ClientTaskPollResult: returning due to finished')
        return
      }
    }
  }
}

export interface ClientTaskPollResult {
  output: string[]
  type?: string
  data?: any
}
