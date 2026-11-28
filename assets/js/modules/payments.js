(function () {
  function amountText(value) {
    const raw=String(value??'').trim().replace(/\s/g,'').replace(/^\$/,'');
    if (/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(raw)) return raw.replace(/\./g,'').replace(',','.');
    return /^\d+(?:\.\d{1,2})?$/.test(raw)?raw:null;
  }
  function parseMoney(value) {
    if(typeof value==='number') return Number.isFinite(value)?value:0;
    const normalized=amountText(value);
    return normalized===null?0:Number(normalized);
  }
  function paymentData(passenger = {}) {
    const cobros=Array.isArray(passenger.cobros)?passenger.cobros:[];
    const confirmados=cobros.filter(p=>p.estado==='confirmado');
    const centavos=confirmados.reduce((sum,p)=>sum+Number(p.monto_centavos||0),0);
    const account=passenger.cuenta;
    const valorViaje=account?Number(account.total_centavos)/100:passenger.valorViaje!==''&&passenger.valorViaje!=null?parseMoney(passenger.valorViaje):null;
    return {
      planPago:passenger.planNombre||passenger.planPago||'Sin plan asignado',
      cuotas:account?account.cuotas.length:passenger.planCuotas||passenger.cuotas||'',
      valorViaje,pagado:account?Number(account.pagado_centavos)/100:centavos/100,saldo:account?Number(account.saldo_centavos)/100:valorViaje===null?null:Math.max(0,valorViaje-centavos/100),
      sena:null,proximaCuota:passenger.proximaCuota||'',estadoPago:account?(Number(account.saldo_centavos)===0?'Al día':'Saldo pendiente'):passenger.pago||'Pendiente',
      registros:confirmados.length
    };
  }
  function installments(passenger = {}) {if(passenger.cuenta)return passenger.cuenta.cuotas.map(row=>({number:row.numero,date:row.vencimiento,amount:Number(row.monto_centavos)/100,status:{pagada:'Pagada',pendiente:'Pendiente',vencida:'Vencida'}[row.estado]}));return Array.isArray(passenger.cuotasDetalle)?passenger.cuotasDetalle:[];}
  function installmentSummary(passenger = {}) {
    const rows=installments(passenger);
    if(!rows.length)return 'Cronograma pendiente';
    return `${rows.filter(i=>i.status==='Pagada').length}/${rows.length} pagadas`;
  }
  function paymentHistory(passenger = {}) {
    return (passenger.cobros||[]).map(p=>({id:p.id,date:p.fecha,concept:p.concepto,method:p.medio,amount:Number(p.monto_centavos)/100,status:p.estado==='anulado'?'Anulado':'Confirmado'}));
  }
  window.ElAngelAzulPayments={amountText,parseMoney,paymentData,installments,installmentSummary,paymentHistory};
})();
