import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { nockJwks } from './helpers';
import {
  configureTestBox,
  ITestBoxAuthenticatedRequest,
  TestBoxAuthenticatedRequest,
} from "../src";

const REQUEST_BODY: ITestBoxAuthenticatedRequest = {
  version: 1,
  trial_id: "c35dd919-6df3-49ca-96d0-d30e10dba442",
};

const VALID_JWT_TOKEN =
  "eyJhbGciOiJSUzI1NiJ9.eyJ0cmlhbF9pZCI6ImMzNWRkOTE5LTZkZjMtNDljYS05NmQwLWQzMGUxMGRiYTQ0MiIsImlhdCI6MTY3MTYzNzE3MiwiaXNzIjoidXJuOmV4YW1wbGU6dGVzdGJveCIsImF1ZCI6InVuaXQtdGVzdCIsImV4cCI6MTY3MTY0NDM3Mn0.srwZgbLNrXIDTuXhrjkEAdje2mcyRUhjySEjr3EDssRmR2Z-RVCzBNsjUX8OYsnuykhWdCCieCQSdJSl6gr5c_JlBX3gwI7-Yslnrz_0nhLwRXcsF2cIQO2TGaP3GPiDsx6C2XbZWUXaVA54Dza6yOIgDCy47cD53OzQ_srf0XNvEt4xpAZWWC8luvag6YPIR-GoRmkdGSOYPb44ZWMq1BO3cDzkVj7mrDN7-9IXV5CW_bxO1VvAeLe3STA6t6B0K1NrmjkkoLlpXDaNNQW9UindCIXmFLSiXmSRgiD7NoiJFzVha4cXUA1gPeWlgILScv2WxE-pnKaJKyvHqQusGw";
const AUDIENCE_CLAIM = "unit-test";

beforeAll(() => {
  configureTestBox({
    productId: AUDIENCE_CLAIM,
  });
});

describe("test JWT checking", () => {
  beforeAll(async () => {
    await nockJwks()
    const mock = new MockAdapter(axios);
    mock
      .onPost(
        "https://example.com/success/c35dd919-6df3-49ca-96d0-d30e10dba442"
      )
      .reply(201);
  });

  test("a valid JWT", async () => {
    const request = new TestBoxAuthenticatedRequest(REQUEST_BODY);
    const results = await request.verifyToken(VALID_JWT_TOKEN);
    expect(results).toBeTruthy();
  });

  test("a JWT that tries to be sneaky and change the audience", async () => {
    const request = new TestBoxAuthenticatedRequest(REQUEST_BODY);
    const jwtToken =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlRPTTRycTdySlNNdk5Gang2eEVIVXJScmVqU0lJcC9MZWtVWjhjVXhpaGs5bXh2T1FocGFaK1RQTUs5MkhYZFpvOTdmRzVqTHJUeHJRajFuZkdEVUhRPT0ifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHJpYWxfaWQiOiJjMzVkZDkxOS02ZGYzLTQ5Y2EtOTZkMC1kMzBlMTBkYmE0NDIiLCJhdWQiOiJ1bml0LXRlc3QtYnJva2VuIn0.F3-i0vXNUq4uDBX3YgSswiBSbqByPR0KxSrwuTBYdA1t8EWfPyFMXpxplIsXxCe26OrizIUoReuxKM_aAk9FTtWAuVmXYBKrSei77KpW2Vsp71SjglPgFFY6Wj_1BkTp2C1Z3iAjVBpfJOw5R0hNp18BrLBcg-iZ4XZL6LGUR2YHWPK2MqLDg6Yant_ZP_gIzPcW16UEleJFTGlbfh3Jsl47dQwisuWwiCUJb-7XO8bEQY6SFKZul36NQ4wU9qHnOiG27oEUwBR9LdXuqbJc3C3RLoPlDLS4SKjxAfp0SkejjuRqxPqFmSVJF9YbhrB_8gNwqWIEEffS2gUoIU3e4w";
    const results = await request.verifyToken(jwtToken);
    expect(results).toBeFalsy();
  });
});
