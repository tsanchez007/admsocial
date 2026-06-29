// Utilidad de fecha/hora compartida por las funciones serverless de api/.
//
// CONVENCIÓN: en toda la app, fecha_programada se guarda y se compara
// SIEMPRE en UTC real, como texto 'YYYY-MM-DD HH:MM:SS' (separador
// espacio, sin 'T' ni 'Z'). Esto importa porque MySQL siempre devuelve
// sus valores DATETIME en ese mismo formato cuando se usan en texto
// (por ejemplo dentro de SUBSTR()), así que si "ahora" no se genera con
// el mismo formato, las comparaciones de texto en SQL quedan rotas.

export function nowAsUTCStorageString() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
