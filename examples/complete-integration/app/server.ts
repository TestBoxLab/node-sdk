import express from "express";
import bodyParser from "body-parser";
import {
  configureTestBox,
  TestBoxBulkUseCaseRequest,
  TestBoxTrial,
  TestBoxTrialRequest,
} from "@testboxlab/node-sdk";

configureTestBox({
  productId: "my-slugified-product-name",
});

const app = express();
app.use(bodyParser.json())

app.post("/api/testbox/trial", async (req, res) => {
  const trialRequest = await TestBoxTrialRequest.fromExpressRequest(req);

  const authorization = req.headers["authorization"];
  if (!authorization) return res.status(401);

  const tokenVerified = await trialRequest.verifyToken(authorization);
  if (!tokenVerified) {
    // The token verification failed, meaning someone is trying to pretend to be
    // TestBox! Do not process their request.
    return res.status(401);
  }

  // Once you have provisioned an account, we need to start telling TestBox about it.
  const testboxTrial = new TestBoxTrial();
  testboxTrial
    .setEmail("a-randomly-generated-email@my-domain.com") // we use the randomly generated email for SSO login
    .setSubdomain("tbx-random-sudomain") // we need the subdomain in order to put users into your applicatio
    .setApiKey("some-api-key-in-here") // we use API keys to ingest data into a trial
    .setJwtSecret("hello-i-am-a-jwt-secret"); // you may use JWT SSO to authenticate our mutual users into your application

  // Once we have finished populating the details of our trial, we need
  // to fulfill the request. Whenever possible, respond to TestBox synchronously
  // using a 201 HTTP code. 200 HTTP codes will be ignored, as we will assume
  // that you are creating the trial asynchronously.
  trialRequest.express.fulfill(testboxTrial, res);
});

// You can use the bulk use-case call to return a URL for
// multiple use-cases at once asynchronously
app.post("/api/testbox/use-cases/bulk", async (req, res) => {
  const useCaseRequest = new TestBoxBulkUseCaseRequest(req.body);

  const authorization = req.headers["authorization"];
  if (!authorization) return res.status(401);

  const tokenVerified = await useCaseRequest.verifyToken(authorization);
  if (!tokenVerified) {
    // The token verification failed, meaning someone is trying to pretend to be
    // TestBox! Do not process their request.
    return res.status(401);
  }

  try {
    // You may now safely retrieve a URL for the requested use case
    const result: { [key: string]: string } = {};
    for (const useCaseType in useCaseRequest.use_case_types) {
      result[useCaseType] = "https://mydomain.com.br/some-page";
    }

    // Once we have finished build the URL for the use case, we need
    // to fulfill the request. For bulk use case request, we always expect
    // a async fulfill that you are creating the trial asynchronously.
    useCaseRequest.fulfillAsync(result);
  } catch (e) {
    useCaseRequest.reportFailureToFulfill(e);
  }
});

const PORT = 3000;
const server = app.listen(PORT);
server.on("listening", () => {
  console.log(`The app is listening on port ${PORT}`);
});
