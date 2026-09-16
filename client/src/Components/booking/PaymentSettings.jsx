import { useEffect, useState } from 'react';
export default function PaymentSettings({ token }) {
 const [data,setData]=useState(null), [qr,setQr]=useState(''), [status,setStatus]=useState(''), [busy,setBusy]=useState(false);
 const headers={Authorization:`Bearer ${token}`};
 useEffect(()=>{let active=true; fetch(`${import.meta.env.VITE_API_URL}/payment-settings`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{if(active){setData(d);setQr(d.qr)}}).catch(()=>{if(active)setStatus('Unable to load payment settings.')});return()=>{active=false}},[token]);
 async function choose(e){const file=e.target.files?.[0]; if(!file)return; if(file.size>250*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){setStatus('Choose a PNG, JPEG or WebP image under 250 KB.');return;} const reader=new FileReader();reader.onload=()=>{setQr(String(reader.result));setStatus('Preview ready. Save to publish this QR.');};reader.readAsDataURL(file);}
 async function save(){setBusy(true);try{const r=await fetch(`${import.meta.env.VITE_API_URL}/payment-settings`,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({qr})});if(!r.ok)throw new Error('Unable to save QR');setStatus('Payment QR saved.');}catch(e){setStatus(e.message)}finally{setBusy(false)}}
 if(!data)return status?<p role="status">{status}</p>:null;
 if(data.role!=='mentor')return null;
 return <section className="manual-payment"><h2>Receive session payments</h2><p>Upload your payment QR. Learners can scan it while booking; verify transfers in your payment app.</p><label htmlFor="payment-qr">Payment QR image (up to 250 KB)</label><input id="payment-qr" type="file" accept="image/png,image/jpeg,image/webp" onChange={choose}/>{qr&&<img className="payment-qr" src={qr} alt="Your payment QR preview"/>}<button type="button" disabled={busy} onClick={save}>{busy?'Saving…':'Save payment QR'}</button>{qr&&<button type="button" onClick={()=>{setQr('');setStatus('Save to remove your QR.')}}>Remove QR</button>}<p role="status">{status}</p></section>;
}
