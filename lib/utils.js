
import * as core from '@actions/core';

export function dateify(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    dateish = dateish;
  } else{  // likely a string
    core.notice("YES");
    dateish = new Date(dateish);
  }

  return dateish;
}