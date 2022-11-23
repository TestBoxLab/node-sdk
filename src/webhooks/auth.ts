import axios from "axios";
import * as jose from "jose";

let publicKeys: Record<string, string> | undefined;

async function loadPublicKeys() {
  const domain = process.env.TBX_DOMAIN || "trials.testbox.com";
  const keys = await axios.get<Record<string, string>>(
    `https://${domain}/.well-known/keys`
  );
  publicKeys = keys.data;
}

export async function verifyAuthenticationToken(
  token: string,
  trialId: string,
  audienceClaim: string
): Promise<boolean> {
  if (!publicKeys) {
    await loadPublicKeys();
  }
  const kid = jose.decodeProtectedHeader(token).kid;
  if (!kid || !publicKeys) {
    return false;
  }
  const publicKey = publicKeys[kid];
  if (!publicKey) {
    return false;
  }
  try {
    const importedKey = await jose.importSPKI(publicKey, "RS256");
    const results = await jose.jwtVerify(token, importedKey, {
      audience: audienceClaim,
    });
    return results.payload.trial_id == trialId;
  } catch (exc) {
    // TODO: logging
    return false;
  }
}
