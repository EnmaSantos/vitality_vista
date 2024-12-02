// FILE: controllers/authController.ts

import { RouterContext } from "../deps.ts";
import { signUp, signIn, resetPassword } from "../services/authService.ts";

export const register = async (ctx: RouterContext) => {
  const { email, password } = await ctx.request.body().value;
  const result = await signUp(email, password);
  ctx.response.body = result;
};

export const login = async (ctx: RouterContext) => {
  const { email, password } = await ctx.request.body().value;
  const result = await signIn(email, password);
  ctx.response.body = result;
};

export const forgotPassword = async (ctx: RouterContext) => {
  const { email } = await ctx.request.body().value;
  const result = await resetPassword(email);
  ctx.response.body = result;
};