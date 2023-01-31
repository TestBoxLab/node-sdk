import {
  isTestBoxAuthenticatedRequest,
  ITestBoxAuthenticatedRequest,
} from "./payloads";
import { TestBoxError } from "./error";
import { verifyAuthenticationToken } from "./auth";
import { getConfigItem } from "./config";

export default class TestBoxAuthenticatedRequest
  implements ITestBoxAuthenticatedRequest
{
  version: 1;
  trial_id: string;
  initialized: boolean = false;

  private hasVerifiedAuth: boolean = false;
  protected authToken: string;

  constructor(payload?: ITestBoxAuthenticatedRequest) {
    // The constructor only checks that the contract between the SDK and TestBox
    // is being upheld. It does not check for authorization/authentication,
    // as this is done async.
    if (isTestBoxAuthenticatedRequest(payload)) {
      this.version = payload.version;
      this.trial_id = payload.trial_id;
      this.initialized = true;
    }
  }

  async verifyToken(authToken: string): Promise<boolean> {
    const results = await verifyAuthenticationToken(
      authToken,
      this.trial_id,
      getConfigItem("productId")
    );
    if (results) {
      this.hasVerifiedAuth = true;
      this.authToken = authToken;
    }
    return results;
  }

  throwIfAuthNotValidated() {
    if (!this.initialized) {
      throw new TestBoxError("TrialRequest must be initialized!");
    }
    if (!this.hasVerifiedAuth) {
      throw new TestBoxError(
        "You did not verify the JWT of the trial request before fulfilling it."
      );
    }
  }
}
