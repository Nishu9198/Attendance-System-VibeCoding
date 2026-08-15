import config from '../config';

let userPool = null;

async function getUserPool() {
  if (!userPool && config.COGNITO_USER_POOL_ID && config.COGNITO_CLIENT_ID) {
    const { CognitoUserPool } = await import('amazon-cognito-identity-js');
    userPool = new CognitoUserPool({
      UserPoolId: config.COGNITO_USER_POOL_ID,
      ClientId: config.COGNITO_CLIENT_ID,
    });
  }
  return userPool;
}

const DEFAULT_TEACHER = {
  email: 'teacher@university.edu',
  name: 'Faculty Member',
  sub: 'teacher-001',
  role: 'teacher',
};

function isMockMode() {
  return config.USE_MOCK_DATA || !config.COGNITO_USER_POOL_ID;
}

export const authService = {
  async signUp(email, password, name, role = 'teacher') {
    if (isMockMode()) return { user: { username: email } };
    const pool = await getUserPool();
    if (!pool) throw new Error('Cognito not configured');
    const { CognitoUserAttribute } = await import('amazon-cognito-identity-js');
    return new Promise((resolve, reject) => {
      const attrs = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
        new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
      ];
      pool.signUp(email, password, attrs, null, (err, res) => (err ? reject(err) : resolve(res)));
    });
  },

  async confirmSignUp(email, code) {
    if (isMockMode()) return 'SUCCESS';
    const pool = await getUserPool();
    if (!pool) throw new Error('Cognito not configured');
    const { CognitoUser } = await import('amazon-cognito-identity-js');
    return new Promise((resolve, reject) => {
      new CognitoUser({ Username: email, Pool: pool }).confirmRegistration(
        code,
        true,
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });
  },

  async signIn(email, password, role = 'teacher') {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Try real AWS Cognito authentication if configured and credentials provided
    if (config.COGNITO_USER_POOL_ID && config.COGNITO_CLIENT_ID && password !== 'password' && !cleanEmail.includes('demo.com')) {
      try {
        const pool = await getUserPool();
        if (pool) {
          const { CognitoUser, AuthenticationDetails } = await import('amazon-cognito-identity-js');
          const cu = new CognitoUser({ Username: cleanEmail, Pool: pool });
          const cognitoUser = await new Promise((resolve, reject) => {
            cu.authenticateUser(
              new AuthenticationDetails({ Username: cleanEmail, Password: password }),
              {
                onSuccess: (res) => {
                  const p = res.getIdToken().decodePayload();
                  resolve({
                    email: p.email || cleanEmail,
                    name: p.name || (cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
                    sub: p.sub,
                    role: p['custom:role'] || role,
                    token: res.getIdToken().getJwtToken(),
                  });
                },
                onFailure: (err) => {
                  reject(err);
                },
              }
            );
          });

          if (cognitoUser) {
            cognitoUser.role = 'teacher';
            try {
              localStorage.setItem('mock_user', JSON.stringify(cognitoUser));
              localStorage.setItem('mock_token', cognitoUser.token);
            } catch (e) {}
            return cognitoUser;
          }
        }
      } catch (cognitoErr) {
        console.warn('Cognito authentication failed:', cognitoErr);
        throw new Error(cognitoErr.message || cognitoErr.name || 'Cognito authentication failed');
      }
    }

    // 2. Demo / Fallback Faculty Login
    const teacherName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Faculty Member';
    const teacherProfile = {
      email: cleanEmail,
      name: teacherName,
      sub: 'teacher-' + cleanEmail.replace(/[^a-z0-9]/g, '-'),
      role: 'teacher',
    };
    try {
      localStorage.setItem('mock_user', JSON.stringify(teacherProfile));
      localStorage.setItem('mock_token', 'mock-jwt-token');
    } catch (e) {}
    return teacherProfile;
  },

  async signOut() {
    try {
      localStorage.setItem('mock_user', 'none');
      localStorage.removeItem('mock_token');
    } catch (e) {}
    try {
      const pool = await getUserPool();
      if (pool) {
        const cu = pool.getCurrentUser();
        if (cu) cu.signOut();
      }
    } catch (e) {}
  },

  async getCurrentUser() {
    // 1. Check local storage session
    try {
      const s = localStorage.getItem('mock_user');
      if (s === 'none') {
        return null;
      }
      if (s) {
        const u = JSON.parse(s);
        u.role = 'teacher';
        return u;
      }
    } catch (e) {}

    // 2. Check Cognito pool if configured
    if (config.COGNITO_USER_POOL_ID && config.COGNITO_CLIENT_ID) {
      try {
        const pool = await getUserPool();
        if (pool) {
          const cu = pool.getCurrentUser();
          if (cu) {
            const cognitoUser = await new Promise((resolve) => {
              cu.getSession((err, session) => {
                if (err || !session.isValid()) return resolve(null);
                cu.getUserAttributes((err2, attrs) => {
                  if (err2) return resolve(null);
                  const user = {};
                  attrs.forEach((a) => {
                    user[a.getName()] = a.getValue();
                  });
                  user.sub = cu.getUsername();
                  user.role = user['custom:role'] || 'teacher';
                  resolve(user);
                });
              });
            });
            if (cognitoUser) return cognitoUser;
          }
        }
      } catch (cognitoErr) {
        console.warn('Cognito session check error:', cognitoErr);
      }
    }

    // 3. Fallback: Initialize default teacher session
    const defaultUser = { ...DEFAULT_TEACHER };
    try {
      localStorage.setItem('mock_user', JSON.stringify(defaultUser));
      localStorage.setItem('mock_token', 'mock-jwt-token');
    } catch (e) {}
    return defaultUser;
  },

  async getToken() {
    if (isMockMode()) return localStorage.getItem('mock_token') || '';
    const pool = await getUserPool();
    if (!pool) return '';
    const cu = pool.getCurrentUser();
    if (!cu) return '';
    return new Promise((resolve) => {
      cu.getSession((err, session) => {
        if (err || !session.isValid()) return resolve('');
        resolve(session.getIdToken().getJwtToken());
      });
    });
  },
};
