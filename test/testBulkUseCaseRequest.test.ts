import { getMockReq } from "@jest-mock/express";
import { ITestBoxBulkUseCaseRequest, UseCaseType } from "../src/payloads";
import TestBoxBulkUseCaseRequest from "../src/bulkUseCaseRequest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import fs from "fs";
import path from "path";
import TestBoxTrial from "../src/trial";
import { configureTestBox } from "../src";

const basicTrial = new TestBoxTrial().setEmail("hello@world.com");
const USE_CASE_URL = "https://dumblr.com/mypage";

// Warning: these URLs are subject to change at any time. Please do not rely
// on them for anything!
const USE_CASE_REQUEST_BODY: ITestBoxBulkUseCaseRequest = {
  version: 1,
  use_case_types: [
    UseCaseType.CUSTOMER_SUPPORT_CANNED_RESPONSES,
    UseCaseType.CUSTOMER_SUPPORT_TICKET_TAGGING,
  ],
  success_url:
    "https://example.com/success/c35dd919-6df3-49ca-96d0-d30e10dba442",
  failure_url:
    "https://example.com/failure/c35dd919-6df3-49ca-96d0-d30e10dba442",
  trial_id: "c35dd919-6df3-49ca-96d0-d30e10dba442",
  trial_data: basicTrial,
};

const VALID_JWT_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRPTTRycTdySlNNdk5Gang2eEVIVXJScmVqU0lJcC9MZWtVWjhjVXhpaGs5bXh2T1FocGFaK1RQTUs5MkhYZFpvOTdmRzVqTHJUeHJRajFuZkdEVUhRPT0ifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHJpYWxfaWQiOiJjMzVkZDkxOS02ZGYzLTQ5Y2EtOTZkMC1kMzBlMTBkYmE0NDIiLCJhdWQiOiJ1bml0LXRlc3QifQ.qXKMeQA5uqPMqiPi5RPvO_Bh38yAP1YzAWwPqt8lvhlLVqb3y8Sk5hQbBnqRJXdOkjGTVuKrAPipBlUTsMtWw5MBILczXhuy_-tElpZQRC5hZhV45IWRizKLlw_EYWh5Yol788xddQBFkCmtvznTpTLjWsh24T8QFXcKO0oU8Fj3HgDY53zNg7Yvway7a_-elBiZ6T5KrktmJ_whORPEEqJOaOQbBtIinYsjF-Mg9Q_spVKNx7psJB8lDm-kcR8diRE4D3hL2_MyznS0HsTlev0a3nj8CkgYrndYETq1liGyKP3MEoPwfoRJQ3jTiktDu458VeESalqVAFqu2I-ulA";
const AUDIENCE_CLAIM = "unit-test";

beforeAll(() => {
  configureTestBox({
    productId: AUDIENCE_CLAIM,
  });
});

describe("test payload parsing", () => {
  test("a good payload", () => {
    expect(
      () => new TestBoxBulkUseCaseRequest(USE_CASE_REQUEST_BODY)
    ).not.toThrowError();
  });

  test("a bad payload", () => {
    expect(
      () =>
        new TestBoxBulkUseCaseRequest({
          ...USE_CASE_REQUEST_BODY,
          extras: "something_fishy",
        } as ITestBoxBulkUseCaseRequest)
    ).toThrowError();
  });
});

describe("test JWT checking", () => {
  beforeAll(async () => {
    const mock = new MockAdapter(axios);

    await new Promise<void>((resolve) => {
      const filePath = path.dirname(__filename) + "/fixtures/well-known";
      fs.readFile(filePath, (err, data) => {
        const contents = data.toString("utf-8");
        mock
          .onGet("https://trials.testbox.com/.well-known/keys")
          .reply(200, contents, { "Content-Type": "application/json" });
        resolve();
      });
    });

    mock
      .onPost(
        "https://example.com/success/c35dd919-6df3-49ca-96d0-d30e10dba442"
      )
      .reply(201);
  });

  test("a valid JWT", async () => {
    const request = new TestBoxBulkUseCaseRequest(USE_CASE_REQUEST_BODY);
    const results = await request.verifyToken(VALID_JWT_TOKEN);
    expect(results).toBeTruthy();

    await expect(
      request.fulfillAsync({
        [UseCaseType.CUSTOMER_SUPPORT_CANNED_RESPONSES]: USE_CASE_URL,
      })
    ).resolves.not.toThrowError();
  });

  test("a JWT that tries to be sneaky and change the audience", async () => {
    const request = new TestBoxBulkUseCaseRequest(USE_CASE_REQUEST_BODY);
    const jwtToken =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRPTTRycTdySlNNdk5Gang2eEVIVXJScmVqU0lJcC9MZWtVWjhjVXhpaGs5bXh2T1FocGFaK1RQTUs5MkhYZFpvOTdmRzVqTHJUeHJRajFuZkdEVUhRPT0ifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHJpYWxfaWQiOiJjMzVkZDkxOS02ZGYzLTQ5Y2EtOTZkMC1kMzBlMTBkYmE0NDIiLCJhdWQiOiJ1bml0LXRlc3QtYnJva2VuIn0.F3-i0vXNUq4uDBX3YgSswiBSbqByPR0KxSrwuTBYdA1t8EWfPyFMXpxplIsXxCe26OrizIUoReuxKM_aAk9FTtWAuVmXYBKrSei77KpW2Vsp71SjglPgFFY6Wj_1BkTp2C1Z3iAjVBpfJOw5R0hNp18BrLBcg-iZ4XZL6LGUR2YHWPK2MqLDg6Yant_ZP_gIzPcW16UEleJFTGlbfh3Jsl47dQwisuWwiCUJb-7XO8bEQY6SFKZul36NQ4wU9qHnOiG27oEUwBR9LdXuqbJc3C3RLoPlDLS4SKjxAfp0SkejjuRqxPqFmSVJF9YbhrB_8gNwqWIEEffS2gUoIU3e4w";
    const results = await request.verifyToken(jwtToken);
    expect(results).toBeFalsy();

    await expect(
      request.fulfillAsync({
        [UseCaseType.CUSTOMER_SUPPORT_CANNED_RESPONSES]: USE_CASE_URL,
      })
    ).rejects.toThrowError();
  });
});

describe("test Express.js convenience methods", () => {
  test("it builds a trial from a request", async () => {
    const expressRequest = getMockReq({
      body: USE_CASE_REQUEST_BODY,
      headers: {
        authorization: `Bearer ${VALID_JWT_TOKEN}`,
      },
    });

    const bulkUseCaseRequest = await TestBoxBulkUseCaseRequest.fromExpressRequest(
      expressRequest
    );
    await expect(
      bulkUseCaseRequest.fulfillAsync({
        [UseCaseType.CUSTOMER_SUPPORT_CANNED_RESPONSES]: USE_CASE_URL,
      })
    ).resolves.not.toThrowError();
  });
});
