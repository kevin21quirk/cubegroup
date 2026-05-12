import { put, del, head } from '@vercel/blob'
import { BaseStorageProvider } from './storage-provider'

export class VercelBlobProvider extends BaseStorageProvider {
  async upload(file: Buffer, path: string, mimeType: string): Promise<string> {
    const blob = await put(path, file, {
      access: 'public',
      contentType: mimeType,
    })
    
    return blob.url
  }

  async download(path: string): Promise<Buffer> {
    const metadata = await head(path)
    const response = await fetch(metadata.url)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  async delete(path: string): Promise<void> {
    await del(path)
  }

  getUrl(path: string): string {
    return path
  }
}
