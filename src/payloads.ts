import { hasAllKeysInObject, onlyValidKeysInObject } from "./typeHelpers";

const isString = (x) => typeof x === "string";

/**
 * The TestBoxAuthenticatedRequest interface is a base class for the other requests
 */
export interface ITestBoxAuthenticatedRequest {
  version: 1;
  trial_id: string;
}

export function isTestBoxAuthenticatedRequest(
  obj: unknown
): obj is ITestBoxTrialRequest {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const requiredKeys = new Set(["version", "trial_id"]);
  if (!hasAllKeysInObject(obj, requiredKeys)) {
    return false;
  }

  if (obj["version"] !== 1) {
    // Currently TestBox only has v1 requests
    return false;
  }

  // As long as everything else is a string, this should be okay. We can iterate
  // on this further in the future to verify that trial_id is a guid and that
  // success_url and failure_url are actually URLs.
  return isString(obj["trial_id"]);
}

/**
 * The TestBoxTrialRequest interface is used to parse a request from TestBox
 * for a new trial.
 */
export interface ITestBoxTrialRequest {
  version: 1;
  trial_id: string;
  success_url: string;
  failure_url: string;
}

export function isTestBoxTrialRequest(
  obj: unknown
): obj is ITestBoxTrialRequest {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const requiredKeys = new Set([
    "version",
    "trial_id",
    "success_url",
    "failure_url",
  ]);
  if (
    !hasAllKeysInObject(obj, requiredKeys) ||
    !onlyValidKeysInObject(obj, requiredKeys)
  ) {
    return false;
  }

  if (obj["version"] !== 1) {
    // Currently TestBox only has v1 requests
    return false;
  }

  // As long as everything else is a string, this should be okay. We can iterate
  // on this further in the future to verify that trial_id is a guid and that
  // success_url and failure_url are actually URLs.
  return [obj["trial_id"], obj["success_url"], obj["failure_url"]].every(
    isString
  );
}

// TODO: want to automatically generate these interfaces from schemas
export type Dict = { [x: string]: string | number | Dict | boolean };

export interface User<T = Dict> {
  email: string;
  password?: string;
  totp_token?: string;
  extras?: T;
}

export function isUser<T>(
  user: unknown,
  guards?: TestBoxGuardProps<any, any, any, T>
): user is User<T> {
  if (typeof user !== "object" || user === null) {
    return false;
  }

  const allowedKeys = new Set(["email", "password", "totp_token", "extras"]);
  if (!onlyValidKeysInObject(user, allowedKeys)) {
    return false;
  }

  if (!("email" in user)) {
    return false;
  }

  if (guards?.userExtrasGuard && "extras" in user) {
    return guards.userExtrasGuard((user as User<T>).extras);
  }

  return true;
}

export interface SecretContext<T = Dict> {
  sso_jwt_secret?: string;
  extras?: T;
}

export function isSecretContext<T>(
  context: unknown,
  extrasGuard?: (y: unknown) => y is T
): context is SecretContext<T> {
  if (typeof context === "undefined" || context === null) {
    return true;
  }

  if (typeof context !== "object") {
    return false;
  }

  const allowedKeys = new Set(["sso_jwt_secret", "extras"]);
  if (!onlyValidKeysInObject(context, allowedKeys)) {
    return false;
  }

  if (
    "sso_jwt_secret" in context &&
    typeof context["sso_jwt_secret"] !== "string"
  ) {
    return false;
  }

  if (extrasGuard && "extras" in context) {
    return extrasGuard((context as SecretContext<T>).extras);
  }

  return true;
}

export interface AdminAuthentication<AdminExtras = Dict, UserExtras = Dict> {
  api_token?: string;
  user: User<UserExtras>;
  extras?: AdminExtras | undefined;
}

export function isAdminAuthentication<AdminExtras, UserExtras>(
  adminAuth: unknown,
  guards?: TestBoxGuardProps<any, any, AdminExtras, UserExtras>
): adminAuth is AdminAuthentication<AdminExtras, UserExtras> {
  if (typeof adminAuth !== "object" || adminAuth === null) {
    return false;
  }

  const allowedKeys = new Set(["api_token", "user", "extras"]);
  if (!onlyValidKeysInObject(adminAuth, allowedKeys)) {
    return false;
  }

  if ("api_token" in adminAuth && typeof adminAuth["api_token"] !== "string") {
    return false;
  }

  if (!("user" in adminAuth)) {
    return false;
  }

  if (!isUser(adminAuth["user"], guards)) {
    return false;
  }

  if (guards?.adminExtrasGuard && "extras" in adminAuth) {
    return guards.adminExtrasGuard(
      (adminAuth as AdminAuthentication<AdminExtras, UserExtras>).extras
    );
  }

  return true;
}

/**
 * {@inheritDoc TestBoxTrial}
 */
export interface ITestBoxTrial<
  StartUrlContext = Dict,
  SecretExtras = Dict,
  AdminExtras = Dict,
  UserExtras = Dict
