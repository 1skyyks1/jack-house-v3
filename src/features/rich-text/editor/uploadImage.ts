import { unwrapData } from "@/shared/api/contracts/unwrap"
import { http } from "@/shared/api/http"

type RichTextImageUploadResponse = {
  url: string
}

export async function uploadRichTextImage(file: File): Promise<RichTextImageUploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await http.post("/upload/rich-text/image", formData)
  return unwrapData<RichTextImageUploadResponse>(response)
}
