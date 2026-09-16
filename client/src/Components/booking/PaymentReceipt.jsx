import { useState } from 'react';
export default function PaymentReceipt({booking,token,currentUserId}){
 const [status,setStatus]=useState(booking.paymentStatus),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!status)return null;
 const mentor=String(booking.mentor?._id||booking.mentor)===String(currentUserId);
 async function verify(){setBusy(true);try{const r=await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking._id}/payment/verify`,{method:'PUT',headers:{Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error('Unable to verify payment');setStatus('verified')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="receipt-meeting"><span className="receipt-label">PAYMENT · INR</span><p><strong>₹{booking.paymentAmount?.toLocaleString('en-IN')}</strong> · {{not_required:'Free session',unpaid:'Pay later · unpaid',pending_verification:'Awaiting mentor verification',verified:'Verified by mentor'}[status]}</p>{booking.paymentReference&&<p>Reference: {booking.paymentReference}</p>}{mentor&&status==='pending_verification'&&<><p>Check this transfer in your payment app before confirming.</p><button disabled={busy} onClick={verify}>{busy?'Saving…':'Confirm payment received'}</button></>}{error&&<p role="alert">{error}</p>}</section>
}
