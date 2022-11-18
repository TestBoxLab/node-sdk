import {
  isTestBoxTrialRequest,
  ITestBoxTrial,
  ITestBoxTrialRequest,
} from "./payloads";
import axios from "axios";
import { TestBoxError } from "./error";
import { verifyAuthenticationToken } from "./auth";

export default class TestBoxTrialRequest implements ITestBoxTrialRequest {
  version: 1;
  trial_id: string;
  success_url: string;
  failure_url: string;

  private hasVerifiedAuth: boolean = false;
  private authToken: string;

  constructor(payload: ITestBoxTrialRequest) {
    // TODO: authentication from TMS
    if (isTestBoxTrialRequest(payload)) {
      this.version = payload.version;
      this.failure_url = payload.failure_url;
      this.success_url = payload.success_url;
      this.trial_id = payload.trial_id;
    } else {
      throw new TestBoxError(
        "An invalid trial payload was provided to the TestBoxTrialRequest class."
      );
    }
  }

  async verifyToken(authToken: string): Promise<boolean> {
    const results = await verifyAuthenticationToken(authToken, this.trial_id);
    if (results) {
      this.hasVerifiedAuth = true;
      this.authToken = authToken;
    }
    return results;
  }

  async fulfill(trial: ITestBoxTrial) {
    if (!this.hasVerifiedAuth) {
      throw new TestBoxError(
        "You did not verify the JWT of the trial request before fulfilling it."
      );
    }
    const results = await axios.post(this.success_url, trial, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  async reportFailureToFulfill(data: any) {
    if (!this.hasVerifiedAuth) {
      throw new TestBoxError(
        "You did not verify the JWT of the trial request before fulfilling it."
      );
    }
    const results = await axios.post(this.failure_url, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }
}
