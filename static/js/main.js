let params = new URLSearchParams(location.search.slice(1));


const app = new Vue({
    el: '#app',
    data: {
        testSuitesByOwners: [],
        successDate: moment(params.get('date'), 'YYYY-MM-DD'),
        priority: params.get('priority') && parseInt(params.get('priority'))
    },
    methods: {
        isExecutionPass: (testCaseExecution) => {
            return testCaseExecution.Result === 'Passed' && moment(testCaseExecution.ExecutionTime) > app.successDate;
        },
        filterTestCasesByPriority: (testCases) => {
            if (app.priority) {
                return testCases.filter((testCase) => {
                    return testCase.Priority.Id <= app.priority;
                });
            } else {
                return testCases;
            }
        },
        displayExecutionDate: (testCaseExecution) => {
            return moment(testCaseExecution.ExecutionTime).format('YYYY-MM-DD');
        }
    }
});

async function getTestSuitesByOwner() {
    app.testSuitesByOwners = await $.get({
        url: '/api/test-suites-by-owner',
        dataType: 'json'
    });

    for (const testSuitesByOwner of app.testSuitesByOwners) {
        for (const testSuite of testSuitesByOwner[1]) {
            testSuite.TestCases.sort((a, b) => {
                return a.Priority.Id - b.Priority.Id;
            });
        }
    }
}

getTestSuitesByOwner();