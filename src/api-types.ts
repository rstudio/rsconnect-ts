export interface Application {
  id: number
  guid: string
  accessType: string
  connectionTimeout?: number
  readTimeout?: number
  initTimeout?: number
  idleTimeout?: number
  maxProcesses?: number
  minProcesses?: number
  maxConnsPerProcess?: number
  loadFactor?: number
  url: string
  vanityUrl: boolean
  name: string
  title?: string
  bundleId: number
  appMode: number
  contentCategory: string
  hasParameters: boolean
  createdTime: Date
  lastDeployedTime: Date
  rVersion?: string
  pyVersion?: string
  buildStatus: number
  runAs?: string
  runAsCurrentUser: boolean
  description: string
  appRole: string
  ownerFirstName: string
  ownerLastName: string
  ownerUsername: string
  ownerGuid: string
  ownerEmail: string
  ownerLocked: boolean
  isScheduled: boolean
  git?: string
}

export interface ClientTaskResponse {
  id: string
  userId: number
  status: string[]
  result?: ClientTaskResult
  finished: boolean
  code: number
  error: string
  lastStatus: number
}

export interface ClientTaskResult {
  type: string
  data: any
}

export interface DeployTaskResponse {
  taskId: string
  appId: number
  appGuid: string
  appUrl: string
  title: string
}

export interface ExtendedBundleResponse {
  id: number
  appId: number
  createdTime: Date
  updatedTime: Date
  rVersion?: string
  pyVersion?: string
  buildStatus: number
  size?: number
  active: boolean
}

export interface ListApplicationsParams {
  count: number
  start: number
  cont: string
}

export interface ListApplicationsResponse {
  applications: Application[]
  count: number
  total: number
  continuation: string
}

export interface VanityRecordResponse {
  id?: number
  appId: number
  appGuid: string
  pathPrefix: string
  createdTime?: Date
}
