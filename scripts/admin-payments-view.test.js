const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
for (const name of ['payments', 'passengers', 'groups']) vm.runInNewContext(fs.readFileSync(require.resolve(`../assets/js/modules/${name}.js`),'utf8'),{window});
const payments = window.ElAngelAzulPayments;
test('Importes argentinos y canónicos conservan centavos; formatos ambiguos se rechazan',()=>{
  for(const [input,expected] of [['12.500,50','12500.50'],['12500,50','12500.50'],['12500.50','12500.50'],['$ 1.234.567,89','1234567.89'],['0','0']]) assert.equal(payments.amountText(input),expected);
  for(const input of ['12,500.50','1,234','NaN','-10','12.3.4','']) assert.equal(payments.amountText(input),null);
});
test('Un pasajero sin cobros no recibe cuotas, importes ni historial inventados',()=>{
  const p=payments.paymentData({dni:'45111222',pagado:'100000',saldo:'99999'});
  assert.equal(p.pagado,0);assert.equal(p.valorViaje,null);assert.equal(p.saldo,null);
  assert.equal(payments.installments({}).length,0);assert.equal(payments.paymentHistory({}).length,0);
});
test('Los anulados permanecen en el historial pero no suman al total cobrado',()=>{
  const passenger={planNombre:'12 cuotas',planCuotas:'12',cobros:[{id:'a',estado:'confirmado',monto_centavos:'1250050'},{id:'b',estado:'anulado',monto_centavos:'99999'}]};
  const p=payments.paymentData(passenger);assert.equal(p.pagado,12500.5);assert.equal(p.registros,1);assert.equal(p.planPago,'12 cuotas');assert.equal(p.saldo,null);
  assert.equal(payments.paymentHistory(passenger).length,2);assert.equal(payments.paymentHistory(passenger)[1].status,'Anulado');
});
test('El buscador encuentra apellido separado, nombre completo y correo del tutor',()=>{
  const rows=[{group:{colegio:'Prueba'},passenger:{nombre:'José María',apellido:'Fernández',responsableEmail:'familia@example.com'},payment:{}}];
  for(const search of ['fernández','Fernández José','José María Fernández','familia@example.com']) assert.equal(window.ElAngelAzulPassengers.filterRows(rows,{search}).length,1);
  assert.equal(window.ElAngelAzulPassengers.filterRows(rows,{search:'No existe'}).length,0);
});

test('Un grupo cerrado conserva su estado después de normalizar y volver a guardar',()=>{
  const group=window.ElAngelAzulGroups.normalizeGroup({id:'grupo-prueba',estado:'Cerrado',pasajeros:[]});
  assert.equal(window.ElAngelAzulGroups.normalizeGroup(JSON.parse(JSON.stringify(group))).estado,'Cerrado');
});

test('las cuentas confirmadas alimentan el saldo y las cuotas sin inventar un cronograma',()=>{
 const passenger={cuenta:{plan_nombre:'Plan originalmente confirmado',total_centavos:'10001',pagado_centavos:'4000',saldo_centavos:'6001',cuotas:[{numero:1,vencimiento:'2027-01-10',monto_centavos:'4000',estado:'pagada'},{numero:2,vencimiento:'2027-02-10',monto_centavos:'6001',estado:'pendiente'}]},cobros:[{estado:'confirmado',monto_centavos:'4000'}]};
 const payment=window.ElAngelAzulPayments.paymentData(passenger);assert.equal(payment.planPago,'Plan originalmente confirmado');assert.equal(payment.valorViaje,100.01);assert.equal(payment.pagado,40);assert.equal(payment.saldo,60.01);assert.equal(payment.cuotas,2);assert.equal(payment.estadoPago,'Saldo pendiente');assert.equal(window.ElAngelAzulPayments.installmentSummary(passenger),'1/2 pagadas');
});
