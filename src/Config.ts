import * as fs from 'fs';

export interface TestSuitesByOwner {
    [key: string]: string;
}

export interface Config {
    test_suites_by_owner: TestSuitesByOwner;
}

class ConfigReader {
    config: Config;
    constructor() {
        try {
            this.config = (
                JSON.parse(fs.readFileSync('config.json').toString())
            ) as Config;
        } catch (error) {
            console.error(`Error reading config.json: ${error}`);
            console.error(error);
            process.exit(0);
        }
    }
}

export const config = new ConfigReader().config;
