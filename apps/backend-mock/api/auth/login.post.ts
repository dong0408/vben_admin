import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import { MOCK_USERS } from '~/utils/mock-data';
import {
  forbiddenResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default defineEventHandler(async (event) => {
  const { password, username } = await readBody(event);
  // Relaxed validation: Allow empty for "any" request, but usually frontend sends something.
  // We will just proceed.

  let findUser = MOCK_USERS.find(
    (item) => item.username === username && item.password === password,
  );

  // Fallback: If no strict match, use the first mock user (usually admin) but override with provided info if needed
  // or just return the first user to ensure a valid profile is returned.
  if (!findUser) {
    findUser = {
      ...MOCK_USERS[0],
      username: username || 'Admin',
      realName: username || 'Admin',
    };
  }

  const accessToken = generateAccessToken(findUser);
  const refreshToken = generateRefreshToken(findUser);

  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    ...findUser,
    accessToken,
  });
});
