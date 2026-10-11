import { customAlphabet } from "nanoid";
import { SHORT_ID_ALPHABET, SHORT_ID_LENGTH } from "@roll/shared";

/** 10-char URL-safe id used in share links (`/v/<shortId>`). */
export const generateShortId: () => string = customAlphabet(SHORT_ID_ALPHABET, SHORT_ID_LENGTH);
