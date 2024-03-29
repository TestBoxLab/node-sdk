import {
  isTestBoxUseCaseRequest,
  ITestBoxTrial,
  ITestBoxUseCaseRequest,
  UseCaseType,
} from "./payloads";
import { TestBoxError } from "./error";
import { Request, Response } from "express";
import TestBoxTrial from "./trial";
import TestBoxAuthenticatedRequest from "./testBoxAuthenticatedRequest";
import { FastifyReply } from "./fastify";
import { TestboxConfigFramework, getConfigItem } from "./config";

type UseCaseUrls = { [key: string]: string };
export default class TestBoxUseCaseRequest
  extends TestBoxAuthenticatedRequest
  implements ITestBoxUseCaseRequest
{
  version: 1;
  trial_id: string;
  use_case_types: UseCaseType[];
  trial_data: ITestBoxTrial;

  constructor(payload: ITestBoxUseCaseRequest) {
    super(payload);

    // The constructor only checks that the contract between the SDK and TestBox
    // is being upheld. It does not check for authorization/authentication,
    // as this is done async.
    if (isTestBoxUseCaseRequest(payload)) {
      this.version = payload.version;
      this.trial_id = payload.trial_id;
      this.use_case_types = payload.use_case_types;
      this.trial_data = new TestBoxTrial(payload.trial_data);
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

  async processUseCases(
    res: Response | FastifyReply,
    handler: (useCaseType: string) => Promise<string>
  ) {
    for (const useCaseType of this.use_case_types) {
      const url = await handler(useCaseType);

      const framework = getConfigItem("framework");
      if (framework == TestboxConfigFramework.EXPRESS) {
        this.express.fulfill(useCaseType, url, res as Response);
      } else if (framework == TestboxConfigFramework.FASTIFY) {
        this.fastify.fulfill(useCaseType, url, res as FastifyReply);
      } else {
        throw new TestBoxError(
          `processUseCases is not supported for framework "${framework}"`
        );
      }
    }
  }

  // Convenience method for Express.js users
  // You can respond directly to our webhook request with a 200
  // response instead of initiating an HTTP callback.
  private express = {
    fulfill: (useCaseType: string, url: string, response: Response) => {
      this.throwIfAuthNotValidated();
      response.status(200).json({ [useCaseType]: url } as UseCaseUrls);
    },
  };

  // Convenience method for Fastify users
  // You can respond directly to our webhook request with a 200
  // response instead of initiating an HTTP callback.
  private fastify = {
    fulfill: (useCaseType: string, url: string, reply: FastifyReply) => {
      this.throwIfAuthNotValidated();
      reply
        .code(200)
        .header("content-type", "application/json")
        .send({ [useCaseType]: url } as UseCaseUrls);
    },
  };
}
