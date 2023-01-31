import {
    isTestBoxTrialRequest,
    ITestBoxTrial,
    ITestBoxTrialRequest,
} from "./payloads";
import axios from "axios";
import {TestBoxError} from "./error";
import {Request, Response} from "express";
import TestBoxAuthenticatedRequest from "./testBoxAuthenticatedRequest";
import {
    FrameworkDefinition,
    getConfigItem,
    TestboxConfigFramework,
} from "./config";

export default class TestBoxTrialRequest
    extends TestBoxAuthenticatedRequest
    implements ITestBoxTrialRequest {
    version: 1;
    trial_id: string;
    success_url: string;
    failure_url: string;

    initialized: boolean = false;

    framework: TestboxConfigFramework;
    frameworkDefinition: FrameworkDefinition;

    fromRequest = (r: Request) => this.frameworkDefinition.fromRequest(r);
    fulfill = (t: ITestBoxTrial, r: Response) => this.frameworkDefinition.fulfill(t, r);

    constructor(payload?: ITestBoxTrialRequest) {
        super(payload);


        this.framework = getConfigItem("framework");
        this.frameworkDefinition = this[this.framework];
        // The constructor only checks that the contract between the SDK and TestBox
        // is being upheld. It does not check for authorization/authentication,
        // as this is done async.
        if (payload) {
            this.initialize(payload)
        }
    }

    initialize(payload: ITestBoxTrialRequest) {
        if (!isTestBoxTrialRequest(payload)) {
            throw new TestBoxError(
                "An invalid trial payload was provided to the TestBoxTrialRequest class."
            );
        }
        this.version = payload.version;
        this.failure_url = payload.failure_url;
        this.success_url = payload.success_url;
        this.trial_id = payload.trial_id;
        this.initialized = true;
    }

    // Convenience method for Express.js users
    // You can respond directly to our webhook request with a 201
    // response instead of initiating an HTTP callback.
    express = {
        fulfill: (trial: ITestBoxTrial, response: Response) => {
            this.throwIfAuthNotValidated();
            response.status(201).json(trial);
        },
        fromRequest: async (req: Request) => {
            this.initialized = true;

            let payload = req.body;
            if (typeof req.body === "string") {
                payload = JSON.parse(req.body);
            }

            if(!payload){
                throw new TestBoxError("No payload provided!")
            }
            this.initialize(payload)
            await this.verifyToken(
                req.headers.authorization.replace("Bearer ", "")
            );
        },
    };

    // Convenience method for Cloudflare Workers users
    // You can respond directly to our webhook request with a 201
    // response instead of initiating an HTTP callback.
    workers = {
        fulfill: (trial: ITestBoxTrial) => {
            this.throwIfAuthNotValidated();
            // @ts-ignore
            return new Response(JSON.stringify(trial), {
                status: 201,
                headers: {
                    "content-type": "application/json",
                },
            });
        },

        fromRequest: async () => {
            throw Error("Not implemented");
        },
    };

    // If creating a trial and ingesting data takes more than a few seconds
    // for your system (or if you'd prefer to fulfill the trials via a worker queue, etc.),
    // you can fulfill the trial asynchronously using this convenience method.
    async fulfillAsync(trial: ITestBoxTrial) {
        this.throwIfAuthNotValidated();
        return await axios.post(this.success_url, trial, {
            headers: {Authorization: `Bearer ${this.authToken}`},
        });
    }

    async reportFailureAsync(data: any) {
        this.throwIfAuthNotValidated();
        return await axios.post(this.failure_url, data, {
            headers: {Authorization: `Bearer ${this.authToken}`},
        });
    }
}
