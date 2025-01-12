
import * as core from '@actions/core';

export function dateify(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    core.notice("YES");
    dateish = dateish;
  }

  return dateish;
}