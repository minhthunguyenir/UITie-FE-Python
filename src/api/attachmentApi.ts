import axiosClient from './axiosClient'
interface FileMeta {
  name: string
  mime: string
}
export interface PresignResult {
  presigned_url: string
  file_url: string
  file_type: 'Image' | 'Video' | 'Document'
  file_name: string
}
export const presignAttachments = async (
  files: File[],
  folder: 'posts' | 'messages' = 'posts',
): Promise<PresignResult[]> => {
  const files_meta: FileMeta[] = files.map((f) => ({
    name: f.name,
    mime: f.type,
  }))
  const res = await axiosClient.post<{ status: boolean; data: PresignResult[] }>(
    '/attachment/presign',
    { files_meta, folder },
  )
  return res.data.data
}
export const uploadToMinIO = (presignedUrl: string, file: File): Promise<void> =>
  fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  }).then((res) => {
    if (!res.ok) throw new Error(`MinIO upload failed: ${res.status}`)
  })
