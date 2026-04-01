/**
 * Converte strings brutas e sujas contendo informações de peso em formato numérico flutuante.
 * Localiza os numerais (ex: "Pesando maravilhosos 82,5 kgs" -> 82.5).
 * 
 * @param str - A string orgânica capturada da anamnese gravada.
 * @returns O valor matemático do peso ou Null caso inexista métrica.
 */
export const parsePeso = (str: string) => {
    if (!str) return null;
    const match = str.replace(',', '.').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
};

/**
 * Converte strings orgânicas referindo-se a estrura corporal em metros matemáticos.
 * Efetua a detecção contextual automática: se o texto extrair "175", assume como CMs e divide pra Metro (1.75).
 * 
 * @param str - A string descritiva da estatura.
 * @returns A altura linearizada perfeitamente em metros matemáticos.
 */
export const parseAltura = (str: string) => {
    if (!str) return null;
    let match = str.replace(',', '.').match(/[\d.]+/);
    if (!match) return null;
    let val = parseFloat(match[0]);
    if (val > 3) val = val / 100; // cm to m
    return val;
};

/**
 * Aplica a fórmula canônica nutricional de Massa Corporal dividindo o Peso numérico pela Altura ao quadrado.
 * Protege a interface gráfica contra falhas matemáticas (Divisão por Zero / Not a Number).
 * 
 * @param peso Massa capturada já formatada.
 * @param altura Estatura metrificada já formatada.
 * @returns O índice de massa retornado com precisão de 1 casa flutuante, em formato de string.
 */
export const calcularIMC = (peso: number | null, altura: number | null) => {
    if (!peso || !altura || peso <= 0 || altura <= 0) return null;
    return (peso / (altura * altura)).toFixed(1);
};
