import { FileDeliveryProvider, FileDeliveryResult, FileDeliveryType } from '@/types/storage'
import { SMBProvider } from './providers/SMBProvider'
import { SFTPProvider } from './providers/SFTPProvider'

export class FileDeliveryService {
  private provider: FileDeliveryProvider

  constructor(type: FileDeliveryType = 'smb') {
    this.provider = this.createProvider(type)
  }

  private createProvider(type: FileDeliveryType): FileDeliveryProvider {
    switch (type) {
      case 'smb':
        return new SMBProvider()
      case 'sftp':
        return new SFTPProvider()
      default:
        return new SMBProvider()
    }
  }

  async upload(localPath: string, remotePath: string): Promise<FileDeliveryResult> {
    return this.provider.upload(localPath, remotePath)
  }

  async move(remoteFrom: string, remoteTo: string): Promise<FileDeliveryResult> {
    return this.provider.move(remoteFrom, remoteTo)
  }

  async exists(remotePath: string): Promise<boolean> {
    return this.provider.exists(remotePath)
  }

  async list(remotePath: string): Promise<string[]> {
    return this.provider.list(remotePath)
  }

  // Helper methods for standard folder structure
  async uploadToProcessed(localPath: string, filename: string): Promise<FileDeliveryResult> {
    const remotePath = `Desktop/AI-Processed/${filename}`
    return this.upload(localPath, remotePath)
  }

  async uploadToExceptions(localPath: string, filename: string): Promise<FileDeliveryResult> {
    const remotePath = `Desktop/AI-Exceptions/${filename}`
    return this.upload(localPath, remotePath)
  }

  async moveToProcessed(filename: string): Promise<FileDeliveryResult> {
    const from = `Desktop/AI-Incoming/${filename}`
    const to = `Desktop/AI-Processed/${filename}`
    return this.move(from, to)
  }
}

// Singleton instance
let fileDeliveryService: FileDeliveryService | null = null

export function getFileDeliveryService(): FileDeliveryService {
  if (!fileDeliveryService) {
    const deliveryType = (process.env.FILE_DELIVERY_TYPE as FileDeliveryType) || 'smb'
    fileDeliveryService = new FileDeliveryService(deliveryType)
  }
  return fileDeliveryService
}
