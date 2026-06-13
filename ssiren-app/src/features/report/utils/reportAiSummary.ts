import type { ReportContents } from '../types/myReport';

const HANGUL = '\\uAC00-\\uD7A3';
const ADDRESS_OR_TIME = new RegExp(
  [
    '\\d{4}[-.\\uB144]\\s?\\d{1,2}[-.\\uC6D4]\\s?\\d{1,2}',
    '\\d{1,2}:\\d{2}',
    `(?:[${HANGUL}]+)(?:\\uC2DC|\\uAD70|\\uAD6C|\\uC74D|\\uBA74|\\uB3D9|\\uB9AC)`,
    `(?:[${HANGUL}0-9-]+)(?:\\uB85C|\\uAE38|\\uBC88\\uAE38)\\s*\\d*(?:-\\d+)?`,
    '\\uC778\\uADFC',
    '\\uBD80\\uADFC',
    '\\uC8FC\\uBCC0',
    '\\uC77C\\uB300',
    '\\uADFC\\uCC98',
  ].join('|')
);
const LEADING_META = new RegExp(
  `^(?:[${HANGUL}]+(?:\\uD2B9\\uBCC4\\uC2DC|\\uAD11\\uC5ED\\uC2DC|\\uC790\\uCE58\\uC2DC|\\uC790\\uCE58\\uB3C4|\\uB3C4|\\uC2DC|\\uAD70|\\uAD6C|\\uC74D|\\uBA74|\\uB3D9|\\uB9AC)\\s*){0,6}(?:[${HANGUL}0-9-]+(?:\\uB85C|\\uAE38|\\uBC88\\uAE38)\\s*\\d*(?:-\\d+)?\\s*)?(?:\\uC778\\uADFC|\\uBD80\\uADFC|\\uC8FC\\uBCC0|\\uC77C\\uB300|\\uC55E|\\uADFC\\uCC98)?\\uC5D0?\\s*`
);

function normalize(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function removeLeadingMeta(value: string) {
  return normalize(value)
    .replace(LEADING_META, '')
    .replace(/^\d{4}[-.\uB144]\s?\d{1,2}[-.\uC6D4]\s?\d{1,2}[^,.\s]*\s*/, '')
    .trim();
}

function hasMeta(value: string) {
  return ADDRESS_OR_TIME.test(value);
}

function compact(value: string) {
  const text = normalize(value);
  return text.length > 120 ? `${text.slice(0, 117).trim()}...` : text;
}

function problemSummary(contents: ReportContents) {
  const what = removeLeadingMeta(contents.what ?? '');
  const why = removeLeadingMeta(contents.why ?? '');
  const how = removeLeadingMeta(contents.how ?? '');

  if (what && why) {
    return compact(`${what} ${why}`);
  }

  return compact(what || why || how);
}

export function formatAiSummary(contents: ReportContents | undefined | null) {
  if (!contents) {
    return '';
  }

  const problem = problemSummary(contents);
  const summary = normalize(contents.summary ?? '');

  if (!summary) {
    return problem;
  }

  if (hasMeta(summary)) {
    return problem || compact(removeLeadingMeta(summary));
  }

  return compact(summary);
}
