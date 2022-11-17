import { isTestBoxTrialRequest, ITestBoxTrial, ITestBoxTrialRequest } from "./payloads";
import axios from 'axios';

export default class TestBoxTrialRequest implements ITestBoxTrialRequest {
    version: 1;
    trial_id: string;
    success_url: string;
    failure_url: string;

    constructor(payload: ITestBoxTrialRequest) {
        // TODO: authentication from TMS
        if (isTestBoxTrialRequest(payload)) {
            this.version = payload.version;
            this.failure_url = payload.failure_url;
            this.success_url = payload.success_url;
            this.trial_id = payload.trial_id;
        }
    }

    async fulfill(trial: ITestBoxTrial) {
        // TODO: authentication to TMS
        const results = await axios.post(this.success_url, trial);
    }

    async reportFailureToFulfill(data: any) {
        // TODO: authentication to TMS
        const results = await axios.post(this.failure_url, data);
    }
}
