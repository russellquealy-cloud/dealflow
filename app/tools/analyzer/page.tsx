'use client';
import { useMemo, useState } from 'react';

export default function Analyzer(){
  const [price,setPrice]=useState<number|''>(''); const [arv,setArv]=useState<number|''>(''); const [repairs,setRepairs]=useState<number|''>(''); const [holding,setHolding]=useState<number|''>('');
  const spread=useMemo(()=>Number(arv||0)-(Number(price||0)+Number(repairs||0)+Number(holding||0)),[price,arv,repairs,holding]);
  const roi=useMemo(()=>{const inv=Number(price||0)+Number(repairs||0)+Number(holding||0); return inv>0?(spread/inv)*100:0;},[spread,price,repairs,holding]);
  const input={width:'100%',padding:10,border:'1px solid #d1d5db',borderRadius:8,marginBottom:12} as React.CSSProperties;
  return (<div style={{maxWidth:520,margin:'24px auto',padding:12}}>
    <h1 style={{marginTop:0}}>Deal Analyzer</h1>
    <label>Purchase Price</label><input style={input} type="number" value={price} onChange={e=>setPrice(e.target.value?Number(e.target.value):'')} />
    <label>ARV</label><input style={input} type="number" value={arv} onChange={e=>setArv(e.target.value?Number(e.target.value):'')} />
    <label>Repairs</label><input style={input} type="number" value={repairs} onChange={e=>setRepairs(e.target.value?Number(e.target.value):'')} />
    <label>Holding/Other Costs</label><input style={input} type="number" value={holding} onChange={e=>setHolding(e.target.value?Number(e.target.value):'')} />
    <div style={{marginTop:16,fontSize:18}}><div><b>Spread:</b> ${spread.toLocaleString()}</div><div><b>ROI:</b> {roi.toFixed(1)}%</div></div>
  </div>);
}
