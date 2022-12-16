import {
  isTestBoxBulkUseCaseRequest,
  ITestBoxTrial,
  ITestBoxBulkUseCaseRequest,
  UseCaseType,
} from "./payloads";
import axios from "axios";
import { TestBoxError } from "./error";
import { verifyAuthenticationToken } from "./auth";
import { Request, Response } from "express";
import { getConfigItem } from "./config";
import TestBoxTrial from "./trial";

type UseCaseUrls = { [key: string]: string }

export default class TestBoxBulkUseCaseRequest implements ITestBoxBulkUseCaseRequest {
  version: 1;
  trial_id: string;
  use_case_types: UseCaseType[];
  trial_data: ITestBoxTrial;
  success_url: string;
  failure_url: string;

  private hasVerifiedAuth: boolean = false;
  private authToken: string;

  constructor(payload: ITestBoxBulkUseCaseRequest) {
    // The constructor only checks that the contract between the SDK and TestBox
    // is being upheld. It does not check for authorization/authentication,
    // as this is done async.
    if (isTestBoxBulkUseCaseRequest(payload)) {
      this.version = payload.version;
      this.trial_id = payload.trial_id;
      this.use_case_types = payload.use_case_types;
      this.trial_data = new TestBoxTrial(payload.trial_data);
      this.failure_url = payload.failure_url;
      this.success_url = payload.success_url;
    } else {
      throw new TestBoxError(
        "An invalid use case payload was provided to the TestBoxBulkUseCaseRequest class."
      );
    }
  }

  static async fromExpressRequest(req: Request) {
    let payload = req.body;
    if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    }
    const trialRequest = new TestBoxBulkUseCaseRequest(payload);
    await trialRequest.verifyToken(
      req.headers.authorization.replace("Bearer ", "")
    );
    return trialRequest;
  }

  async verifyToken(authToken: string): Promise<boolean> {
    const results = await verifyAuthenticationToken(
      authToken,
      this.trial_id,
      getConfigItem("productId")
    );
    if (results) {
      this.hasVerifiedAuth = true;
      this.authToken = authToken;
    }
    return results;
  }

  throwIfAuthNotValidated() {
    if (!this.hasVerifiedAuth) {
      throw new TestBoxError(
        "You did not verify the JWT of the trial request before fulfilling it."
      );
    }
  }

  // If creating a trial and ingesting data takes more than a few seconds
  // for your system (or if you'd prefer to fulfill the trials via a worker queue, etc.),
  // you can fulfill the trial asyncronously using this convenience method.
  async fulfillAsync(useCaseUrls: UseCaseUrls) {
    this.throwIfAuthNotValidated();
    await axios.post(this.success_url, { useCaseUrls }, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }

  async reportFailureToFulfill(data: any) {
    this.throwIfAuthNotValidated();
    await axios.post(this.failure_url, data, {
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
  }
}
