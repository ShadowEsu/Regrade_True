import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes } from 'firebase/storage';
import { auth } from '../lib/firebase';

export type StoredPage = { mimeType: string; data: string };

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic') return 'heic';
  if (mimeType === 'image/heif') return 'heif';
  return 'jpg';
}

export const documentStorageService = {
  async uploadCasePages(caseId: string, pages: StoredPage[]): Promise<string[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Sign in before saving a graded paper.');
    const storage = getStorage();
    return Promise.all(pages.map(async (page, index) => {
      const path = `users/${uid}/documents/cases/${caseId}/page-${String(index + 1).padStart(3, '0')}.${extensionFor(page.mimeType)}`;
      const objectRef = ref(storage, path);
      await uploadBytes(objectRef, decodeBase64(page.data), {
        contentType: page.mimeType,
        cacheControl: 'private,max-age=3600',
        customMetadata: { caseId, page: String(index + 1) },
      });
      return getDownloadURL(objectRef);
    }));
  },
  async deleteCasePages(caseId: string): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Sign in before deleting a graded paper.');
    const folder = ref(getStorage(), `users/${uid}/documents/cases/${caseId}`);
    const contents = await listAll(folder);
    await Promise.all(contents.items.map((item) => deleteObject(item)));
  },
};
