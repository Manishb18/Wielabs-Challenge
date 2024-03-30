import * as path from 'path';
import * as resources from './resources';
import { dirname } from 'path';
import {createSchema} from './createSchema';
import downloadFile from './downloadFile';
import extractTarGz from './extractFolder';
import insertData from './insertData';
import makeDirsIfNotExist from './makeDirs';

/**
 * helper function to get the current path of the script file
 * @returns current path
 */
function getCurrentScriptFilePath(): string {
  const fileName = process.argv[1];
  return path.resolve(fileName);
}

const __filename = getCurrentScriptFilePath();
const __dirname = dirname(__filename);

const TMP_FOLDER = path.join(__dirname, 'tmp'); //path to tmp folder which stores the zip file
const OUT_FOLDER = path.join(__dirname, 'out'); //path to out folder which stores the final database file
const DATABASE_FILE = resources.SQLITE_DB_PATH; //path to the actual db file

/**
 * Main function to process the data dump.
 */
export async function processDataDump(): Promise<void> {
  //Creating the out and tmp fodlers if they do not exist
  makeDirsIfNotExist(TMP_FOLDER);
  makeDirsIfNotExist(OUT_FOLDER);
  
  //constants to specify file paths and urls necessary for furthur operations
  const url = resources.DUMP_DOWNLOAD_URL;
  const filePath = path.join(TMP_FOLDER, 'dump.tar.gz');
  const extractedDir = path.join(TMP_FOLDER, 'extracted');
  const csvFilePath =  path.join(extractedDir, 'dump')

  try {
    console.log("Downloading the file....");
    await downloadFile(url, filePath); //using the downlaodFile function to download the tar.gz file form the providede url
    console.log('**File downloaded successfully**');

    console.log('Extracting file...');
    await extractTarGz(filePath, extractedDir); //using the extractTarGz function to extract the folder from tar.gz file
    console.log('***Extraction complete***');

    console.log('Setting up database...');
    console.log("Creating schemas...")
    await createSchema(DATABASE_FILE, csvFilePath); //creating the schema using createSchema function
    console.log('***Database setup complete and schemas are created***');
    
    console.log("****Inserting Data into the database*****")
    await insertData(DATABASE_FILE, csvFilePath); //finally inserting the 
    console.log("*******Done inserting********");
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log("Check the final output at out/database.sqlite");
  }
}