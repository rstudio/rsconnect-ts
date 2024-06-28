import * as rsconnect from '../src/main'

describe('EnvironmentUpdater', () => {
  let eu: rsconnect.EnvironmentUpdater
  let client: FakeAPIClient

  beforeEach(() => {
    client = new FakeAPIClient()
    eu = new rsconnect.EnvironmentUpdater(client)
    process.chdir = jest.fn()
  })

  describe('updateAppEnvironment', () => {
    it('works', async () => {
      process.env.CONNECT_ENV_SET_SECRET = 'eye of newt'
      const vars = await eu.updateAppEnvironment('the-content-guid', './somewhar/up/er')
      expect(vars.sort((a, b) => a.localeCompare(b))).toStrictEqual(['MODE', 'SECRET'])
      expect(client.fakeState).toStrictEqual({
        'the-content-guid': {
          MODE: 'ludicrous',
          SECRET: 'eye of newt'
        }
      })
    })
  })
})

class FakeAPIClient extends rsconnect.APIClient {
  public fakeState: any

  constructor () {
    super({
      baseURL: 'http://fake.example.org/__api__',
      apiKey: 'notAsEcRet'
    })
    this.fakeState = {
      'the-content-guid': {
        MODE: 'ludicrous'
      }
    }
  }

  public async getAppEnvironment (appGUID: string): Promise<any> {
    const state = this.fakeState[appGUID] !== undefined ? this.fakeState[appGUID] : {}
    return Object.keys(state)
  }

  public async updateAppEnvironment (appGUID: string, env: rsconnect.Environment): Promise<any> {
    const state = this.fakeState[appGUID] !== undefined ? this.fakeState[appGUID] : {}
    Array.from(env.keys()).forEach(key => {
      const value = env.get(key)
      if (value === null || value === undefined) {
        state.delete(key)
      } else {
        state[key] = value
      }
    })
    this.fakeState[appGUID] = state
  }
}
