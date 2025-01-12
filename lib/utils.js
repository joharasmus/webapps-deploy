
import * as core from '@actions/core';
import normalizePath from "normalize-path";

export function dateify(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === "string") {
    dateish = new Date(dateish);
  } else {
    dateish = new Date();
  }

  return dateish;
}

export function sanitizePath(filepath) {
  core.notice(filepath);
  return normalizePath(filepath, false)
    .replace(/^\w+:/, "")
    .replace(/^(\.\.\/|\/)+/, "");
}
