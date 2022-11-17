import { AdminAuthentication, ITestBoxTrial } from "./payloads";

export default class Trial implements ITestBoxTrial {
  start_url_context = undefined;
  secret_context = undefined;
  trial_users = [];
  created_at = new Date();
  admin_authentication: AdminAuthentication | undefined = undefined;
  private admin_auth: Partial<AdminAuthentication>;

  setEmail(email: string): Trial {
    if (this.admin_authentication) {
      this.admin_authentication.user.email = email;
    } else {
      this.admin_authentication = {
        user: {
          email,
        },
      };
    }
    return this;
  }

  setPassword(password: string): Trial {
    if (this.admin_authentication) {
      this.admin_authentication.user.password = password;
    } else {
      this.admin_authentication = {
        user: {
          password,
        },
      };
    }
    return this;
  }
}
