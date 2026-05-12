import { StorageProvider } from '@/types'

export abstract class BaseStorageProvider implements StorageProvider {
  abstract upload(file: Buffer, path: string, mimeType: string): Promise<string>
  abstract download(path: string): Promise<Buffer>
  abstract delete(path: string): Promise<void>
  abstract getUrl(path: string): string
}
