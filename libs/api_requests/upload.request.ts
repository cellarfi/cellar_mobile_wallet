import { apiResponse, httpRequest } from '../api.helpers'

type UploadResponse = {
  url: string
  publicId: string
  assetId: string
  type: 'image' | 'video' | 'gif'
  width: number
  height: number
  bytes: number
  format: string
  duration?: number
  secureUrl: string
}

export const UploadRequests = {
  // Upload a single file
  async uploadSingle(file: { uri: string; type: string; name: string }) {
    try {
      const api = httpRequest()
      const formData = new FormData()

      // Android-compatible file object structure
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name || 'file',
      } as any)

      const response = await api.post<{ data: UploadResponse }>(
        '/upload/single',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      console.log('Upload successful:', response.data)
      return apiResponse(true, 'File uploaded successfully', response.data.data)
    } catch (err: any) {
      console.error('Error uploading file:', err?.message)
      console.error('Error response:', err?.response?.data)
      console.error('Error config:', err?.config?.url)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while uploading file',
        err
      )
    }
  },

  // Upload multiple files
  async uploadMultiple(files: { uri: string; type: string; name: string }[]) {
    try {
      const api = httpRequest()
      const formData = new FormData()

      files.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name || `file-${index}`,
        } as any)
      })

      const response = await api.post<{ data: UploadResponse[] }>(
        '/upload/multiple',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      return apiResponse(
        true,
        'Files uploaded successfully',
        response.data.data
      )
    } catch (err: any) {
      console.error('Error uploading files:', err?.message)
      console.error('Error response:', err?.response?.data)
      console.error('Error config:', err?.config?.url)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while uploading files',
        err
      )
    }
  },

  // Delete a single file
  async deleteFile(publicId: string) {
    try {
      const api = httpRequest()
      await api.delete(`/upload/${publicId}`)
      return apiResponse(true, 'File deleted successfully', null)
    } catch (err: any) {
      console.error('Error deleting file:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while deleting file',
        err
      )
    }
  },

  // Delete multiple files
  async deleteMultipleFiles(publicIds: string[]) {
    try {
      const api = httpRequest()
      await api.delete('/upload', { data: { publicIds } })
      return apiResponse(true, 'Files deleted successfully', null)
    } catch (err: any) {
      console.error('Error deleting files:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while deleting files',
        err
      )
    }
  },
}
