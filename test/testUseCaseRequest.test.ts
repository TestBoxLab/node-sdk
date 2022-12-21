import { getMockReq, getMockRes } from "@jest-mock/express";
import { ITestBoxUseCaseRequest, UseCaseType } from "../src/payloads";
import TestBoxUseCaseRequest from "../src/useCaseRequest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { configureTestBox } from "../src";
import { nockJwks } from "./helpers";

const USE_CASE_URL = "https://dumblr.com/mypage";

// Warning: these URLs are subject to change at any time. Please do not rely
// on them for anything!
const USE_CASE_REQUEST_BODY: ITestBoxUseCaseRequest = {
  version: 1,
  use_case_type: UseCaseType.CUSTOMER_SUPPORT_CANNED_RESPONSES,
  success_url:
    "https://example.com/success/c35dd919-6df3-49ca-96d0-d30e10dba442",
  failure_url:
    "https://example.com/failure/c35dd919-6df3-49ca-96d0-d30e10dba442",
  trial_id: "c35dd919-6df3-49ca-96d0-d30e10dba442",
  trial_data: {
    start_url_context: {},
    secret_context: {},
    trial_users: [{ email: "hellow@world.com" }],
    admin_authentication: {
      user: { email: "hello@world.com" },
    },
    created_at: new Date(),
  },
};

const VALID_JWT_TOKEN =
  "eyJhbGciOiJSUzI1NiJ9.eyJ0cmlhbF9pZCI6ImMzNWRkOTE5LTZkZjMtNDljYS05NmQwLWQzMGUxMGRiYTQ0MiIsImlhdCI6MTY3MTYzNzE3MiwiaXNzIjoidXJuOmV4YW1wbGU6dGVzdGJveCIsImF1ZCI6InVuaXQtdGVzdCIsImV4cCI6MTY3MTY0NDM3Mn0.srwZgbLNrXIDTuXhrjkEAdje2mcyRUhjySEjr3EDssRmR2Z-RVCzBNsjUX8OYsnuykhWdCCieCQSdJSl6gr5c_JlBX3gwI7-Yslnrz_0nhLwRXcsF2cIQO2TGaP3GPiDsx6C2XbZWUXaVA54Dza6yOIgDCy47cD53OzQ_srf0XNvEt4xpAZWWC8luvag6YPIR-GoRmkdGSOYPb44ZWMq1BO3cDzkVj7mrDN7-9IXV5CW_bxO1VvAeLe3STA6t6B0K1NrmjkkoLlpXDaNNQW9UindCIXmFLSiXmSRgiD7NoiJFzVha4cXUA1gPeWlgILScv2WxE-pnKaJKyvHqQusGw";
const AUDIENCE_CLAIM = "unit-test";

beforeAll(() => {
  configureTestBox({
    productId: AUDIENCE_CLAIM,
  });
});

describe("test payload parsing", () => {
  test("a good payload", () => {
    expect(
      () => new TestBoxUseCaseRequest(USE_CASE_REQUEST_BODY)
    ).not.toThrowError();
  });

  test("a bad payload", () => {
    expect(
      () =>
        new TestBoxUseCaseRequest({
          ...USE_CASE_REQUEST_BODY,
          extras: "something_fishy",
        } as ITestBoxUseCaseRequest)
    ).toThrowError();
  });
});

describe("test JWT checking", () => {
  beforeAll(async () => {
    await nockJwks();
    const mock = new MockAdapter(axios);
    mock
      .onPost(
        "https://example.com/success/c35dd919-6df3-49ca-96d0-d30e10dba442"
      )
      .reply(201);
  });

  test("a valid JWT", async () => {
    const request = new TestBoxUseCaseRequest(USE_CASE_REQUEST_BODY);
    const results = await request.verifyToken(VALID_JWT_TOKEN);
    expect(results).toBeTruthy();

    expect(() =>
      request.express.fulfill(USE_CASE_URL, getMockRes().res)
    ).not.toThrowError();
  });

  test("a JWT that tries to be sneaky and change the audience", async () => {
    const request = new TestBoxUseCaseRequest(USE_CASE_REQUEST_BODY);
    const jwtToken =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRPTTRycTdySlNNdk5Gang2eEVIVXJScmVqU0lJcC9MZWtVWjhjVXhpaGs5bXh2T1FocGFaK1RQTUs5MkhYZFpvOTdmRzVqTHJUeHJRajFuZkdEVUhRPT0ifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHJpYWxfaWQiOiJjMzVkZDkxOS02ZGYzLTQ5Y2EtOTZkMC1kMzBlMTBkYmE0NDIiLCJhdWQiOiJ1bml0LXRlc3QtYnJva2VuIn0.F3-i0vXNUq4uDBX3YgSswiBSbqByPR0KxSrwuTBYdA1t8EWfPyFMXpxplIsXxCe26OrizIUoReuxKM_aAk9FTtWAuVmXYBKrSei77KpW2Vsp71SjglPgFFY6Wj_1BkTp2C1Z3iAjVBpfJOw5R0hNp18BrLBcg-iZ4XZL6LGUR2YHWPK2MqLDg6Yant_ZP_gIzPcW16UEleJFTGlbfh3Jsl47dQwisuWwiCUJb-7XO8bEQY6SFKZul36NQ4wU9qHnOiG27oEUwBR9LdXuqbJc3C3RLoPlDLS4SKjxAfp0SkejjuRqxPqFmSVJF9YbhrB_8gNwqWIEEffS2gUoIU3e4w";
    const results = await request.verifyToken(jwtToken);
    expect(results).toBeFalsy();

    expect(() =>
      request.express.fulfill(USE_CASE_URL, getMockRes().res)
    ).toThrowError();
  });
});

describe("test Express.js convenience methods", () => {
  beforeEach(async () => {
    await nockJwks();
  });

  test("it builds a trial from a request", async () => {
    const expressRequest = getMockReq({
      body: USE_CASE_REQUEST_BODY,
      headers: {
        authorization: `Bearer ${VALID_JWT_TOKEN}`,
      },
    });

    const useCaseRequest = await TestBoxUseCaseRequest.fromExpressRequest(
      expressRequest
    );
    expect(() =>
      useCaseRequest.express.fulfill(USE_CASE_URL, getMockRes().res)
    ).not.toThrowError();
  });

  test("it returns a 201 with the trial", async () => {
    const request = new TestBoxUseCaseRequest(USE_CASE_REQUEST_BODY);
    await request.verifyToken(VALID_JWT_TOKEN);
    request.express.fulfill(USE_CASE_URL, getMockRes().res);
  });
});
