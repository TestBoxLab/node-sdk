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

/**
 * A TestBoxTrial is a data model that represents an account, or trial, in your web application.
 * It contains the information needed to:
 *
 * * Access the trial as an end user
 * * Access the trial programatically (API calls)
 * * Access the trial as an "administrator" user
 *
 * @typeParam StartUrlType - A Type to model the data required to generate a URL to log in to your
 * web application. This data is used as the context for a URL template. As a real-world example,
 * Freshdesk requires two pieces of information in order for their JWT-based SSO to work: a subdomain,
 * and an OIDC identifier. Suppose their template looks something like this:
 *
 * `https://{{ subdomain }}.myfreshworks.com/login/jwt?oidc={{ oidc }}&`
 *
 * This can be strongly typed by providing an interface to StartUrlType, like so:
 *
 * ```typescript
 * interface FreshdeskStartUrl {
 *     subdomain: string;
 *     oidc: number;
 * }
 * ```
 *
 * @typeParam ExtraSecretContextType - Not recommended for use unless advised by a TestBox solutions engineer.
 *
 * @typeParam ExtraAdminType - Not recommended for use unless advised by a TestBox solutions engineer.
 *
 * @typeParam ExtraUserType - Not recommended for use unless advised by a TestBox solutions engineer.
 */
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
  /**
   * Data required to generate the URL that users are taken to when they first
   * access your web application inside TestBox. Generally this is a JWT-based
   * SSO link.
   */
  start_url_context: StartUrlType | undefined = undefined;

  /**
   * The secret context is a strongly-typed dictionary of values that are used
   * for signing JWTs or other needs.
   */
  secret_context: SecretContext<ExtraSecretContextType> | undefined = undefined;

  /**
   * A list of users that are available for TestBox to allocate to testers. It is
   * recommended that each trial come with 5 distinct user accounts, if possible.
   */
  trial_users: User<ExtraUserType>[] = [];

  created_at = new Date();

  /**
   * The admin authentication object serves two purposes:
   *
   * * Storing account credentials for a trial "superuser"
   * * Storing API credentials for the superuser
   *
   * If your product only has a concept of an API key at an "organization" level
   * (i.e. all users within one account use the same API key), that API key should
   * will be set here.
   *
   * We only need API access for one user account. Even if your product allows
   * for each user to have their own API key, we currently do not use API keys
   * in this manner.
   */
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

  /**
   * Set the email address for the "superuser" account.
   *
   * @param email Email address
   * @returns An updated TestBoxTrial
   */
  setEmail(email: string) {
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

  /**
   * Set the password for the "superuser" account.
   *
   * NOTE: only set this value if you use client-side auto-login.
   *
   * @param password The password to use
   * @returns An updated TestBoxTrial
   */
  setPassword(password: string) {
    if (this.admin_authentication) {
      this.admin_authentication.user.password = password;
    } else {
      throw new TestBoxError("Please set an email before setting a password.");
    }
    return this;
  }

  /**
   * A helper method to set the subdomain of your trial account, if necessary.
   *
   * @param subdomain Subdomain of the account
   * @returns An updated TestBoxTrial
   */
  setSubdomain(subdomain: string) {
    this.start_url_context = {
      ...this.start_url_context,
      subdomain,
    };
    return this;
  }

  /**
   * A helper method to set a certain variable in your start URL context.
   *
   * @param key The key of the dictionary item to update
   * @param value The value to update the dictionary item with
   * @returns An updated TestBoxTrial
   */
  setStartUrlValue(key: string, value: string) {
    this.start_url_context = {
      ...this.start_url_context,
      [key]: value,
    };
    return this;
  }

  /**
   * A helper method to set the shared JWT secret required for single sign-on.
   *
   * @param jwtSecret The JWT secret that TestBox should use to sign JWT tokens
   * @returns An updated TestBoxTrial
   */
  setJwtSecret(jwtSecret: string) {
    this.secret_context = {
      ...this.secret_context,
      sso_jwt_secret: jwtSecret,
    };
    return this;
  }

  /**
   * A helper method to set the API key of this trial
   *
   * @param apiKey The API key TestBox should use to ingest data into this trial
   * @returns An updated TestBoxTrial
   */
  setApiKey(apiKey: string) {
    this.admin_authentication = {
      ...this.admin_authentication,
      api_token: apiKey,
    };
    return this;
  }

  /**
   * A helper method to add a user that is available for TestBox to assign
   * to a user testing your product.
   *
   * @param user A User object
   * @returns An updated TestBoxTrial
   */
  addUser(user: User<ExtraUserType>) {
    if (!isUser(user)) {
      throw new TestBoxError(
        "Attempted to add a user that wasn't a valid user"
      );
    }
    this.trial_users.push(user);
    return this;
  }

  /**
   * Validate that the trial meets the minimum requirements for submission
   * to TestBox
   *
   * @returns True if the trial is valid
   */
  validate(): boolean {
    return (
      isAdminAuthentication(this.admin_authentication) &&
      isSecretContext(this.secret_context) &&
      this.trial_users.every((x) => isUser(x)) &&
      this.trial_users.length >= 1
    );
  }
}
