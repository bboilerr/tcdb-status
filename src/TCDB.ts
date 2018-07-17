import * as request from 'request-promise-native';
import * as Config from './Config';

export interface TestPlan {
    Id: number;
    Version: number;
    Name: string;
}

export interface TestCase {
    Id: number;
    Name: string;
    Priority: {
        Id: number;
        Name: string
    };
    LastExecutionResult: {
        Id: number;
        ExecutionTime: string;
        Result: string;
    };
}

export interface TestSuite {
    Id: number;
    Version: number;
    Name: string;
    Description: string;
    TestPlans: Array<TestPlan>;
    TestCases: Array<TestCase>;
}

export class TCDB {
    private baseUrl = 'http://tcdb.genesys.com/tcdbv2';

    constructor(private token?: string | undefined) {
        console.log(`TCDB token: ${this.token}`);
    }

    private buildUrl(endpoint: string): string {
        return `${this.baseUrl}/${endpoint}`;
    }

    async getTestSuite(testSuite: Config.TestSuite): Promise<TestSuite> {
        const testSuiteResult = await request({
            method: 'GET',
            uri: this.buildUrl(`api/testsuites/${testSuite.suite}`),
            json: true
        }) as TestSuite;

        if (testSuite.tcsIncluded) {
            testSuiteResult.TestCases = testSuiteResult.TestCases.filter(testCase => {
                return (testSuite.tcsIncluded as Array<number>).includes(testCase.Id);
            });
        }

        if (testSuite.tcsExcluded) {
            testSuiteResult.TestCases = testSuiteResult.TestCases.filter(testCase => {
                return !(testSuite.tcsIncluded as Array<number>).includes(testCase.Id);
            });
        }

        return testSuiteResult;
    }
}