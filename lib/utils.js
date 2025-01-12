
import * as core from '@actions/core';

export function dateify(dateish) {

  if (dateish)
    core.notice("YES");
  else
    core.notice("NO");

  dateish = dateish || new Date();

  return dateish;
}