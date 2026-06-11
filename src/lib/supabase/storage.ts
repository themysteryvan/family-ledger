import { createClient } from "./client";

const BUCKET = "financial-documents";

export async function uploadDocument(
  file: File,
  section: "expenses" | "assets" | "debts"
): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const path = `${user.id}/${section}/${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  // Store the path, not a public URL — access via signed URLs
  return path;
}

export async function openDocument(pathOrUrl: string): Promise<void> {
  const supabase = createClient();

  // Handle legacy records that stored the full public URL
  const path = pathOrUrl.startsWith("http")
    ? new URL(pathOrUrl).pathname.replace(/^.*\/financial-documents\//, "")
    : pathOrUrl;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data) throw error ?? new Error("Failed to create signed URL");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
