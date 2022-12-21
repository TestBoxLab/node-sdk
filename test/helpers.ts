import fs from "fs";
import path from "path";
import nock from "nock";

export const nockJwks = async () => {
  await new Promise<void>((resolve) => {
    const filePath = path.dirname(__filename) + "/fixtures/jwks";
    fs.readFile(filePath, (err, data) => {
      const contents = data.toString("utf-8");
      nock(
        process.env.TBX_JWKS_URL ||
          "https://dukuoou025q3p.cloudfront.net"
      )
        .get("/.well-known/jwks.json")
        .reply(200, contents, {
          "Content-Type": "application/json",
        });
      resolve();
    });
  });
};
