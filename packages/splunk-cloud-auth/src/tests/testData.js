const tokens = {};

export default tokens;

tokens.clientId = '0oajhsdnegG6pgNoU0h7';

tokens.authorizeUrl = 'https://auth.scp.splunk.com/authorize';

tokens.accessToken =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOjEsImp0aSI6I' +
    'kFULjhQdm8yMzdmTVNJZ281am01VWpqeF9vV25yRkFRWFMzMk03Rklnal9' +
    'IRW8iLCJpc3MiOiJodHRwczovL2Rldi01NDQ2NTIub2t0YXByZXZpZXcuY' +
    '29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsIml' +
    'hdCI6MTU1MzAzOTkyOSwiZXhwIjoxNTUzMTA1ODg2LCJjaWQiOiIwb2Fqa' +
    'HNkbmVnRzZwZ05vVTBoNyIsInVpZCI6IjAwdWo3NTNnNWtjTUFhNWhVMGg' +
    '3Iiwic2NwIjpbIm9wZW5pZCIsImVtYWlsIiwicHJvZmlsZSJdLCJzdWIiO' +
    'iJtZmh1YW5nQHRlc3QuY29tIn0.SD_s4Yu7UbrWdBqE066N_q_9BZ3to-V' +
    'SCSM0aKL6fMQ';

tokens.accessTokenParsed = {
    accessToken: tokens.accessToken,
    authorizeUrl: tokens.authorizeUrl,
    expiresAt: 1742425555,
    scopes: ['openid', 'email', 'profile'],
    tokenType: 'Bearer',
};

tokens.idToken =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMHVqMnd6bzE' +
    '2U1JvcENXWjBoNyIsIm5hbWUiOiJvbmUgdGVzdHVzZXIiLCJlbWFpbCI6Im9' +
    'uZUB0ZXN0LmNvbSIsInZlciI6MSwiaXNzIjoiaHR0cHM6Ly9kZXYtNTQ0NjU' +
    'yLm9rdGFwcmV2aWV3LmNvbS9vYXV0aDIvZGVmYXVsdCIsImF1ZCI6IjBvYWp' +
    'oc2RuZWdHNnBnTm9VMGg3IiwiaWF0IjoxNTUzMDM1MDc5LCJleHAiOjE5MDk' +
    'wOTQ0MDAsImp0aSI6IklELklsS3IwM2JULW9ZajZKOGF4VURvYnpUdkdsV1M' +
    '1VUdNaGpSeVlOZlBLajAiLCJhbXIiOlsicHdkIl0sImlkcCI6IjAwb2oyd3p' +
    'udHhESlRsM0ZXMGg3Iiwibm9uY2UiOiJvRGs0Rmtha2ZJeTJuRGU1YTAyZFE' +
    '2cjR6bjJXblViQUoyRkdaMm43MXBzN1hSRTVSd1FmNGJMamJRanhoSkNpIiw' +
    'icHJlZmVycmVkX3VzZXJuYW1lIjoib25lQHRlc3QuY29tIiwiYXV0aF90aW1' +
    'lIjoxNTUzMDM1MDc4LCJhdF9oYXNoIjoiOEJ3UGR0LTFBN3k2RmFNVVk1bUp' +
    'OdyJ9.vd--Mr9AIoExL6hmStNa2eGN2Yju5WEJ2L2-3-a_jVE';

