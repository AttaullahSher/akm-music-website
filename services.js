// AKM Music — Services booking (repairs, classes, studio, rentals)
// All bookings are sent as pre-filled WhatsApp messages to the store.

(function () {
  'use strict';

  const WHATSAPP_PHONE = '97126219929';

  function wa(message) {
    window.open(
      'https://api.whatsapp.com/send?phone=' + WHATSAPP_PHONE + '&text=' + encodeURIComponent(message),
      '_blank', 'noopener'
    );
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function require(fields) {
    for (const [id, label] of fields) {
      if (!val(id)) {
        const el = document.getElementById(id);
        el.focus();
        el.style.borderColor = 'var(--color-accent)';
        setTimeout(() => { el.style.borderColor = ''; }, 2500);
        alert('Please fill in: ' + label);
        return false;
      }
    }
    return true;
  }

  function track(name, params) {
    try { if (window.gtag) gtag('event', name, params || {}); } catch (_) {}
  }

  // Capture booking in Firestore (fire-and-forget) — WhatsApp remains the channel
  function capture(type, fields) {
    try { if (window.AKM) window.AKM.saveBooking({ type, ...fields }); } catch (_) {}
  }

  // ---------- Repairs ----------
  const repairBtn = document.getElementById('repairSubmit');
  if (repairBtn) repairBtn.addEventListener('click', () => {
    if (!require([['repairName', 'your name'], ['repairPhone', 'your contact number'], ['repairInstrument', 'instrument']])) return;
    const msg = [
      'Hello AKM Music! I need an instrument REPAIR. 🔧', '',
      'Name: ' + val('repairName'),
      'Contact: ' + val('repairPhone'),
      'Instrument: ' + val('repairInstrument'),
      'Issue: ' + (val('repairIssue') || 'Will describe at the showroom'),
      '',
      'I will drop the instrument at your showroom (Hamdan Road No 5, Behind Millennium Hotel, Abu Dhabi).',
      'Please confirm receiving hours. Thank you!'
    ].join('\n');
    capture('repair', { name: val('repairName'), phone: val('repairPhone'), instrument: val('repairInstrument'), issue: val('repairIssue') });
    track('repair_booking', { instrument: val('repairInstrument') });
    wa(msg);
  });

  // ---------- Classes ----------
  const classBtn = document.getElementById('classSubmit');
  if (classBtn) classBtn.addEventListener('click', () => {
    if (!require([['className', 'student name'], ['classPhone', 'contact number'], ['classInstrument', 'instrument']])) return;
    const msg = [
      'Hello AKM Music! I want to REGISTER FOR MUSIC CLASSES. 🎵', '',
      'Student name: ' + val('className'),
      'Age: ' + (val('classAge') || '—'),
      'Contact (WhatsApp): ' + val('classPhone'),
      'Instrument: ' + val('classInstrument'),
      'Level: ' + val('classLevel'),
      'Preferred days/time: ' + (val('classPreference') || 'Flexible'),
      '',
      'Plan: AED 525/month — 8 sessions, 45 min each, twice a week.',
      'Please have the teacher contact me to confirm the schedule. Thank you!'
    ].join('\n');
    capture('class', { name: val('className'), age: val('classAge'), phone: val('classPhone'), instrument: val('classInstrument'), level: val('classLevel'), preference: val('classPreference'), plan: 'AED 525/month - 8x45min' });
    track('class_registration', { instrument: val('classInstrument') });
    wa(msg);
  });

  // ---------- Studio ----------
  let studioType = null;
  document.querySelectorAll('.option-pill[data-studio]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.option-pill[data-studio]').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      studioType = pill.dataset.studio;
    });
  });

  // Working hours: Sat–Thu 9:00–21:00, Fri 16:30–21:00 (last 60-min slot one hour before close)
  function buildSlots(dateStr) {
    const slotSel = document.getElementById('studioTime');
    if (!slotSel) return;
    slotSel.innerHTML = '<option value="">Select a time…</option>';
    if (!dateStr) return;
    const day = new Date(dateStr + 'T12:00:00').getDay(); // 5 = Friday
    const slots = [];
    if (day === 5) {
      slots.push('4:30 PM');
      for (let h = 17; h <= 20; h++) slots.push(fmtHour(h));
    } else {
      for (let h = 9; h <= 20; h++) slots.push(fmtHour(h));
    }
    slots.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      slotSel.appendChild(o);
    });
  }
  function fmtHour(h) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ':00 ' + ampm;
  }

  const studioDate = document.getElementById('studioDate');
  if (studioDate) {
    studioDate.min = new Date().toISOString().slice(0, 10);
    studioDate.addEventListener('change', e => buildSlots(e.target.value));
  }

  const studioBtn = document.getElementById('studioSubmit');
  if (studioBtn) studioBtn.addEventListener('click', () => {
    if (!studioType) { alert('Please choose Solo or Band session.'); return; }
    if (!require([['studioName', 'your name'], ['studioPhone', 'contact number'], ['studioDate', 'preferred date'], ['studioTime', 'preferred time']])) return;
    const price = studioType === 'band' ? 'AED 150' : 'AED 100';
    const label = studioType === 'band' ? 'Band session' : 'Solo session';
    const msg = [
      'Hello AKM Music! I want to BOOK THE STUDIO. 🎙️', '',
      'Name: ' + val('studioName'),
      'Contact: ' + val('studioPhone'),
      'Session: ' + label + ' — 60 minutes (' + price + ')',
      'Preferred date: ' + val('studioDate'),
      'Preferred time: ' + val('studioTime'),
      'Notes: ' + (val('studioNotes') || '—'),
      '',
      'Please confirm availability. Thank you!'
    ].join('\n');
    capture('studio', { name: val('studioName'), phone: val('studioPhone'), session: studioType, price: studioType === 'band' ? 150 : 100, date: val('studioDate'), time: val('studioTime'), notes: val('studioNotes') });
    track('studio_booking', { type: studioType });
    wa(msg);
  });

  // ---------- Rentals ----------
  const rentalBtn = document.getElementById('rentalSubmit');
  if (rentalBtn) rentalBtn.addEventListener('click', () => {
    if (!require([['rentalName', 'your name'], ['rentalPhone', 'contact number'], ['rentalInstrument', 'instrument']])) return;
    const msg = [
      'Hello AKM Music! I want to RENT an instrument. 🎸', '',
      'Name: ' + val('rentalName'),
      'Contact: ' + val('rentalPhone'),
      'Instrument: ' + val('rentalInstrument'),
      'Rental period: ' + (val('rentalPeriod') || 'To discuss'),
      '',
      'Please share pricing and availability. Thank you!'
    ].join('\n');
    capture('rental', { name: val('rentalName'), phone: val('rentalPhone'), instrument: val('rentalInstrument'), period: val('rentalPeriod') });
    track('rental_request', { instrument: val('rentalInstrument') });
    wa(msg);
  });
})();
