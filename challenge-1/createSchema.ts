import * as fs from 'fs';
import { parse } from 'fast-csv';
import knex from 'knex';
import * as path from 'path';
import { Knex } from 'knex/types/index';

//typescript interface to define the name and type of the colums to be included in the table
interface ColumnDefinition {
    name: string;
    type: string;
}
/**
 * this is the main function that is responsible to call the createTable function to create the tables.
 * it takes care of setting up sqlite database using Knex and connecting to it.
 * @param filepath 
 * @param csvFilePath 
 */
export async function createSchema(filepath: string, csvFilePath:string) {
    const db = knex({
        client: 'sqlite3',
        connection: {
            filename: filepath,
        },
        useNullAsDefault: true,
        pool: { //this is to allow more than one connection at a time to restrict errors.
            min: 2,
            max: 10
        }
    });
    const org_file = path.join(csvFilePath, 'organizations.csv');
    const cust_file = path.join(csvFilePath, 'customers.csv');
    try {
        await createTableFromCSV(db, org_file);
        await createTableFromCSV(db, cust_file);

        console.log('Schema created successfully.');
        await db.destroy(); //destorying the current db connection once the tables are created.
    } catch (error) {
        console.error('Error creating schema:', error);
    }
}

/**
 * this function creates the organizations and customers tables seperately based on the filename passed to it.
 * it gets the csvHeaders and the ColumnDefinations from the helper functions defined below this function.
 * @param db  :Knex 
 * @param filename : string
 */
async function createTableFromCSV(db: Knex, filename: string) {
    let table_name = '';
    if(filename.includes('organizations')){
        table_name = "Organizations"
    }
    else{
        table_name = "Customers";
    }

    const headers = await getCSVHeaders(filename);
    const columnDefinitions = generateColumnDefinitions(headers);

    await db.schema.createTable(table_name, (table) => {
        table.increments('id').primary(); //auto incrementor id column
        columnDefinitions.forEach((column: ColumnDefinition) => {
            //make sure that none of the field is nullable
            if (column.type === 'integer') {
                table.integer(column.name).notNullable();
            } else if (column.type === 'date') {
                table.date(column.name).notNullable();
            } else {
                table.string(column.name).notNullable();
            }
        });
    });
}
/**
 * this function helps us to get the headers from the csv file to actually use them as the database col headers.
 * @param filename 
 * @returns  Promise<string[]>
 */
async function getCSVHeaders(filename: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const headers: string[] = [];
        fs.createReadStream(filename)
            .pipe(parse({ headers: true }))
            .on('error', error => reject(error))
            .once('headers', (h: string[]) => {
                //using filter function to filter out headers except for the index header
                // as we are already using the id col as auto incrementor
                const filteredHeaders = h.filter(header => header.toLowerCase() !== 'index');
                resolve(filteredHeaders);
            });
    });
}

/**
 * this function helps us to dynamically get the names for the columns
 * and it also takes care of assigning the relevant data types for the columns:
 * no.of employees and the subscription date
 * @param headers 
 * @returns ColumnDefination[]
 */
function generateColumnDefinitions(headers: string[]): ColumnDefinition[] {
    const columnDefinitions: ColumnDefinition[] = [];
    headers.forEach(header => {
        if (header.toLowerCase().includes('date')) {
            columnDefinitions.push({ name: header, type: 'date' });
        } else if (header.toLowerCase().includes('number of employees')) {
            columnDefinitions.push({ name: header, type: 'integer' });
        } else {
            columnDefinitions.push({ name: header, type: 'string' });
        }
    });
    return columnDefinitions;
}