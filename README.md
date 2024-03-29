<img src="./assets/pedals.svg" width="125" />

# TestBox Node.js SDK

[![Test, build, publish](https://github.com/TestBoxLab/node-sdk/actions/workflows/build.yml/badge.svg)](https://github.com/TestBoxLab/node-sdk/actions/workflows/build.yml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

## Usage

### Installation

First, install the SDK into your project.

```shell
npm install @testboxlab/node-sdk
```

```shell
yarn add @testboxlab/node-sdk
```

### Configure the SDK

When your project is initialized, you need to configure the SDK. You can configure wherever you'd like,
but you must configure the SDK before trying to accept trial requests from TestBox.

```typescript
import { configureTestBox } from "@testboxlab/node-sdk";

configureTestBox({
    productId: "my-slugified-product-name",
});
```

The `productId` is provided to you by TestBox. It's important to use the correct one, as this
value is used in verifying JWT signatures.

### Set up a route

TestBox requests trials from its partners as needed using a webhook. Create a webhook in your web
application to accept these requests. For example, in an Express project...

```typescript
const app = express();

// The exact URL does not matter, this is just for illustration purposes
app.post("/api/testbox/trial", (req, res) => {
    // See the next step below...
});
```

This SDK provides some helper functions for popular web frameworks. For example, Express projects
can use this helper...

```typescript
import { TestBoxTrialRequest } from "@testboxlab/node-sdk";

const app = express();

app.post("/api/testbox/trial", async (req, res) => {
    const trialRequest = await TestBoxTrialRequest.fromExpressRequest(req);

    // First, call your business logic to create an account/trial

    // See the next step...
});
```

However, if you do not wish to use a helper, here is an example of instantiating the class
and authenticating the request from TestBox.

```typescript
import { TestBoxTrialRequest, TestBoxTrial } from "@testboxlab/node-sdk";

const app = express();

app.post("/api/testbox/trial", async (req, res) => {
    const trialRequest = new TestBoxTrialRequest(req.body);
    
    const tokenVerified = await trialRequest.verifyToken(req.headers["authorization"]);
    if (!tokenVerified) {
        // The token verification failed, meaning someone is trying to pretend to be
        // TestBox! Do not process their request.
        return res.status(401).send();
    }

    // You may now safely provision an account for TestBox to use. Here is an illustration.
    const myTrial = new Account();
    myTrial.email = "a-randomly-generated-email@my-domain.com"
    myTrial.subdomain = "tbx-random-sudomain";
    await myTrial.save();
      
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
```

## Setup use cases

```typescript
import { TestBoxUseCaseRequest, TestBoxTrial } from "@testboxlab/node-sdk";

const app = express();

// You can use the use-case call to return a URL for 
// the requested use-cases
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
```

## Report bugs or security issues

To report a bug, please feel free to open an issue on this repository.

To report a security issue, please [email us directly][1].

[1]: mailto:dev@testbox.com
