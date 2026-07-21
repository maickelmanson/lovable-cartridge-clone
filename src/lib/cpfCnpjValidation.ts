/**
 * Funções de máscara e validação para CPF e CNPJ
 */

/**
 * Remove caracteres não numéricos
 */
export function removerFormatacao(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export function mascaraCPF(valor: string): string {
  const limpo = removerFormatacao(valor);
  if (limpo.length === 0) return '';
  
  return limpo
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{2})$/, '$1-$2');
}

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export function mascaraCNPJ(valor: string): string {
  const limpo = removerFormatacao(valor);
  if (limpo.length === 0) return '';
  
  return limpo
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Valida CPF usando algoritmo de dígitos verificadores
 */
export function validarCPF(cpf: string): boolean {
  const limpo = removerFormatacao(cpf);
  
  // CPF deve ter 11 dígitos
  if (limpo.length !== 11) return false;
  
  // Rejeita CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(limpo)) return false;
  
  // Calcula primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo[i]) * (10 - i);
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  
  // Valida primeiro dígito verificador
  if (parseInt(limpo[9]) !== digito1) return false;
  
  // Calcula segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo[i]) * (11 - i);
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  
  // Valida segundo dígito verificador
  if (parseInt(limpo[10]) !== digito2) return false;
  
  return true;
}

/**
 * Valida CNPJ usando algoritmo de dígitos verificadores
 */
export function validarCNPJ(cnpj: string): boolean {
  const limpo = removerFormatacao(cnpj);
  
  // CNPJ deve ter 14 dígitos
  if (limpo.length !== 14) return false;
  
  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(limpo)) return false;
  
  // Calcula primeiro dígito verificador
  let soma = 0;
  const multiplicador1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    soma += parseInt(limpo[i]) * multiplicador1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  
  // Valida primeiro dígito verificador
  if (parseInt(limpo[12]) !== digito1) return false;
  
  // Calcula segundo dígito verificador
  soma = 0;
  const multiplicador2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    soma += parseInt(limpo[i]) * multiplicador2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  
  // Valida segundo dígito verificador
  if (parseInt(limpo[13]) !== digito2) return false;
  
  return true;
}

/**
 * Detecta automaticamente se é CPF ou CNPJ e aplica máscara apropriada
 */
export function mascaraAutomatica(valor: string): string {
  const limpo = removerFormatacao(valor);
  
  if (limpo.length <= 11) {
    return mascaraCPF(valor);
  } else {
    return mascaraCNPJ(valor);
  }
}

/**
 * Valida automaticamente CPF ou CNPJ baseado no comprimento
 */
export function validarAutomatico(valor: string): boolean {
  const limpo = removerFormatacao(valor);
  
  if (limpo.length === 11) {
    return validarCPF(valor);
  } else if (limpo.length === 14) {
    return validarCNPJ(valor);
  }
  
  return false;
}

/**
 * Aplica máscara de telefone (11) 99999-9999 ou (11) 3333-3333
 */
export function mascaraTelefone(valor: string): string {
  const limpo = removerFormatacao(valor);
  if (limpo.length === 0) return '';
  
  // Telefone deve ter 10 ou 11 dígitos
  const telefoneFormatado = limpo.slice(0, 11);
  
  if (telefoneFormatado.length <= 2) {
    return `(${telefoneFormatado}`;
  } else if (telefoneFormatado.length <= 6) {
    return `(${telefoneFormatado.slice(0, 2)}) ${telefoneFormatado.slice(2)}`;
  } else if (telefoneFormatado.length <= 10) {
    // Telefone com 10 dígitos: (XX) XXXX-XXXX
    return `(${telefoneFormatado.slice(0, 2)}) ${telefoneFormatado.slice(2, 6)}-${telefoneFormatado.slice(6)}`;
  } else {
    // Telefone com 11 dígitos: (XX) XXXXX-XXXX
    return `(${telefoneFormatado.slice(0, 2)}) ${telefoneFormatado.slice(2, 7)}-${telefoneFormatado.slice(7)}`;
  }
}

/**
 * Valida telefone (deve ter 10 ou 11 dígitos)
 */
export function validarTelefone(telefone: string): boolean {
  const limpo = removerFormatacao(telefone);
  
  // Telefone deve ter 10 ou 11 dígitos
  if (limpo.length !== 10 && limpo.length !== 11) return false;
  
  // Rejeita telefones com todos os dígitos iguais
  if (/^(\d)\1{9,10}$/.test(limpo)) return false;
  
  // Valida DDD (primeiros 2 dígitos devem ser entre 11 e 99)
  const ddd = parseInt(limpo.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  return true;
}
