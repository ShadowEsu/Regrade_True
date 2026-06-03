/**
 * Marketing site waitlist — persists emails to Firestore `waitlist` collection.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

function hasConfig(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let app: FirebaseApp | null = null;

function getDb() {
  if (!app) app = initializeApp(config);
  const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
  return getFirestore(app, dbId && dbId !== '(default)' ? dbId : undefined);
}

function showSuccess(form: HTMLFormElement) {
  form.className = 'signup done';
  form.innerHTML =
    '<span class="ck">✓</span> You\u2019re on the list — we\u2019ll email you when iOS opens.';
}

function showError(form: HTMLFormElement, message: string) {
  const existing = form.querySelector('.waitlist-error');
  if (existing) existing.remove();
  const el = document.createElement('p');
  el.className = 'waitlist-error';
  el.setAttribute('role', 'alert');
  el.style.cssText =
    'margin-top:12px;font-size:14px;color:#c7553f;text-align:center;width:100%';
  el.textContent = message;
  form.appendChild(el);
}

function initCounter() {
  const counter = document.getElementById('ctaCount');
  if (!counter) return;
  const base = 2843;
  let shown = false;
  const animate = (el: HTMLElement, target: number, dur: number, fmt: (v: number) => string) => {
    let start: number | null = null;
    const frame = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(frame);
  };
  new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !shown) {
        shown = true;
        animate(counter, base, 1400, (v) => v.toLocaleString('en-US'));
      }
    },
    { threshold: 0.4 },
  ).observe(counter);
}

function initForm() {
  const form = document.getElementById('signup') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('signupEmail') as HTMLInputElement | null;
    const email = input?.value?.trim().toLowerCase() ?? '';
    if (!email || !email.includes('@') || !email.includes('.')) {
      showError(form, 'Enter a valid school email.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving…';
    }

    try {
      if (hasConfig()) {
        await addDoc(collection(getDb(), 'waitlist'), {
          email,
          createdAt: serverTimestamp(),
          source: 'website',
        });
      }
      showSuccess(form);
    } catch (err) {
      console.error('Waitlist signup failed:', err);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Reserve my spot';
      }
      showError(form, 'Could not save your email. Please try again in a moment.');
    }
  });
}

initCounter();
initForm();
