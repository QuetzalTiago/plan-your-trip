import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID || "";
const CLIENT_ID = import.meta.env.VITE_USER_POOL_CLIENT_ID || "";

const poolData = {
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
};

export const userPool = new CognitoUserPool(poolData);

export interface SignUpParams {
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Sign up a new user
 */
export function signUp(params: SignUpParams): Promise<{ userSub: string }> {
  const { email, password } = params;

  const attributeList = [
    new CognitoUserAttribute({
      Name: "email",
      Value: email,
    }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (!result) {
        reject(new Error("No result from sign up"));
        return;
      }
      resolve({ userSub: result.userSub });
    });
  });
}

/**
 * Confirm sign up with verification code
 */
export function confirmSignUp(email: string, code: string): Promise<void> {
  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Sign in with email and password
 */
export function signIn(params: SignInParams): Promise<AuthResult> {
  const { email, password } = params;

  const authenticationDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve({
          idToken: result.getIdToken().getJwtToken(),
          accessToken: result.getAccessToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Get current authenticated user session
 */
export function getCurrentSession(): Promise<AuthResult | null> {
  const cognitoUser = userPool.getCurrentUser();

  if (!cognitoUser) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      resolve({
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
}

/**
 * Get current user's email from token
 */
export function getCurrentUserEmail(): Promise<string | null> {
  const cognitoUser = userPool.getCurrentUser();

  if (!cognitoUser) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err || !attributes) {
          resolve(null);
          return;
        }

        const emailAttr = attributes.find((attr) => attr.Name === "email");
        resolve(emailAttr ? emailAttr.Value : null);
      });
    });
  });
}

/**
 * Sign out current user
 */
export function signOut(): Promise<void> {
  const cognitoUser = userPool.getCurrentUser();

  if (cognitoUser) {
    cognitoUser.signOut();
  }

  return Promise.resolve();
}

/**
 * Resend confirmation code
 */
export function resendConfirmationCode(email: string): Promise<void> {
  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Initiate forgot password flow
 */
export function forgotPassword(email: string): Promise<void> {
  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Confirm new password with verification code
 */
export function confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}
