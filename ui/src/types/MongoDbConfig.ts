/**
 * Configuration of Mongo Express container.
 */
export type MongoDbConfig = {
  /**
   * Hostname of MongoDB server.
   * @type {string}
   * @property hostname
   * @default localhost
   * @example
   * "localhost" | "127.0.0.1"
   */
  hostname?: string;

  /**
   * Port of MongoDB server.
   * @type {number}
   * @property port
   * @default 27017
   * @example
   * 27017
   */
  port?: number;

  /**
   * Authentication username.
   * @type {string}
   * @property username
   * @default null
   * @example
   * "root"
   */
  username?: string;

  /**
   * Authentication password.
   * @type {string}
   * @property password
   * @default null
   * @example
   * "root"
   */
  password?: string;

  /**
   * Connection string of MongoDB server.
   * @type {string}
   * @property connectionString
   * @default mongodb://localhost:27017
   * @example
   * "mongodb://localhost:27017"
   */
  connectionString?: string;

  /**
   * Remember credentials.
   * @type {boolean}
   * @property rememberCredentials
   * @default false
   * @example
   * "true" | "false"
   */
  rememberCredentials?: boolean;

  /**
   * Authentication method.
   * @type {string}
   * @property authMethod
   * @default basic
   * @example
   * "basic" | "connectionString"
   */
  authMethod?: string;
}
