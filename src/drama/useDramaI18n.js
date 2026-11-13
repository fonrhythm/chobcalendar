import {useLanguageStore} from '../stores/language';
import {dramaText} from './i18n.js';
export function useDramaI18n(){const language=useLanguageStore();return {language,tr:(text,values)=>dramaText(language.currentLanguage,text,values)};}
