/**
 * Formatea un número como Córdoba nicaragüense (NIO)
 * Ejemplo: 1250.5 -> "C$ 1,250.50"
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num).replace('NIO', 'C$');
};

/**
 * Formatea una cantidad decimal a 2 decimales fijos
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('es-NI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

/**
 * Formatea una cadena de fecha ISO o un objeto Date a formato legible
 */
export const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = false;
    }
    
    return new Intl.DateTimeFormat('es-NI', options).format(d);
  } catch (e) {
    return '-';
  }
};
