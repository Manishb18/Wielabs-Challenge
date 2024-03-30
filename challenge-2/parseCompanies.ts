import * as fs from "fs";
import * as csv from "fast-csv";
import { Company } from "./interfaces";

const companies: Company[] = [];

/**
 * this function parses the csv file and stores the urls of the companies along with 
 * their names in the companies array and then returns it to the main function for scraping.
 * it used fast-csv to parse the file
 * @param filePath 
 * @returns companies
 */
export default async function parseCompanies(filePath : string) : Promise<Company[]>{
    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv.parse({ headers: true }))
          .on("error", (error) => reject(error))
          .on("data", (row) => {
            companies.push({
              companyName: row["Company Name"],
              ycUrl: row["YC URL"],
            });
          })
          .on("end", () => resolve());
      });
      return companies;
}