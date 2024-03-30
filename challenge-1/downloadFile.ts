import * as https from 'https';
import * as fs from 'fs';

/**
 * Downloads a file from the given URL and saves it to the specified destination path.
 * @param url The URL of the file to download.
 * @param filePath The path where the downloaded file will be saved.
 * @returns A Promise that resolves when the download is complete.
 */
export default async function downloadFile(url: string, filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);

        // Get file size from response headers to calculate progress
        https.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file. Status: ${response.statusCode}`));
                return;
            }

            //code to show the progress of the download
            const totalSize = parseInt(response.headers['content-length'] || '0', 10);
            let downloaded = 0;
            response.on('data', chunk => {
                downloaded += chunk.length;
                const progress = (downloaded / totalSize) * 100;
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`Downloading... ${progress.toFixed(2)}%`);
            });

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(`File downloaded successfully to: ${filePath}`);
            });

            response.on('error', error => {
                fs.unlinkSync(filePath);
                reject(error);
            });

        }).on('error', error => {
            fs.unlinkSync(filePath);
            reject(error);
        });
    });
}
