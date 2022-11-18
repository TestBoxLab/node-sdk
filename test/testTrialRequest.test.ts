import { ITestBoxTrialRequest } from "../src/payloads";
import TestBoxTrialRequest from "../src/trialRequest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import fs from "fs";
import os from "os";
import path from "path";
import TestBoxTrial from "../src/trial";

// Warning: these URLs are subject to change at any time. Please do not rely
// on them for anything!
const TRIAL_REQUEST_BODY: ITestBoxTrialRequest = {
  version: 1,
  success_url:
    "https://example.com/success/c35dd919-6df3-49ca-96d0-d30e10dba442",
  failure_url:
    "https://example.com/failure/c35dd919-6df3-49ca-96d0-d30e10dba442",
  trial_id: "c35dd919-6df3-49ca-96d0-d30e10dba442",
};

describe("test payload parsing", () => {
  test("a good payload", () => {
    expect(
      () => new TestBoxTrialRequest(TRIAL_REQUEST_BODY)
    ).not.toThrowError();
  });

  test("a bad payload", () => {
    expect(
      () =>
        new TestBoxTrialRequest({
          ...TRIAL_REQUEST_BODY,
          extras: "something_fishy",
        } as ITestBoxTrialRequest)
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
    const request = new TestBoxTrialRequest(TRIAL_REQUEST_BODY);
    const jwtToken =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRPTTRycTdySlNNdk5Gang2eEVIVXJScmVqU0lJcC9MZWtVWjhjVXhpaGs5bXh2T1FocGFaK1RQTUs5MkhYZFpvOTdmRzVqTHJUeHJRajFuZkdEVUhRPT0ifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHJpYWxfaWQiOiJjMzVkZDkxOS02ZGYzLTQ5Y2EtOTZkMC1kMzBlMTBkYmE0NDIiLCJhdWQiOiJ1bml0LXRlc3QifQ.qXKMeQA5uqPMqiPi5RPvO_Bh38yAP1YzAWwPqt8lvhlLVqb3y8Sk5hQbBnqRJXdOkjGTVuKrAPipBlUTsMtWw5MBILczXhuy_-tElpZQRC5hZhV45IWRizKLlw_EYWh5Yol788xddQBFkCmtvznTpTLjWsh24T8QFXcKO0oU8Fj3HgDY53zNg7Yvway7a_-elBiZ6T5KrktmJ_whORPEEqJOaOQbBtIinYsjF-Mg9Q_spVKNx7psJB8lDm-kcR8diRE4D3hL2_MyznS0HsTlev0a3nj8CkgYrndYETq1liGyKP3MEoPwfoRJQ3jTiktDu458VeESalqVAFqu2I-ulA";
    const results = await request.verifyToken(jwtToken, "unit-test");
    expect(results).toBeTruthy();

    const trial = new TestBoxTrial().setEmail("hello@world.com");
    await expect(request.fulfill(trial)).resolves.not.toThrowError();
  });

  test("a JWT that tries to be sneaky and change the audience", async () => {
    const request = new TestBoxTrialRequest(TRIAL_REQUEST_BODY);
    const jwtToken =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRPTTRycTdySlNNdk5Gang2eEVIVXJScmVqU0lJcC9MZWtVWjhjVXhpaGs5bXh2T1FocGFaK1RQTUs5MkhYZFpvOTdmRzVqTHJUeHJRajFuZkdEVUhRPT0ifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHJpYWxfaWQiOiJjMzVkZDkxOS02ZGYzLTQ5Y2EtOTZkMC1kMzBlMTBkYmE0NDIiLCJhdWQiOiJ1bml0LXRlc3QtYnJva2VuIn0.F3-i0vXNUq4uDBX3YgSswiBSbqByPR0KxSrwuTBYdA1t8EWfPyFMXpxplIsXxCe26OrizIUoReuxKM_aAk9FTtWAuVmXYBKrSei77KpW2Vsp71SjglPgFFY6Wj_1BkTp2C1Z3iAjVBpfJOw5R0hNp18BrLBcg-iZ4XZL6LGUR2YHWPK2MqLDg6Yant_ZP_gIzPcW16UEleJFTGlbfh3Jsl47dQwisuWwiCUJb-7XO8bEQY6SFKZul36NQ4wU9qHnOiG27oEUwBR9LdXuqbJc3C3RLoPlDLS4SKjxAfp0SkejjuRqxPqFmSVJF9YbhrB_8gNwqWIEEffS2gUoIU3e4w";
    const results = await request.verifyToken(jwtToken, "unit-test");
    expect(results).toBeFalsy();

    const trial = new TestBoxTrial().setEmail("hello@world.com");
    await expect(request.fulfill(trial)).rejects.toThrowError();
  });
});
