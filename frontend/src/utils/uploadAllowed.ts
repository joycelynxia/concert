/** Allowed extensions and MIME types for media uploads */
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".jpg", ".jpeg", ".png"];
const ALLOWED_MIMETYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "image/jpeg",
  "image/png",
];

export function isAllowedUploadFile(file: File): boolean {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  return (
    ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMETYPES.includes(file.type)
  );
}

export const UPLOAD_ACCEPT = ".mp4,.mov,.jpg,.jpeg,.png";
