// BTB sharing controls. No SDKs, tracking, native share sheet or automatic posting.
(() => {
  'use strict';
  const siteUrl = 'https://brandx-design.com/';
  const trigger = document.getElementById('share-site');
  const dialog = document.getElementById('share-dialog');
  const close = document.getElementById('share-close');
  const status = document.getElementById('share-status');
  const manual = document.getElementById('share-manual');
  const urlField = document.getElementById('share-url');
  const sms = document.getElementById('share-sms');
  if (!trigger || !dialog || !close || !status || !manual || !urlField || !sms ||
      typeof dialog.showModal !== 'function') return;

  // Request a recipient-free draft. iOS commonly accepts &body; Android uses ?body.
  // A browser cannot reliably detect an installed SMS handler or confirm it opened.
  const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  sms.href = 'sms:' + (appleMobile ? '&' : '?') + 'body=' + encodeURIComponent(siteUrl);

  let generation = 0;
  let copying = false;
  let pointerStartedOutside = false;
  function resetFeedback() {
    status.textContent = '';
    manual.hidden = true;
  }
  function closeDialog() { dialog.close(); }
  function outside(event) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    generation++;
    copying = false;
    dialog.removeAttribute('aria-busy');
    resetFeedback();
    dialog.showModal();
    document.body.classList.add('share-popup-open');
    close.focus({ preventScroll: true });
  });
  // Keep Tab within the popup, including when the manual-copy field is revealed.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('a[href], button, input')].filter(control =>
      !control.closest('[hidden]') && control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) return;
    if ((event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last) ||
        !controls.includes(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener('close', () => {
    // Ignore an old queued close event if the dialog has already reopened.
    if (dialog.open) return;
    generation++;
    copying = false;
    dialog.removeAttribute('aria-busy');
    document.body.classList.remove('share-popup-open');
    trigger.focus({ preventScroll: true });
  });
  dialog.addEventListener('pointerdown', event => {
    pointerStartedOutside = event.target === dialog && outside(event);
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && pointerStartedOutside && outside(event)) closeDialog();
    pointerStartedOutside = false;
  });

  const pasteTargets = { instagram: 'Instagram', tiktok: 'TikTok', messenger: 'Messenger' };
  async function copyLink(service) {
    if (copying) return;
    copying = true;
    const request = ++generation;
    dialog.setAttribute('aria-busy', 'true');
    resetFeedback();
    const target = pasteTargets[service];
    try {
      if (typeof navigator.clipboard?.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(siteUrl);
      if (request !== generation || !dialog.open) return;
      status.textContent = target ? 'Link copied! Paste it into ' + target + '.' : 'Link copied!';
    } catch {
      if (request !== generation || !dialog.open) return;
      status.textContent = target ? 'Copy the website link below, then paste it into ' + target + '.' :
        'Copy the website link below to share it.';
      manual.hidden = false;
      urlField.focus();
      urlField.select();
    } finally {
      if (request === generation) {
        copying = false;
        dialog.removeAttribute('aria-busy');
      }
    }
  }
  for (const option of dialog.querySelectorAll('[data-share]')) {
    const service = option.dataset.share;
    option.addEventListener('click', () => {
      if (service === 'copy' || Object.hasOwn(pasteTargets, service)) {
        void copyLink(service);
      } else {
        generation++;
        copying = false;
        dialog.removeAttribute('aria-busy');
        resetFeedback();
        // Navigation is not proof that an app opened or a message was delivered.
        const guidance = {
          email: 'Review and send from your email app. If nothing opens, use Copy Link.',
          facebook: 'Finish sharing in Facebook. If nothing opens, use Copy Link.',
          sms: 'Choose a recipient and review the message in your messaging app. If nothing opens or the link is missing, use Copy Link or copy the website link below.'
        };
        status.textContent = guidance[service];
        // Always offer a manual fallback for SMS; do not guess handler availability,
        // alter the clipboard, steal focus or claim that the app opened.
        if (service === 'sms') manual.hidden = false;
      }
    });
  }
  trigger.hidden = false;
})();
