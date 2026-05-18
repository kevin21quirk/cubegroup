import { StorageProvider, StorageUploadResult, StorageType } from '@/types/storage'
import { LocalStorageProvider } from './providers/LocalStorageProvider'

export class StorageService {
  private provider: StorageProvider

  constructor(type: StorageType = 'local') {
    this.provider = this.createProvider(type)
  }

  private createProvider(type: StorageType): StorageProvider {
    switch (type) {
      case 'local':
        return new LocalStorageProvider()
      case 'vercel-blob':
        // Future: return new VercelBlobProvider()
        throw new Error('Vercel Blob storage not yet implemented')
      case 's3':
        // Future: return new S3StorageProvider()
        throw new Error('S3 storage not yet implemented')
      default:
        return new LocalStorageProvider()
    }
  }

  async upload(localPath: string, remotePath: string): Promise<StorageUploadResult> {
    return this.provider.upload(localPath, remotePath)
  }

  async download(remotePath: string, localPath: string): Promise<void> {
    return this.provider.download(remotePath, localPath)
  }

  async exists(remotePath: string): Promise<boolean> {
    return this.provider.exists(remotePath)
  }

  async delete(remotePath: string): Promise<void> {
    return this.provider.delete(remotePath)
  }

  async getUrl(remotePath: string): Promise<string> {
    return this.provider.getUrl(remotePath)
  }
}

// Singleton instance
let storageService: StorageService | null = null

export function getStorageService(): StorageService {
  if (!storageService) {
    const storageType = (process.env.STORAGE_TYPE as StorageType) || 'local'
    storageService = new StorageService(storageType)
  }
  return storageService
}
