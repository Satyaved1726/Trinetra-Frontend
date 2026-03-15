import { getSupabaseClient } from '@/services/supabaseClient';

const EVIDENCE_BUCKET = import.meta.env.VITE_SUPABASE_EVIDENCE_BUCKET || 'complaint-evidence';

function buildFileKey(file: File) {
  const timestamp = Date.now();
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const sanitizedName = file.name.replace(/\s+/g, '-');
  return `${timestamp}-${randomPart}-${sanitizedName}`;
}

export interface UploadedEvidenceFile {
  url: string;
  type: string;
}

export async function uploadEvidence(files: File[]) {
  const supabase = getSupabaseClient();
  const uploadedFiles: UploadedEvidenceFile[] = [];

  for (const file of files) {
    const fileName = buildFileKey(file);

    const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(fileName, file);

    if (error) {
      throw new Error(error.message || `Failed to upload ${file.name}`);
    }

    const { data: publicUrlData } = supabase.storage.from(EVIDENCE_BUCKET).getPublicUrl(fileName);

    uploadedFiles.push({
      url: publicUrlData.publicUrl,
      type: file.type
    });
  }

  return uploadedFiles;
}
