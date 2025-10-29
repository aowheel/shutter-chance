require("dotenv").config();
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");

const authenticationData = {
  Username: process.env.USERNAME,
  Password: process.env.PASSWORD,
};
const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
  authenticationData,
);
const poolData = {
  UserPoolId: process.env.USER_POOL_ID,
  ClientId: process.env.APP_CLIENT_ID,
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const userData = {
  Username: authenticationData.Username,
  Pool: userPool,
};
const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
cognitoUser.authenticateUser(authenticationDetails, {
  onSuccess: async (result) => {
    const accessToken = result.getAccessToken().getJwtToken();

    const idToken = result.getIdToken().getJwtToken();

    const res = await fetch(`${process.env.ORION_ENDPOINT}/v2`, {
      headers: {
        Authorization: idToken,
      },
    });
    const body = await res.json();
    console.log(body);
  },

  onFailure: (err) => {
    console.error(err);
  },
});
