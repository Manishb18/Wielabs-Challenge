import * as fs from 'fs';
import * as path from 'path';
import * as fastcsv from 'fast-csv';
import Knex from 'knex';

/**
 * 
 * @param dbFilePath 
 * @param csvDirPath 
 * main function to insert the data,
 *  it has an inner function which handles the batch wise insertion
 */
export default async function insertData(dbFilePath  :string, csvDirPath:string){
    /**
     * Set up the SQLite database schema.
     * @param db The Knex instance for database operations.
    */
    const db = Knex({
        client: 'sqlite3',
        connection: {
        filename: dbFilePath,
        },
        useNullAsDefault: true,
        pool:{
        min:2,
        max:10
        }
    });

    /**
     * 
     * @param tableName 
     * @param rows 
     * 
     * this inner function takes care of inserting the records into the table batch wise, 
     * as the no.of records are very large.
     * @batch_size_used : 500 (getting error if I use 600 and above, so I stuck with 500).
     */
    async function insertBatch(tableName: string, rows: any[]) {
        try {
          const batchSize = 500; //defining the batch size to be 500
      
          // Split the rows into batches using the reduce array method 
          const batches: any[][] = rows.reduce((acc, row) => {
            const lastBatch = acc[acc.length - 1];
            if (lastBatch.length < batchSize) {
              lastBatch.push(row);
            } else {
              acc.push([row]);
            }
            return acc;
          }, [[]]);
      
          // Insert each batch into the table one by one and print the status
          for (const batch of batches) {
            await db.batchInsert(tableName, batch);
            console.log(`Inserted ${batchSize} rows into ${tableName}`);
          }
          console.log(`${rows.length} rows inserted into ${tableName} table successfully.`);
        } catch (error) {
          console.error('Error inserting batch:', error);
        }
    }
    //used let here to delete the content later by assigning  : [] 
    let customerRows: Record<string, any>[] = [];
    let organizationsRows: Record<string, any>[] = [];

    //assigning seperate paths for both csv files...
    const customerDataPath = path.join(csvDirPath, 'customers.csv');
    const organizationsPath = path.join(csvDirPath, 'organizations.csv');
    
    // Reading customer CSV file
    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(customerDataPath)
            .pipe(fastcsv.parse({ headers: true }))
            .on('data', async (row: Record<string, any>) => {
                //filtering the row to exclude the index col header as we are already using id as auto incrementor
                const filteredRow = Object.fromEntries(
                    Object.entries(row).filter(([key, _]) => key !== 'Index')
                );
                customerRows.push(filteredRow);
            })
            .on('end', async () => {
                console.log("Starting to insert the rows into 'customers' table");
                await insertBatch('customers', customerRows);
                /**
                 * deleting the content of the customerRows array as it is not necessary here after
                 * this will be helpful to resolve the memory issues that occure if we do not do this.
                 * since the data we are dealing with is very large it's always recommended to delete unncessary 
                 * variables so that the garbage collector can take it out from the memory.
                 */
                customerRows = [];
                resolve();
            })
            .on('error', (error: any) => {
                console.error('Error reading customer CSV file:', error);
                reject(error);
            });
    });

    // Reading organizations CSV file
    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(organizationsPath)
            .pipe(fastcsv.parse({ headers: true }))
            .on('data', async (row: Record<string, any>) => {
                //filtering the row to exclude the index col header as we are already using id as auto incrementor
                const filteredRow = Object.fromEntries(
                    Object.entries(row).filter(([key, _]) => key !== 'Index')
                );
                organizationsRows.push(filteredRow);
            })
            .on('end', async () => {
                console.log("Starting to insert the rows into 'organizations' table");
                await insertBatch('organizations', organizationsRows);
                /**
                 * deleting the content of the organizationsRows array as it is not necessary here after
                 */
                organizationsRows = [];
                db.destroy(); //finally disconnecting from the database
                resolve();
            })
            .on('error', (error: any) => {
                console.error('Error reading organizations CSV file:', error);
                db.destroy();
                reject(error);
            });
    });
}