tokens.idTokenBad =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiO' +
    'iIwMHVqMnd6bzE2U1JvcENXWjBoNyIsIm5hbWUiOiJvbmUgdGVzdHVzZXIi' +
    'LCJlbWFpbCI6Im9uZUB0ZXN0LmNvbSIsInZlciI6MSwiaXNzIjoiaHR0cHM' +
    '6Ly9kZXYtNTQ0NjUyLm9rdGFwcmV2aWV3LmNvbS9vYXV0aDIvZGVmYXVsdC' +
    'IsImF1ZCI6IjBvYWpoc2RuZWdHNnBnTm9VMGg3IiwiaWF0IjoxNTUzMDM1M' +
    'Dc5LCJleHAiOjE1NTMxMjA3NzMsImp0aSI6IklELklsS3IwM2JULW9ZajZK' +
    'OGF4VURvYnpUdkdsV1M1VUdNaGpSeVlOZlBLajAiLCJhbXIiOlsicHdkIl0' +
    'sImlkcCI6IjAwb2oyd3pudHhESlRsM0ZXMGg3Iiwibm9uY2UiOiJvRGs0Rm' +
    'tha2ZJeTJuRGU1YTAyZFE2cjR6bjJXblViQUoyRkdaMm43MXBzN1hSRTVSd' +
    '1FmNGJMamJRanhoSkNpIiwicHJlZmVycmVkX3VzZXJuYW1lIjoib25lQHRl' +
    'c3QuY29tIiwiYXV0aF90aW1lIjoxNTUzMDM1MDc4LCJhdF9oYXNoIjoiOEJ' +
    '3UGR0LTFBN3k2RmFNVVk1bUpOdyJ9.vd--Mr9AIoExL6hmStNa2eGN2Yju5' +
    'WEJ2L2-3-a_jVE';

tokens.idTokenParsed = {
    idToken: tokens.idToken,
    claims: {
        sub: '00uj753g5kcMAa5hU0h7',
        name: 'one testuser',
        given_name: 'one',
        family_name: 'tetuser',
        updated_at: 1446153401,
        email: 'one@test.com',
        email_verified: true,
        ver: 1,
        iss: 'https://api.scp.splunk.com/system/identity/v2beta1/authorize',
        login: 'test@splunk.com',
        nonce: 'oDk4FkakfIy2nDe5a02dQ6r4zn2WnUbAJ2FGZ2n71ps7XRE5RwQf4bLjbQjxhJCi',
        aud: tokens.clientId,
        iat: 1553031882,
        exp: 2242425555,
        amr: ['pwd'],
        jti: 'ID.7uvMUdOzibTjjCyFe1h8LylJJp77uDEXgDyKG_qYV-8',
        auth_time: 1553031881,
    },
    expiresAt: 2242425555,
    scopes: ['openid', 'email', 'profile'],
    authorizeUrl: 'https://api.scp.splunk.com/system/identity/v2beta1/authorize',
    issuer: 'https://api.scp.splunk.com/system/identity/v2beta1/authorize',
    clientId: tokens.clientId,
};

tokens.idTokenInvalid = {
    idToken: tokens.idTokenBad,
    claims: {
        sub: '00uj753g5kcMAa5hU0h7',
        name: 'one testuser',
        given_name: 'one',
        family_name: 'tetuser',
        updated_at: 1446153401,
        email: 'one@test.com',
        email_verified: true,
        ver: 1,
        iss: tokens.authorizeUrl,
        login: 'test@splunk.com',
        nonce: 'rLVALvAUiyXR4feNvzU0AAyQuxueOFzgrkDif4ZLqV1N9N404pcwWuQGSq4OnhbM',
        aud: tokens.clientId,
        iat: 1553031882,
        exp: 1553035482,
        amr: ['pwd'],
        jti: 'ID.7uvMUdOzibTjjCyFe1h8LylJJp77uDEXgDyKG_qYV-8',
        auth_time: 1553031881,
    },
    expiresAt: 1553035482,
    scopes: ['openid', 'email', 'profile'],
    authorizeUrl: tokens.authorizeUrl,
    issuer: tokens.authorizeUrl,
    clientId: tokens.clientId,
};

tokens.redirectOAuthParams = {
    responseType: 'id_token',
    state: 'XOR6wwQRB0LBqpfKRP6Dpf3pEfnhTLUQwl3SduatFu17Iuq1ByIv8zkIgd55W8DU',
    nonce: 'oDk4FkakfIy2nDe5a02dQ6r4zn2WnUbAJ2FGZ2n71ps7XRE5RwQf4bLjbQjxhJCi',
    scopes: ['openid', 'email', 'profile'],
    clientId: tokens.clientId,
    urls: {
        issuer: tokens.authorizeUrl,
        authorizeUrl: tokens.authorizeUrl,
    },
};
