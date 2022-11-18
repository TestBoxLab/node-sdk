import axios from "axios";
import jose from "jose";

// On application start, cache the TestBox public keys
let publicKeys: Record<string, string> | undefined;

(async () => {
  const domain = process.env.TBX_DOMAIN || "trials.testbox.com";
  const keys = await axios.get<Record<string, string>>(
    `https://${domain}/.well-known/keys`
  );
  publicKeys = keys.data;
})();

export async function verifyAuthenticationToken(
  token: string,
  trialId: string
): Promise<boolean> {
  const kid = jose.UnsecuredJWT.decode(token).header.kid;
  if (!kid || !publicKeys) {
    return false;
  }
  const publicKey = publicKeys[kid];
  if (!publicKey) {
    return false;
  }
  const results = await jose.jwtVerify(
    token,
    new TextEncoder().encode(publicKey)
  );
  return results.payload.trial_id == trialId;
}
