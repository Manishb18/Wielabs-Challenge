import * as fs from 'fs';
import * as zlib from 'zlib';
import * as tar from 'tar';
/**
 * Extracts the contents of a .tar.gz file to the specified destination directory.
 * @param sourceFilePath The path to the .tar.gz file to extract.
 * @param destinationDir The directory where the contents will be extracted.
 * @returns A Promise that resolves when the extraction is complete.
 */
export default async function extractTarGz(sourceFilePath: string, destinationDir: string): Promise<void> {
    // Ensure the destination directory exists, create it if it doesn't
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    return new Promise<void>((resolve, reject) => {
      fs.createReadStream(sourceFilePath)
        .pipe(zlib.createGunzip()) // Decompress the .tar.gz file
        .on('error', error => reject(`Error decompressing file: ${error.message}`))
        .pipe(tar.extract({ cwd: destinationDir })) // Extract the contents to the destination directory
        .on('error', error => reject(`Error extracting file: ${error.message}`))
        .on('end', () => resolve()); // Resolve the promise when extraction is complete
    });
  }