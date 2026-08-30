import { adminUpload, http } from "@/lib/http";
import type { ApiEnvelope } from "@/types/api";

/** المجلّدات التي يقبلها الباك اند في `/api/uploads/:folder/...`. */
export type UploadFolder = "stamps" | "partners" | "users" | "misc";

interface UploadedOne {
  url: string;
}

interface UploadedMany {
  urls: string[];
}

/**
 * رفع الصور.
 *
 * المشرف يرفع صور الطوابع والشركاء بجلسة المشرف، والمستخدم يرفع صورته
 * الشخصية بجلسته — لذلك يوجد إصداران لكل عملية.
 */
export const uploadsApi = {
  /** بجلسة المشرف — POST /api/uploads/:folder/image */
  adminImage: (folder: UploadFolder, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return adminUpload<UploadedOne>(`/uploads/${folder}/image`, form);
  },

  /** بجلسة المشرف — POST /api/uploads/:folder/images */
  adminImages: (folder: UploadFolder, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    return adminUpload<UploadedMany>(`/uploads/${folder}/images`, form);
  },

  /** بجلسة المستخدم — الصورة الشخصية */
  userImage: async (file: File) => {
    const form = new FormData();
    form.append("image", file);
    const { data } = await http.post<ApiEnvelope<UploadedOne>>(
      "/uploads/users/image",
      form,
      { headers: { "Content-Type": undefined } },
    );
    return data.data as UploadedOne;
  },
};
