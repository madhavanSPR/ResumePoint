import type { CapturedPosition } from "../types/checkpoint";
import { captureAnchor } from "./find-anchor";

export function capturePosition(win: Window = window): CapturedPosition {
  const doc = win.document;
  return {
    url: win.location.href,
    title: doc.title || win.location.href,
    scrollX: win.scrollX,
    scrollY: win.scrollY,
    documentHeight: doc.documentElement.scrollHeight,
    anchor: captureAnchor(doc, {
      width: win.innerWidth,
      height: win.innerHeight,
      scrollX: win.scrollX,
      scrollY: win.scrollY,
    }),
  };
}
