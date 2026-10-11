import { EXTENSION_CONNECT_PATH } from "@roll/shared";

export const APP_URL = (import.meta.env.WXT_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
export const APP_ORIGIN = new URL(APP_URL).origin;
export const CONNECT_URL = `${APP_URL}${EXTENSION_CONNECT_PATH}`;
export const DASHBOARD_URL = `${APP_URL}/dashboard`;
