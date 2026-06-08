import i18n from "../i18n";

export function tCrop(name: string): string {
  const key = `crops.${name}`;
  const translated = i18n.t(key);
  return translated !== key ? translated : name;
}
