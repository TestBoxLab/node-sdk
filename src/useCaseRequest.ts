import {
  isTestBoxUseCaseRequest,
  ITestBoxTrial,
  ITestBoxUseCaseRequest,
  UseCaseType,
} from "./payloads";
import axios from "axios";
import { TestBoxError } from "./error";
import { verifyAuthenticationToken } from "./auth";
import { Request, Response } from "express";
import { getConfigItem } from "./config";
import TestBoxTrial from "./trial";

export default class TestBoxUseCaseRequest implements ITestBoxUseCaseRequest {
  version: 1;
  trial_id: string;
  use_case_type: UseCaseType;
  trial_data: ITestBoxTrial;
  success_url: string;
  failure_url: string;

  private hasVerifiedAuth: boolean = false;
  private authToken: string;

  constructor(payload: ITestBoxUseCaseRequest) {
    // The constructor only checks that the contract between the SDK and TestBox
    // is being upheld. It does not check for authorization/authentication,
    // as this is done async.
    if (isTestBoxUseCaseRequest(payload)) {
      this.version = payload.version;
      this.trial_id = payload.trial_id;
      this.use_case_type = payload.use_case_type;
      this.trial_data = new TestBoxTrial(payload.trial_data);
      this.failure_url = payload.failure_url;
      this.success_url = payload.success_url;
    } else {
      throw new TestBoxError(
        "An invalid use case payload was provided to the TestBoxUseCaseRequest class."
      );
    }
  }

  static async fromExpressRequest(req: Request) {
    let payload = req.body;
    if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    }
    const trialRequest = new TestBoxUseCaseRequest(payload);
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

  // Convenience method for Express.js users
  // You can respond directly to our webhook request with a 201
  // response instead of initiating an HTTP callback.
  express = {
    fulfill: (useCaseUrl: string, response: Response) => {
      this.throwIfAuthNotValidated();
      response.status(201).json({ useCaseUrl });
    },
  };

  // Convenience method for Fastify users
  // You can respond directly to our webhook request with a 201
  // response instead of initiating an HTTP callback.
  fastify = {
    fulfill: (useCaseUrl: string, reply: FastifyReply) => {
      this.throwIfAuthNotValidated();
      reply.code(201).header("content-type", "application/json").send({ useCaseUrl });
    },
  };

  // Convenience method for Cloudflare Workers users
  // You can respond directly to our webhook request with a 201
  // response instead of initiating an HTTP callback.
  workers = {
    fulfill: (useCaseUrl: string) => {
      this.throwIfAuthNotValidated();
      // @ts-ignore
      return new Response(JSON.stringify({ useCaseUrl }), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      });
    },
  };
}