> {
  /**
   * {@inheritDoc TestBoxTrial.start_url_context}
   */
  start_url_context?: StartUrlContext | undefined;
  /**
   * {@inheritDoc TestBoxTrial.secret_context}
   */
  secret_context?: SecretContext<SecretExtras> | undefined;
  /**
   * {@inheritDoc TestBoxTrial.admin_authentication}
   */
  admin_authentication:
    | AdminAuthentication<AdminExtras, UserExtras>
    | undefined;
  /**
   * {@inheritDoc TestBoxTrial.trial_users}
   */
  trial_users: User<UserExtras>[];
  /**
   * {@inheritDoc TestBoxTrial.created_at}
   */
  created_at: Date;
}

export interface TestBoxGuardProps<
  StartUrlContext,
  SecretExtras,
  AdminExtras,
  UserExtras
> {
  startUrlGuard?: (x: unknown) => x is StartUrlContext;
  secretExtrasGuard?: (x: unknown) => x is SecretExtras;
  adminExtrasGuard?: (x: unknown) => x is AdminExtras;
  userExtrasGuard?: (x: unknown) => x is UserExtras;
}

export function isTestBoxTrial<
  StartUrlContext,
  SecretExtras,
  AdminExtras,
  UserExtras
>(
  trial: unknown,
  guards?: TestBoxGuardProps<
    StartUrlContext,
    SecretContext,
    AdminExtras,
    UserExtras
  >
): trial is ITestBoxTrial<
  StartUrlContext,
  SecretExtras,
  AdminExtras,
  UserExtras
> {
  // Any primitives are immediately not TestBox trials
  if (typeof trial !== "object" || trial === null) {
    return false;
  }

  // Check to make sure we only have allowable keys
  const allowedKeys = new Set([
    "start_url_context",
    "secret_context",
    "admin_authentication",
    "trial_users",
    "created_at",
  ]);
  if (!onlyValidKeysInObject(trial, allowedKeys)) {
    return false;
  }

  // Must have admin_authentication and trial_users
  if (!("admin_authentication" in trial && "trial_users" in trial)) {
    return false;
  }

  // At this point, we now definitely have an admin_authentication and a trial_users key, but they are unchecked
  if (!isAdminAuthentication(trial["admin_authentication"], guards)) {
    return false;
  }

  if (!Array.isArray(trial["trial_users"])) {
    return false;
  }

  // We've now narrowed trial_users to an array
  if (!trial["trial_users"].every((user) => isUser(user, guards))) {
    return false;
  }

  return true;
}

export enum UseCaseType {
  CUSTOMER_SUPPORT_TICKET_TAGGING = "customer-support-ticket-tagging",
  CUSTOMER_SUPPORT_CANNED_RESPONSES = "customer-support-canned-responses",
}

/**
 * The TestBoxUseCaseRequest interface is used to parse a request from TestBox
 * for a use case url.
 */
export interface ITestBoxUseCaseRequest {
  version: 1;
  trial_id: string;
  use_case_type: UseCaseType;
  trial_data: ITestBoxTrial;
  success_url: string;
  failure_url: string;
}

export function isTestBoxUseCaseRequest(
  obj: unknown
): obj is ITestBoxUseCaseRequest {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const requiredKeys = new Set([
    "version",
    "trial_id",
    "use_case_type",
    "trial_data",
    "success_url",
    "failure_url",
  ]);

  if (
    !hasAllKeysInObject(obj, requiredKeys) ||
    !onlyValidKeysInObject(obj, requiredKeys)
  ) {
    return false;
  }

  if (obj["version"] !== 1) {
    // Currently TestBox only has v1 requests
    return false;
  }

  // As long as everything else is a string, this should be okay. We can iterate
  // on this further in the future to verify that trial_id is a guid and that
  // success_url and failure_url are actually URLs.
  return (
    [obj["use_case_type"], obj["success_url"], obj["failure_url"]].every(
      isString
    ) && isTestBoxTrial(obj["trial_data"])
  );
}

/**
 * The TestBoxBulkUseCaseRequest interface is used to parse a request from TestBox
 * for multiple use case urls.
 */
export interface ITestBoxBulkUseCaseRequest {
  version: 1;
  trial_id: string;
  use_case_types: UseCaseType[];
  trial_data: ITestBoxTrial;
  success_url: string;
  failure_url: string;
}

export function isTestBoxBulkUseCaseRequest(
  obj: unknown
): obj is ITestBoxBulkUseCaseRequest {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const requiredKeys = new Set([
    "version",
    "use_case_types",
    "trial_id",
    "trial_data",
    "success_url",
    "failure_url",
  ]);
  if (
    !hasAllKeysInObject(obj, requiredKeys) ||
    !onlyValidKeysInObject(obj, requiredKeys)
  ) {
    return false;
  }

  if (obj["version"] !== 1) {
    // Currently TestBox only has v1 requests
    return false;
  }

  // As long as everything else is a string, this should be okay. We can iterate
  // on this further in the future to verify that trial_id is a guid and that
  // success_url and failure_url are actually URLs.
  return (
    obj["use_case_types"].every(isString) &&
    [(obj["success_url"], obj["failure_url"])].every(isString) &&
    isTestBoxTrial(obj["trial_data"])
  );
}
