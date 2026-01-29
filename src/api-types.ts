export interface Content {
  guid: string
  id: string
  name: string
  title?: string
  contentUrl?: string
  dashboardUrl?: string
  bundleId?: string
  vanityUrl?: string
  accessType?: string
}

export interface ClientTaskV1Params {
  first?: number
  wait?: number
}

export interface DeployV1Response {
  taskId: string
}

export interface ClientTaskV1Response {
  id: string
  output: string[]
  result?: ClientTaskResult
  finished: boolean
  code: number
  error: string
  last: number
}

export interface ClientTaskResult {
  type: string
  data: any
}

export interface ExtendedBundleMetadata {
  archive_sha1: string | null
}

export interface ExtendedBundleResponse {
  id: string
  contentGuid: string
  createdTime: Date
  updatedTime: Date
  rVersion?: string
  pyVersion?: string
  buildStatus: number
  size?: number
  active: boolean
  metadata?: ExtendedBundleMetadata
}

export interface ListContentParams {
  name?: string
}

export interface ListContentResponse {
  content: Content[]
  totalCount: number
}

export interface VanityRecordResponse {
  contentGuid: string
  path: string
  createdTime: Date
}
