let params = new URLSearchParams(location.search.slice(1));

function testSuiteContainsFilteredTestCases(testSuite) {
    return testSuite.TestCases.reduce((value, testCase) => {
        return !app.priority || value || testCase.Priority.Id <= app.priority;
    }, false);
}

function testSuitesContainFilteredTestCases(testSuites) {
    return testSuites.reduce((value, testSuite) => {
        return value || testSuite.TestCases.reduce((value, testCase) => {
            return !app.priority || value || testCase.Priority.Id <= app.priority;
        }, false);
    }, false);
}

const app = new Vue({
    el: '#app',
    data: {
        testPlansMap: new Map(),
        testPlansByOwners: [],
        successDate: moment(params.get('date'), 'YYYY-MM-DD'),
        priority: (params.get('priority') && parseInt(params.get('priority'))) || 0
    },
    methods: {
        isExecutionPass: (testCaseExecution) => {
            return testCaseExecution && testCaseExecution.Result === 'Passed' && moment(testCaseExecution.ExecutionTime) > app.successDate;
        },
        filterTestCases: (testCases) => {
            if (app.priority) {
                return testCases.filter((testCase) => {
                    return testCase.Priority.Id <= app.priority;
                });
            } else {
                return testCases;
            }
        },
        testSuiteContainsFilteredTestCases: testSuiteContainsFilteredTestCases,
        testSuitesContainFilteredTestCases: (testSuites) => {
            return testSuites.reduce((value, testSuite) => {
                return value || testSuiteContainsFilteredTestCases(testSuite);
            }, false);
        },

        displayExecutionDate: (testCaseExecution) => {
            return testCaseExecution && moment(testCaseExecution.ExecutionTime).format('YYYY-MM-DD');
        }
    }
});

async function getTestSuitesByOwner() {
    const testSuitesByOwners = await $.get({
        url: '/api/test-suites-by-owner',
        dataType: 'json'
    });

    const ownersMap = new Map();

    for (const testSuitesByOwner of testSuitesByOwners) {
        const testPlanMap = new Map();

        for (const testSuite of testSuitesByOwner[1]) {
            const testPlans = testSuite.TestPlans.map(testPlan => {
                if (!app.testPlansMap.has(testPlan.Id)) {
                    app.testPlansMap.set(testPlan.Id, testPlan);
                }

                return testPlan.Id
            }).join(',');
            testSuite.TestCases.sort((a, b) => {
                return a.Priority.Id - b.Priority.Id;
            });
            if (!testPlanMap.has(testPlans)) {
                testPlanMap.set(testPlans, []);
            }
            testPlanMap.get(testPlans).push(testSuite);
        }

        ownersMap.set(testSuitesByOwner[0], Array.from(testPlanMap));
    }

    app.testPlansByOwners = Array.from(ownersMap);
}

getTestSuitesByOwner();