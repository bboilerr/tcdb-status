import * as serve from 'koa-static';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyParser from 'koa-bodyparser';
import * as TCDB from './TCDB';
import * as Config from './Config';

function respond(ctx: Koa.Context, status: number, body?: any): void {
    ctx.status = status;
    if (body) {
        ctx.body = body;
    }
}

function respondError(ctx: Koa.Context, status: number, error: string): void {
    ctx.status = status;
    ctx.body = { error };
}

class Main {
    private app = new Koa();
    private router = new Router();
    private tcdb: TCDB.TCDB;
    private config: Config.Config;

    constructor() {
        this.config = Config.config;
        this.tcdb = new TCDB.TCDB();

        this.router.get('/api/test-suite/:testSuite', async (ctx: Koa.Context, next: Function) => {
            const testSuite = await this.tcdb.getTestSuite(ctx.params.testSuite);

            respond(ctx, 200, testSuite);

            return next();
        });

        this.router.get('/api/test-suites-by-owner', async (ctx: Koa.Context, next: Function) => {
            const testSuitesByOwner = new Map<string, Array<TCDB.TestSuite>>();
            for (const owner in this.config.test_suites_by_owner) {
                if (this.config.test_suites_by_owner.hasOwnProperty(owner)) {
                    const testSuites: Array<TCDB.TestSuite> = [];

                    for (const testSuite of this.config.test_suites_by_owner[owner]) {
                        testSuites.push(await this.tcdb.getTestSuite(testSuite));
                    }
                    testSuitesByOwner.set(owner, testSuites);
                }
            }

            respond(ctx, 200, [...testSuitesByOwner]);

            return next();
        });
    }

    run(): void {
        this.app.use(bodyParser());
        this.app.use(async (ctx, next) => {
            try {
                console.log(`Request: ${ctx.request.method} - ${ctx.request.url}: ${JSON.stringify(ctx.request.body)}`);

                await next();
            } catch (err) {
                ctx.status = err.status || 500;
                ctx.body = err.message;
                ctx.app.emit('error', err, ctx);
            }
        });
        this.app.use(serve('static'));
        this.app.use(this.router.routes());
        this.app.use(this.router.allowedMethods());
        this.app.use(async (ctx, next) => {
            console.log(`Response: ${ctx.request.method} - ${ctx.request.url})}: ${ctx.status} - ${JSON.stringify(ctx.body)}`);

            return next();
        });
        this.app.on('error', (error, ctx) => {
            console.error(`Koa Error: ${error}`);
            console.error(error);
            respondError(ctx, 500, 'Internal Server Error');
        });

        this.app.listen(4321, () => {
            console.log('Listening on port 4321');
        });
    }
}

const main = new Main();
main.run();
