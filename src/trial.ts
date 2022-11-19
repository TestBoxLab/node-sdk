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

export default class TestBoxTrial<
  StartUrlType = Dict,
  ExtraSecretContextType = Dict,
  ExtraAdminType = Dict,
  ExtraUserType = Dict
> implements
    ITestBoxTrial<
      StartUrlType,
      ExtraSecretContextType,
      ExtraAdminType,
      ExtraUserType
    >
{
  start_url_context: StartUrlType | undefined = undefined;
  secret_context: SecretContext<ExtraSecretContextType> | undefined = undefined;
  trial_users: User<ExtraUserType>[] = [];
  created_at = new Date();
  admin_authentication:
    | AdminAuthentication<ExtraAdminType, ExtraUserType>
    | undefined = undefined;

  constructor(
    baseValues?: ITestBoxTrial<
      StartUrlType,
      ExtraSecretContextType,
      ExtraAdminType,
      ExtraUserType
    >
  ) {
    if (baseValues) {
      this.start_url_context = baseValues.start_url_context;
      this.secret_context = baseValues.secret_context;
      this.trial_users = baseValues.trial_users;
      this.created_at = baseValues.created_at;
      this.admin_authentication = baseValues.admin_authentication;
    }
  }

  setEmail(email: string): typeof this {
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

  setPassword(password: string): typeof this {
    if (this.admin_authentication) {
      this.admin_authentication.user.password = password;
    } else {
      throw new TestBoxError("Please set an email before setting a password.");
    }
    return this;
  }

  setSubdomain(subdomain: string): typeof this {
    this.start_url_context = {
      ...this.start_url_context,
      subdomain,
    };
    return this;
  }

  setStartUrlValue(key: string, value: string): typeof this {
    this.start_url_context = {
      ...this.start_url_context,
      [key]: value,
    };
    return this;
  }

  setJwtSecret(jwtSecret: string): typeof this {
    this.secret_context = {
      ...this.secret_context,
      sso_jwt_secret: jwtSecret,
    };
    return this;
  }

  addUser(user: User<ExtraUserType>): typeof this {
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
