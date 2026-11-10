// Entrada de /en/: registra los textos en inglés y después arranca la web, que ya los encuentra en T (i18n.js).
// La página en español (main-es.js) no importa i18n-en.js, así que no los descarga
import { register } from './i18n.js';
import { en } from './i18n-en.js';
import { start } from './main.js';

register(en);
start();
