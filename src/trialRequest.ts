import {
  isTestBoxTrialRequest,
  ITestBoxTrial,
  ITestBoxTrialRequest,
} from "./payloads";
import axios from "axios";
import { TestBoxError } from "./error";
import { Request, Response } from "express";
import TestBoxAuthenticatedRequest from "./testBoxAuthenticatedRequest";
import { FastifyReply } from "./fastify";

export default class TestBoxTrialRequest
  extends TestBoxAuthenticatedRequest
  implements ITestBoxTrialRequest
{
  version: 1;
  trial_id: string;
  success_url: string;
  failure_url: string;

  constructor(payload: ITestBoxTrialRequest) {
    super(payload);

    // The constructor only checks that the contract between the SDK and TestBox
    // is being upheld. It does not check for authorization/authentication,
    // as this is done async.
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

  static async fromExpressRequest(req: Request) {
    let payload = req.body;
    if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    }
    const trialRequest = new TestBoxTrialRequest(payload);
    await trialRequest.verifyToken(
      req.headers.authorization.replace("Bearer ", "")
    );
    return trialRequest;
  }

  // Convenience method for Express.js users
  // You can respond directly to our webhook request with a 201
  // response instead of initiating an HTTP callback.
  express = {
    fulfill: (trial: ITestBoxTrial, response: Response) => {
      this.throwIfAuthNotValidated();
      response.status(201).json(trial);
    },
  };

  // Convenience method for Fastify users
  // You can respond directly to our webhook request with a 201
  // response instead of initiating an HTTP callback.
  fastify = {
    fulfill: (trial: ITestBoxTrial, reply: FastifyReply) => {
      this.throwIfAuthNotValidated();
      reply.code(201).header("content-type", "application/json").send(trial);
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
  };

  // If creating a trial and ingesting data takes more than a few seconds
  // for your system (or if you'd prefer to fulfill the trials via a worker queue, etc.),
  // you can fulfill the trial asyncronously using this convenience method.
  async fulfillAsync(trial: ITestBoxTrial) {
    this.throwIfAuthNotValidated();
    await axios.post(this.success_url, trial, {
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
