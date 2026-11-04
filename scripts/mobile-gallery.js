// Phone-only progressive enhancement. Original image links remain the fallback.
(() => {
  'use strict';
  const garage = document.getElementById('garage');
  if (!garage) return;
  const phone = window.matchMedia('(max-width: 760px)');
  let viewer;
  let photo;
  let caption;
  let error;
  let closeButton;
  let trigger;

  function finishClose() {
    // A queued close event must not clear a newly opened photograph.
    if (viewer.open || !document.body.classList.contains('mobile-photo-open')) return;
    document.body.classList.remove('mobile-photo-open');
    photo.removeAttribute('src');
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  }

  function closeViewer() {
    viewer.close();
    // Finish before another keyboard activation can change the selected card.
    finishClose();
  }

  function createViewer() {
    viewer = document.createElement('dialog');
    viewer.className = 'mobile-photo-viewer';
    viewer.setAttribute('aria-labelledby', 'mobile-photo-title');
    viewer.setAttribute('aria-describedby', 'mobile-photo-caption');

    const title = document.createElement('h2');
    title.id = 'mobile-photo-title';
    title.className = 'sr-only';
    title.textContent = 'Enlarged fabrication photograph';

    const controls = document.createElement('div');
    controls.className = 'mobile-photo-controls';
    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'mobile-photo-close';
    closeButton.textContent = 'Close photo \u00d7';
    closeButton.setAttribute('aria-label', 'Close enlarged photograph');
    controls.append(closeButton);

    photo = document.createElement('img');
    photo.className = 'mobile-photo-image';
    photo.decoding = 'async';

    caption = document.createElement('p');
    caption.id = 'mobile-photo-caption';
    caption.className = 'mobile-photo-caption';

    error = document.createElement('p');
    error.className = 'mobile-photo-error';
    error.setAttribute('role', 'alert');
    error.textContent = 'This photograph could not load. Close this view and try again.';
    error.hidden = true;
    photo.addEventListener('error', () => { if (viewer.open) error.hidden = false; });

    viewer.append(title, controls, photo, caption, error);
    document.body.append(viewer);
    closeButton.addEventListener('click', closeViewer);
    viewer.addEventListener('click', event => {
      if (event.target !== viewer) return;
      const bounds = viewer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) closeViewer();
    });
    viewer.addEventListener('cancel', event => {
      event.preventDefault();
      closeViewer();
    });
    viewer.addEventListener('close', finishClose);
  }

  garage.addEventListener('click', event => {
    if (!phone.matches || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const link = event.target instanceof Element && event.target.closest('a.original-photo');
    if (!link || !garage.contains(link)) return;
    const thumbnail = link.querySelector('img');
    if (!thumbnail || typeof HTMLDialogElement === 'undefined' ||
        typeof HTMLDialogElement.prototype.showModal !== 'function') return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    if (!viewer) createViewer();
    trigger = link;
    photo.alt = thumbnail.alt;
    photo.width = Number(thumbnail.getAttribute('width'));
    photo.height = Number(thumbnail.getAttribute('height'));
    error.hidden = true;
    const project = link.closest('.fabrication-project');
    const projectTitle = project && project.querySelector('h4');
    const figureCaption = link.closest('figure').querySelector('figcaption');
    const detail = figureCaption ? figureCaption.textContent.replace(/\u2197/g, '').trim() : '';
    caption.textContent = projectTitle ? projectTitle.textContent + ' \u2014 ' + detail : detail;
    photo.src = url.href;
    document.body.classList.add('mobile-photo-open');
    viewer.showModal();
    closeButton.focus({ preventScroll: true });
  });

  // Native dialog provides focus containment and Escape-to-close.
  phone.addEventListener('change', () => {
    if (!phone.matches && viewer && viewer.open) closeViewer();
  });
})();
