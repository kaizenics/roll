import type { CSSProperties } from "react";

/**
 * Splits text into words that come into focus one after another as the
 * heading scrolls into view (see .blur-word in globals.css). Screen readers
 * get the plain sentence.
 */
export function BlurText({ text, offset = 0 }: { text: string; offset?: number }) {
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            <span className="blur-word" style={{ "--i": offset + i } as CSSProperties}>
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </>
  );
}
