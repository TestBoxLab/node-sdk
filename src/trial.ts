import { TestBoxError } from "./error";
import {
  AdminAuthentication,
  Dict,
  isAdminAuthentication,
  isSecretContext,
  isUser,
  ITestBoxTrial,
  SecretContext,
  User,
} from "./payloads";

export default class TestBoxTrial implements ITestBoxTrial {
  start_url_context: Dict | undefined = undefined;
  secret_context: SecretContext | undefined = undefined;
  trial_users: User[] = [];
  created_at = new Date();
  admin_authentication: AdminAuthentication | undefined = undefined;

  setEmail(email: string): TestBoxTrial {
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

  setPassword(password: string): TestBoxTrial {
    if (this.admin_authentication) {
      this.admin_authentication.user.password = password;
    } else {
      throw new TestBoxError("Please set an email before setting a password.");
    }
    return this;
  }

  setSubdomain(subdomain: string): TestBoxTrial {
    this.start_url_context = {
      ...this.start_url_context,
      subdomain,
    };
    return this;
  }

  setJwtSecret(jwtSecret: string): TestBoxTrial {
    this.secret_context = {
      ...this.secret_context,
      sso_jwt_secret: jwtSecret,
    };
    return this;
  }

  addUser(user: User): TestBoxTrial {
    this.trial_users.push(user);
    return this;
  }

  validate(): boolean {
    return (
      isAdminAuthentication(this.admin_authentication) &&
      isSecretContext(this.secret_context) &&
      this.trial_users.every((x) => isUser(x)) &&
      this.trial_users.length >= 1
    );
  }
}
