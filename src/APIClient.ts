import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { wrapper as AxiosCookieJarSupport } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import fs from 'fs'
import qs from 'qs'

import { debugLog, debugEnabled } from './debugLog'
import {
  Application,
  AppEnvironmentResponse,
  ClientTaskResponse,
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
    return await this.client.post('applications', { name: appName })
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async getApp (appID: number|string): Promise<Application> {
    return await this.client.get(`applications/${appID}`)
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async updateApp (appID: number|string, updates: any): Promise<Application> {
    return await this.client.post(`applications/${appID}`, updates)
      .then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async setContentVanityURL (contentGUID: string, vanityURL: string): Promise<VanityRecordResponse> {
    return await this.client.put(
            `v1/content/${contentGUID}/vanity`,
            { path: vanityURL }
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async uploadApp (appID: number, bundle: Bundle): Promise<ExtendedBundleResponse> {
    return await this.client.post(
            `applications/${appID}/upload`,
            fs.createReadStream(bundle.tarballPath)
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async deployApp (appID: number, bundleID: number): Promise<ClientTaskResponse> {
    return await this.client.post(
            `applications/${appID}/deploy`,
            { bundle: bundleID }
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async listApplications (params?: ListApplicationsParams): Promise<ListApplicationsResponse> {
    return await this.client.get('applications', { params })
      .then((resp: AxiosResponse) => {
        const data = resp.data
        const { applications, count, total, continuation } = data
        return {
          applications: applications.map(keysToCamel),
          count,
          total,
          continuation
        }
      })
  }

  public async getAppEnvironment (appID: number): Promise<AppEnvironmentResponse> {
    return await this.client.get(`applications/${appID}/environment`)
      .then((resp: AxiosResponse) => {
        const camelized = keysToCamel(resp.data)
        camelized.values = resp.data.values
        return camelized
      })
  }

  public async updateAppEnvironment (appID: number, version: number, env: Environment): Promise<AxiosResponse> {
    return await this.client.post(
      `applications/${appID}/environment`,
      { app_id: appID, version, values: Object.fromEntries(env.entries()) }
    )
  }

  public async getTask (taskId: string, status?: number): Promise<ClientTaskResponse> {
    return await this.client.get(
            `tasks/${taskId}`,
            status !== null && status !== undefined
              ? { params: { first_status: status } }
              : undefined
    ).then((resp: AxiosResponse) => keysToCamel(resp.data))
  }

  public async getBundle (bundleId: number): Promise<ExtendedBundleResponse> {
    return await this.client.get(`bundles/${bundleId.toString()}`)
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
