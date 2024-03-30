import * as fs from 'fs';
/**
 * 
 * @param dirPath 
 * helper function to make the out and tmp directories if they do not exist
 */
export default function makeDirsIfNotExist(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}