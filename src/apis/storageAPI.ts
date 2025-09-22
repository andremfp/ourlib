import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

export const uploadThumbnail = async (
  thumbnail: Blob,
  isbn: string,
): Promise<string> => {
  if (!isbn) throw new Error("ISBN is required to upload thumbnail.");

  const fileName = `thumbnails/${isbn}`;
  const storageRef = ref(storage, fileName);

  try {
    // Check if the file already exists by trying to get its download URL.
    // This will throw an error if it doesn't exist, which we catch.
    const existingUrl = await getDownloadURL(storageRef);
    console.log("Thumbnail already exists, reusing:", existingUrl);
    return existingUrl;
  } catch (error: unknown) {
    // If it's a 'storage/object-not-found' error, we proceed with the upload.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "storage/object-not-found"
    ) {
      console.log("Uploading new thumbnail for ISBN:", isbn);
      const snapshot = await uploadBytes(storageRef, thumbnail);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    }
    // If it's another error, we rethrow it.
    throw error;
  }
};
