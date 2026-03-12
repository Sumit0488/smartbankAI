'use strict';

/**
 * services/cognito/index.js
 * AWS Cognito service wrapper — admin operations for user pool management.
 * Uses AWS SDK v3 CognitoIdentityProvider client.
 */

const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const { createLogger } = require('../../core/logger');

const logger = createLogger('services:cognito');

const REGION        = process.env.AWS_REGION          || 'ap-south-1';
const USER_POOL_ID  = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID     = process.env.COGNITO_CLIENT_ID    || '';

const client = new CognitoIdentityProviderClient({ region: REGION });

/**
 * Create a user in Cognito User Pool
 * @param {{ email: string, name: string, temporaryPassword?: string, phone?: string, role?: string }} params
 * @returns {Promise<object>} Cognito user object
 */
async function adminCreateUser({ email, name, temporaryPassword, phone, role = 'USER' }) {
  const userAttributes = [
    { Name: 'email',          Value: email },
    { Name: 'name',           Value: name },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'custom:role',    Value: role },
  ];
  if (phone) userAttributes.push({ Name: 'phone_number', Value: phone });

  const command = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    TemporaryPassword: temporaryPassword,
    UserAttributes: userAttributes,
    MessageAction: temporaryPassword ? 'SUPPRESS' : 'RESEND',
  });

  try {
    const result = await client.send(command);
    logger.info('Cognito user created', { email, role });
    return result.User;
  } catch (err) {
    logger.error('Failed to create Cognito user', { email, error: err.message });
    throw err;
  }
}

/**
 * Delete a user from Cognito User Pool
 * @param {string} email
 */
async function adminDeleteUser(email) {
  const command = new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email });
  try {
    await client.send(command);
    logger.info('Cognito user deleted', { email });
  } catch (err) {
    logger.error('Failed to delete Cognito user', { email, error: err.message });
    throw err;
  }
}

/**
 * Update custom attributes for a user
 * @param {string} email
 * @param {Array<{ Name: string, Value: string }>} attributes
 */
async function adminUpdateUserAttributes(email, attributes) {
  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: attributes,
  });
  try {
    await client.send(command);
    logger.info('Cognito user attributes updated', { email });
  } catch (err) {
    logger.error('Failed to update Cognito user attributes', { email, error: err.message });
    throw err;
  }
}

/**
 * Enable a Cognito user account
 * @param {string} email
 */
async function adminEnableUser(email) {
  await client.send(new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
  logger.info('Cognito user enabled', { email });
}

/**
 * Disable (suspend) a Cognito user account
 * @param {string} email
 */
async function adminDisableUser(email) {
  await client.send(new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
  logger.info('Cognito user disabled', { email });
}

/**
 * Get Cognito user details
 * @param {string} email
 * @returns {Promise<object>}
 */
async function adminGetUser(email) {
  const result = await client.send(
    new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
  );
  return result;
}

/**
 * Set a permanent password for a user (bypasses FORCE_CHANGE_PASSWORD)
 * @param {{ email: string, password: string, permanent?: boolean }} params
 */
async function adminSetUserPassword({ email, password, permanent = true }) {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    Password: password,
    Permanent: permanent,
  });
  try {
    await client.send(command);
    logger.info('Cognito user password set', { email, permanent });
  } catch (err) {
    logger.error('Failed to set Cognito user password', { email, error: err.message });
    throw err;
  }
}

/**
 * List users from Cognito User Pool with optional filtering and pagination
 * @param {{ limit?: number, paginationToken?: string, filter?: string }} params
 * @returns {Promise<{ users: object[], nextToken: string | undefined }>}
 */
async function listUsers({ limit = 60, paginationToken, filter } = {}) {
  const command = new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Limit: limit,
    ...(paginationToken ? { PaginationToken: paginationToken } : {}),
    ...(filter ? { Filter: filter } : {}),
  });

  try {
    const result = await client.send(command);
    logger.info('Cognito users listed', { count: result.Users?.length });
    return { users: result.Users || [], nextToken: result.PaginationToken };
  } catch (err) {
    logger.error('Failed to list Cognito users', { error: err.message });
    throw err;
  }
}

module.exports = {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUserAttributes,
  adminEnableUser,
  adminDisableUser,
  adminGetUser,
  adminSetUserPassword,
  listUsers,
  USER_POOL_ID,
  CLIENT_ID,
};
