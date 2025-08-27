// Interfaces for Upload API

export interface UploadResponse {
  documentId: string;
  path: string;
}

export async function uploadFile(
  file: File,
  tenantId: string,
  typeHint?: string,
  documentId?: string
): Promise<UploadResponse> {
  const BASE_URL = "http://localhost:8002"; // Assuming the same base URL as other APIs

  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenantId", tenantId);
  if (typeHint) {
    formData.append("typeHint", typeHint);
  }
  if (documentId) {
    formData.append("documentId", documentId);
  }

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upload failed:", errorText);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  const data: UploadResponse = await response.json();
  console.log("Upload successful:", data);
  return data;
}
