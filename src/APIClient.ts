import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { wrapper as AxiosCookieJarSupport } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import fs from 'fs'
import qs from 'qs'

import { debugLog, debugEnabled } from './debugLog'
import {
  Application,
  ClientTaskV1Params,
  ClientTaskV1Response,
  DeployV1Response,
  ExtendedBundleResponse,
  ListApplicationsParams,
  ListApplicationsResponse,
  VanityRecordResponse
} from './api-types'
import { Bundle } from './Bundle'
import { Environment } from './Environment'
import { keysToCamel } from './conversions'
import { Version } from './Version'

export interface APIClientConfiguration {
  baseURL: string
  apiKey: string
}

export class APIClient {
  public cfg: APIClientConfiguration
  private readonly client: AxiosInstance

  constructor (cfg: APIClientConfiguration) {
    this.cfg = cfg

    const versionString: string = Version.toString()

    const clientCfg = {
      baseURL: this.cfg.baseURL,
      headers: {
        common: {
          Authorization: `Key ${this.cfg.apiKey}`,
          'User-Agent': `rsconnect-ts/${versionString} (axios)`
        }
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      paramsSerializer: (params: any): string => {
        return qs.stringify(
          params,
          {
            arrayFormat: 'repeat',
            encode: false
          }
        )
      },
      jar: new CookieJar()
    }

    debugLog(() => [
      'APIClient: building axios client with',
      `config=${JSON.stringify(clientCfg)}`
    ].join(' '))

    this.client = AxiosCookieJarSupport(axios.create(clientCfg))

    if (debugEnabled) {
      this.client.interceptors.request.use((r) => {
        debugLog(() => [
          'APIClient: request',
          r.method?.toUpperCase(),
          JSON.stringify(r.url),
          `params=${JSON.stringify(r.params)}`,
          `headers=${JSON.stringify(r.headers)}`
        ].join(' '))
        return r
      })

      this.client.interceptors.response.use((r) => {
        debugLog(() => [
          'APIClient: response',
          `status=${r.status}`,
          `headers=${JSON.stringify(r.headers)}`
        ].join(' '))
        return r
      })
    }
  }

  public get clientPathname (): string {
    return new URL(this.cfg.baseURL).pathname.replace('/__api__', '')
  }

  public async createApp (appName: string): Promise<Application> {
    return await this.client.post('v1/content', { name: appName })
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async getApp (guid: string): Promise<Application> {
    return await this.client.get(`v1/content/${guid}`)
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async updateApp (guid: string, updates: any): Promise<Application> {
    return await this.client.patch(`v1/content/${guid}`, updates)
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async setContentVanityURL (contentGUID: string, vanityURL: string): Promise<VanityRecordResponse> {
    return await this.client.put(
            `v1/content/${contentGUID}/vanity`,
            { path: vanityURL }
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async uploadApp (guid: string, bundle: Bundle): Promise<ExtendedBundleResponse> {
    return await this.client.post(
            `v1/content/${guid}/bundles`,
            fs.createReadStream(bundle.tarballPath)
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async deployApp (guid: string, bundleID: number): Promise<DeployV1Response> {
    return await this.client.post(
            `v1/content/${guid}/deploy`,
            { bundle_id: bundleID }
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async listApplications (params?: ListApplicationsParams): Promise<ListApplicationsResponse> {
    const queryParams: Record<string, any> = {}
    if (params?.name !== undefined) {
      queryParams.name = params.name
    }
    return await this.client.get('v1/content', { params: queryParams })
      .then((resp: AxiosResponse) => {
        const applications = (resp.data as any[]).map(keysToCamel)
        return {
          applications,
          totalCount: applications.length
        }
      })
  }

  public async getAppEnvironment (appGUID: string): Promise<string[]> {
    return await this.client.get(`v1/content/${appGUID}/environment`)
      .then((resp: AxiosResponse) => resp.data)
  }

  public async updateAppEnvironment (appGUID: string, env: Environment): Promise<AxiosResponse> {
    return await this.client.patch(
      `v1/content/${appGUID}/environment`,
      Array.from(env.keys()).map(key => {
        return { name: key, value: env.get(key) }
      })
    )
  }

  public async getTask (taskId: string, first?: number, wait?: number): Promise<ClientTaskV1Response> {
    const params: ClientTaskV1Params = {
      first: (first !== null && first !== undefined) ? first : undefined,
      wait: (wait !== null && wait !== undefined) ? wait : undefined
    }
    return await this.client.get(`v1/tasks/${taskId}`, { params })
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async getBundle (contentGuid: string, bundleId: number): Promise<ExtendedBundleResponse> {
    return await this.client.get(`v1/content/${contentGuid}/bundles/${bundleId}`)
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async serverSettings (sub?: string | undefined): Promise<AxiosResponse> {
    let path = 'server_settings'
    if (sub !== undefined) {
      if (['python', 'r'].includes(sub)) {
        path = `v1/server_settings/${sub}`
      } else {
        path = `server_settings/${sub}`
      }
    }
    return await this.client.get(path)
  }
}
