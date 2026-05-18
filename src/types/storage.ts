// Storage Provider Interface
export interface StorageProvider {
  upload(localPath: string, remotePath: string): Promise<StorageUploadResult>
  download(remotePath: string, localPath: string): Promise<void>
  exists(remotePath: string): Promise<boolean>
  delete(remotePath: string): Promise<void>
  getUrl(remotePath: string): Promise<string>
}

export interface StorageUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

// File Delivery Provider Interface
export interface FileDeliveryProvider {
  upload(localPath: string, remotePath: string): Promise<FileDeliveryResult>
  move(remoteFrom: string, remoteTo: string): Promise<FileDeliveryResult>
  exists(remotePath: string): Promise<boolean>
  list(remotePath: string): Promise<string[]>
}

export interface FileDeliveryResult {
  success: boolean
  path?: string
  error?: string
}

// Storage Configuration
export type StorageType = 'local' | 'vercel-blob' | 's3'
export type FileDeliveryType = 'smb' | 'sftp'

export interface StorageConfig {
  type: StorageType
  basePath?: string
  bucket?: string
  region?: string
}

export interface FileDeliveryConfig {
  type: FileDeliveryType
  host?: string
  port?: number
  username?: string
  password?: string
  shareName?: string
  domain?: string
}
