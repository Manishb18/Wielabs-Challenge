import * as fs from "fs";
import * as path from 'path';
import { dirname } from 'path';
import * as resources from './resources';
import parseCompanies from "./parseCompanies";
import startCrawling from "./crawlerPage";

//assigning the csv input path defined in the resources.ts file
const csvFilePath: string = resources.CSV_INPUT_PATH;

//helper function to get the current path of the file
function getCurrentScriptFilePath(): string {
  const fileName = process.argv[1];
  return path.resolve(fileName);
}

const __filename = getCurrentScriptFilePath();
const __dirname = dirname(__filename);
const OUT_FOLDER = path.join(__dirname, 'out');
/**
 * The entry point function. This will read the provided CSV file, scrape the companies'
 * YC pages, and output structured data in a JSON file.
 */
export async function processCompanyList() {
  const companies = await parseCompanies(csvFilePath);
  const companyDetailsArray = await startCrawling(companies);
  const jsonData = JSON.stringify(companyDetailsArray, null, 2);
  makeDirIfNotExist(OUT_FOLDER)
  await fs.promises.writeFile(resources.JSON_OUTPUT_PATH,  jsonData);
  console.log("Successfully saved the data to out/scraped.json!!!");
}

//helper function to make the out directory if it does not exist before actually saving the json file
//this is to ensure that no error occurs while saving the file
function makeDirIfNotExist(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Directory created: ${dirPath}`);
  }
}