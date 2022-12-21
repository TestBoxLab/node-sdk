import * as jose from "jose";

export async function verifyAuthenticationToken(
  token: string,
  trialId: string,
  audienceClaim: string
): Promise<boolean> {
  try {
    const publicKey = jose.createRemoteJWKSet(
      new URL(
        process.env.TBX_JWKS_URL ||
          "https://dukuoou025q3p.cloudfront.net/.well-known/jwks.json"
      )
    );
    const results = await jose.jwtVerify(token, publicKey, {
      audience: audienceClaim,
    });
    return results.payload.trial_id == trialId;
  } catch (exc) {
    // TODO: logging
    return false;
  }
}
