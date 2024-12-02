// FILE: services/authService.ts

import { SuperTokens } from "../deps.ts";

export const signUp = async (email: string, password: string) => {
  const result = await SuperTokens.signUp(email, password);
  return result;
};

export const signIn = async (email: string, password: string) => {
  const result = await SuperTokens.signIn(email, password);
  return result;
};

export const resetPassword = async (email: string) => {
  const result = await SuperTokens.resetPassword(email);
  return result;
};