
import * as core from '@actions/core';

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