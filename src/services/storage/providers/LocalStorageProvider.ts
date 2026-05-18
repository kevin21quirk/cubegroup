import { StorageProvider, StorageUploadResult } from '@/types/storage'
import fs from 'fs/promises'
import path from 'path'

export class LocalStorageProvider implements StorageProvider {
  private basePath: string

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'storage')
  }

  async upload(localPath: string, remotePath: string): Promise<StorageUploadResult> {
    try {
      const fullPath = path.join(this.basePath, remotePath)
      const dir = path.dirname(fullPath)
      
      await fs.mkdir(dir, { recursive: true })
      await fs.copyFile(localPath, fullPath)

      return {
        success: true,
        path: remotePath,
        url: `/storage/${remotePath}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async download(remotePath: string, localPath: string): Promise<void> {
    const fullPath = path.join(this.basePath, remotePath)
    const dir = path.dirname(localPath)
    
    await fs.mkdir(dir, { recursive: true })
    await fs.copyFile(fullPath, localPath)
  }

  async exists(remotePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, remotePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  async delete(remotePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, remotePath)
    await fs.unlink(fullPath)
  }

  async getUrl(remotePath: string): Promise<string> {
    return `/storage/${remotePath}`
  }
}
