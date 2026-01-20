import { AxiosResponse } from 'axios'
import { execSync } from 'child_process'
import path from 'path'

import { ListApplicationsResponse } from '../src/api-types'
import * as rsconnect from '../src/main'

jest.setTimeout(1000 * 60 * 2)

const SEED_ADMIN_CONFIG: rsconnect.APIClientConfiguration = {
  apiKey: process.env.CONNECT_API_KEY as string,
  baseURL: `${process.env.CONNECT_SERVER as string}/__api__`
}

describe('rsconnect', () => {
  describe('server settings API', () => {
    it('serverSettings', async () => {
      const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
      return await client.serverSettings()
        .then((response: AxiosResponse): void => {
          expect(response.status).toBe(200)
        })
    })

    const subSettings = ['r', 'python', 'mail', 'scheduler']

    subSettings.forEach((sub: string) => {
      it(`serverSettings("${sub}")`, async () => {
        const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
        return await client.serverSettings(sub)
          .then((response: AxiosResponse): void => {
            expect(response.status).toBe(200)
          })
      })
    })
  })

  describe('applications API', () => {
    it('listApplications', async () => {
      const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
      return await client.listApplications()
        .then((resp: ListApplicationsResponse) => {
          expect(resp.count).not.toBeNull()
          expect(resp.total).not.toBeNull()
          expect(resp.continuation).not.toBeNull()
        })
    })

    describe('ListApplicationsPager', () => {
      it('listApplications', async () => {
        const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
        const pager = new rsconnect.ListApplicationsPager(client)
        const appGen = pager.listApplications()
        // TODO: seed some applications so that this will iterate
        for await (const app of appGen) {
          expect(app).not.toBeNull()
        }
      })
    })
  })

  describe('deploy API', () => {
    describe('Deployer + ClientTaskPoller', () => {
      it('deployManifest with app path', async () => {
        const top = execSync('git rev-parse --show-toplevel').toString().trim()
        const plumberManifest = path.join(top, '__tests__/apps/plumber/manifest.json')
        const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
        const deployer = new rsconnect.Deployer(client)
        return await deployer.deployManifest({ manifestPath: plumberManifest, appIdentifier: '/fancy/plumber' })
          .then((resp: rsconnect.DeployTaskResponse) => {
            expect(resp.taskId).not.toBeNull()
            return new rsconnect.ClientTaskPoller(client, resp.taskId)
          })
          .then(async (poller: rsconnect.ClientTaskPoller) => {
            for await (const result of poller.poll()) {
              expect(result).not.toBeNull()
              expect(result.output).not.toBeNull()
              expect(result.output.length).toBeGreaterThan(-1)
              // console.log(result.output)
            }
          })
          .catch((err: any) => {
            console.trace(err)
            expect(err).toBeNull()
          })
      })

      it('deployManifest with name', async () => {
        const top = execSync('git rev-parse --show-toplevel').toString().trim()
        const plumberManifest = path.join(top, '__tests__/apps/plumber/manifest.json')
        const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
        const deployer = new rsconnect.Deployer(client)
        return await deployer.deployManifest({ manifestPath: plumberManifest, force: true, accessType: 'logged_in', appIdentifier: 'can-unique-be-modified' })
          .then((resp: rsconnect.DeployTaskResponse) => {
            expect(resp.taskId).not.toBeNull()
            return new rsconnect.ClientTaskPoller(client, resp.taskId)
          })
          .then(async (poller: rsconnect.ClientTaskPoller) => {
            for await (const result of poller.poll()) {
              expect(result).not.toBeNull()
              expect(result.output).not.toBeNull()
              expect(result.output.length).toBeGreaterThan(-1)
              // console.log(result.output)
            }
          })
          .catch((err: any) => {
            console.trace(err)
          })
      })
    })
  })

  describe('EnvironmentUpdater', () => {
    it('updateAppEnvironment', async () => {
      // Deploy an app to get a valid appGUID
      const top = execSync('git rev-parse --show-toplevel').toString().trim()
      const plumberManifest = path.join(top, '__tests__/apps/plumber/manifest.json')
      const client = new rsconnect.APIClient(SEED_ADMIN_CONFIG)
      const deployer = new rsconnect.Deployer(client)

      const deployResp = await deployer.deployManifest({
        manifestPath: plumberManifest,
        appIdentifier: '/env-updater-test'
      })
      expect(deployResp.appGuid).not.toBeNull()

      // Wait for deployment to complete
      const poller = new rsconnect.ClientTaskPoller(client, deployResp.taskId)
      for await (const result of poller.poll()) {
        expect(result).not.toBeNull()
      }

      // Set environment variables using EnvironmentUpdater
      process.env.CONNECT_ENV_SET_TEST_VAR = 'test-value'
      const envUpdater = new rsconnect.EnvironmentUpdater(client)
      const envVars = await envUpdater.updateAppEnvironment(deployResp.appGuid)

      // Verify the environment variable was set
      expect(envVars).toContain('TEST_VAR')

      // Clean up
      delete process.env.CONNECT_ENV_SET_TEST_VAR
    })
  })
})
