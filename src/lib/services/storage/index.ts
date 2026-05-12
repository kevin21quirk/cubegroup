import { StorageProvider } from '@/types'
import { VercelBlobProvider } from './vercel-blob-provider'
import { S3Provider } from './s3-provider'

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel'
  
  switch (provider) {
    case 's3':
      return new S3Provider()
    case 'vercel':
    default:
      return new VercelBlobProvider()
  }
}

export { BaseStorageProvider } from './storage-provider'
export { VercelBlobProvider } from './vercel-blob-provider'
export { S3Provider } from './s3-provider'
