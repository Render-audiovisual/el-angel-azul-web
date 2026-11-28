// Datos inequívocamente ficticios para pruebas locales del formulario y del PDF.
module.exports = ({ colegioId, planPagoId, documento = '45111222' }) => ({
 colegioId,planPagoId,nivel:'Secundaria',destino:'Bariloche',anio:'2027',grado:'5°',division:'A',
 pasajeroNombre:'Lucía',pasajeroApellido:'González de Prueba',pasajeroTipoDocumento:'DNI',pasajeroNumeroDocumento:documento,pasajeroNacimiento:'2009-03-14',pasajeroSexo:'Femenino',
 responsableNombre:'María',responsableApellido:'Prueba',responsableTipoDocumento:'DNI',responsableNumeroDocumento:'12345678',responsableNacimiento:'1980-05-02',responsableParentesco:'Madre',responsableCuilCuit:'20123456786',responsableEmail:'familia@example.com',responsableCelular:'3794123456',
 domicilioCalle:'San Martín',domicilioNumero:'123',domicilioLocalidad:'Goya',domicilioProvincia:'Corrientes',domicilioCodigoPostal:'3450',aceptaCondiciones:true,
 firma:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
});
