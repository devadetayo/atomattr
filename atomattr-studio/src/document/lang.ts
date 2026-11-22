import type { Project } from './types';

/** A BCP 47 language tag as people write them: en, fr, pt-BR, zh-Hans-CN. */
export const LANG_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/;
export const langValid = (v?: string) => !!v && LANG_TAG.test(v.trim());
/** The language written on <html lang>. Falls back to English when none is set or it is malformed. */
export const langOf = (project: Pick<Project, 'site'>) => (langValid(project.site?.lang) ? project.site!.lang!.trim() : 'en');
