import { BaseStorageProvider } from './storage-provider'

export class S3Provider extends BaseStorageProvider {
  private bucket: string
  private region: string

  constructor() {
    super()
    this.bucket = process.env.AWS_S3_BUCKET || ''
    this.region = process.env.AWS_REGION || 'eu-west-2'
  }

  async upload(file: Buffer, path: string, mimeType: string): Promise<string> {
    throw new Error('S3Provider not yet implemented. Migrate from Vercel Blob.')
  }

  async download(path: string): Promise<Buffer> {
    throw new Error('S3Provider not yet implemented. Migrate from Vercel Blob.')
  }

  async delete(path: string): Promise<void> {
    throw new Error('S3Provider not yet implemented. Migrate from Vercel Blob.')
  }

  getUrl(path: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`
  }
}
