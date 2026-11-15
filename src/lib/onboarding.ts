"use client";

/**
 * Whether the user has been through (or deliberately skipped) the welcome
 * screen. Kept in the browser, not the database: it only decides where to send
 * someone on this device, and a lost flag costs them one skippable screen.
 */
const KEY = "cf_onboarded";

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode: they simply see the screen again */
  }
}
