import { TestBoxError } from "./error";
import { AdminAuthentication, Dict, ITestBoxTrial, SecretContext, User } from "./payloads";

export default class Trial implements ITestBoxTrial {
  start_url_context: Dict | undefined = undefined;
  secret_context: SecretContext | undefined = undefined;
  trial_users: User[] = [];
  created_at = new Date();
  admin_authentication: AdminAuthentication | undefined = undefined;

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
        throw new TestBoxError("Please set an email before setting a password.")
    }
    return this;
  }

  setSubdomain(subdomain: string): Trial {
    this.start_url_context = {
        ...this.start_url_context,
        subdomain,
    }
    return this;
  }

  setJwtSecret(jwtSecret: string): Trial {
    this.secret_context = {
        ...this.secret_context,
        sso_jwt_secret: jwtSecret,
    };
    return this;
  }

  addUser(user: User): Trial {
    this.trial_users.push(user);
    return this;
  }
}
