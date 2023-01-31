import express from "express";
import bodyParser from "body-parser";
import {
    configureTestBox,
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
    const trialRequest = new TestBoxTrialRequest();
    try {
        await trialRequest.fromRequest(req);
    } catch (e) {
        console.log(e)
        res.status(400).send();
    }

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
            subdomain: "tbx-random-subdomain",
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
        .setSubdomain("tbx-random-subdomain") // we need the subdomain in order to put users into your applicatio
        .setApiKey("some-api-key-in-here") // we use API keys to ingest data into a trial
        .setJwtSecret("hello-i-am-a-jwt-secret"); // you may use JWT SSO to authenticate our mutual users into your application

    // Once we have finished populating the details of our trial, we need
    // to fulfill the request. Whenever possible, respond to TestBox synchronously
    // using a 201 HTTP code. 200 HTTP codes will be ignored, as we will assume
    // that you are creating the trial asynchronously.
    trialRequest.fulfill(testboxTrial, res);
});


app.post("/api/testbox/async_trial", async (req, res) => {
    const trialRequest = new TestBoxTrialRequest();
    try {
        await trialRequest.fromRequest(req);
    } catch (e) {
        console.log(e)
        res.status(400).send();
    }

    try {
        trialRequest.throwIfAuthNotValidated();
    } catch (error) {
        // The token verification failed, meaning someone is trying to pretend to be
        // TestBox! Do not process their request.
        return res.status(401).send();
    }

    // Immediately send back
    res.status(200).send();


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
    try {
        await trialRequest.fulfillAsync(testboxTrial);
        console.log('Sent response back!')
    } catch (e) {
        await trialRequest.reportFailureAsync({'something': 'went wrong!'})
    }

    return res;
});

const PORT = 3000;
const server = app.listen(PORT);
server.on("listening", () => {
    console.log(`The app is listening on port ${PORT}`);
});
