/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';

export const deleteFiles = async (
  filePaths?: string | string[],
  folder?: string,
) => {
  if (!filePaths || (Array.isArray(filePaths) && filePaths.length === 0))
    return;
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

  for (const filePath of paths) {
    if (!filePath) continue;

    const fullPath = folder
      ? path.resolve(folder, filePath)
      : path.resolve(filePath);

    try {
      await fs.unlink(fullPath);
      console.log(`🗑️ Deleted file: ${fullPath}`);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'ENOENT') {
        console.warn(`⚠️ File not found: ${fullPath}`);
      } else {
        console.error(
          `❌ Failed to delete file: ${fullPath}`,
          (err as Error).message,
        );
      }
    }
  }
};
