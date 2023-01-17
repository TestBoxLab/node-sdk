import express from "express";
import bodyParser from "body-parser";
import {
  configureTestBox,
  TestBoxUseCaseRequest,
  TestBoxTrial,
  TestBoxTrialRequest,
  TestboxConfigFramework,
} from "@testboxlab/node-sdk";

configureTestBox({
  productId: "my-slugified-product-name",
  framework: TestboxConfigFramework.EXPRESS,
});

const app = express();
app.use(bodyParser.json());

app.post("/api/testbox/trial", async (req, res) => {
  const trialRequest = await TestBoxTrialRequest.fromExpressRequest(req);

  try {
    trialRequest.throwIfAuthNotValidated();
  } catch (error) {
    // The token verification failed, meaning someone is trying to pretend to be
    // TestBox! Do not process their request.
    return res.status(401).send();
  }

  // Once you have provisioned an account, we need to start telling TestBox about it.
  const testboxTrial = new TestBoxTrial({
    start_url_context: {
      subdomain: "tbx-random-sudomain",
    },
    secret_context: {
      sso_jwt_secret: "hello-i-am-a-jwt-secret",
    },
    admin_authentication: {
      user: {
        email: "a-randomly-generated-email@my-domain.com",
        password: "somepassword",
      },
      api_token: "some-api-key-in-here",
    },
    created_at: new Date(),
    trial_users: [],
  });

  // Or, you can use the helper functions
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

// You can use the use-case call to return a URL for use-cases
app.post("/api/testbox/use-cases", async (req, res) => {
  const useCaseRequest = await TestBoxUseCaseRequest.fromExpressRequest(req);

  try {
    useCaseRequest.throwIfAuthNotValidated();
  } catch (error) {
    // The token verification failed, meaning someone is trying to pretend to be
    // TestBox! Do not process their request.
    return res.status(401).send();
  }

  await useCaseRequest.processUseCases(res, async (useCaseType) => {
    // You may now safely retrieve a URL for the requested use case
    return "https://mydomain.com.br/some-page";
  });
});

const PORT = 3000;
const server = app.listen(PORT);
server.on("listening", () => {
  console.log(`The app is listening on port ${PORT}`);
});
