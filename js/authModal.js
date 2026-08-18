// TEE MATRIX - Customer Mobile Phone OTP Authentication Modal

import { store } from './store.js';
import { supabaseService } from './supabase.js';

export class AuthModal {
  constructor() {
    this.step = 1; // 1: Mobile Phone Input, 2: 6-Digit OTP Verification
    this.phoneNumber = '';
    this.timerCountdown = 30;
    this.timerInterval = null;
    this.onSuccessCallback = null;
    this.customNotice = '';
  }

  open(mode = 'login', notice = '', onSuccess = null) {
    this.step = 1;
    this.phoneNumber = '';
    this.customNotice = notice;
    this.onSuccessCallback = onSuccess;
    this.render();
  }

  close() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
    }
  }

  render() {
    let backdrop = document.getElementById('authModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'authModalBackdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 440px; padding: 2.5rem; border: 1px solid var(--border-color); text-align: center;">
        <button class="modal-close" id="closeAuthBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="width: 50px; height: 50px; border-radius: 14px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </div>

        <span class="section-tag" style="letter-spacing: 0.25em;">SMS OTP AUTHENTICATION</span>
        <h2 class="brand-font" style="font-size: 1.6rem; color: #fff; margin-top: 0.25rem; margin-bottom: 0.5rem;">
          ${this.step === 1 ? 'SIGN IN WITH MOBILE' : 'VERIFY OTP CODE'}
        </h2>
        
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.5;">
          ${this.step === 1 
            ? 'Enter your mobile number to receive a 6-digit verification code.' 
            : `Enter the 6-digit code sent to <strong style="color: #fff;">${this.phoneNumber}</strong>`}
        </p>

        ${this.customNotice ? `
          <div style="margin-bottom: 1.25rem; padding: 0.6rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); font-size: 0.8rem; color: #ffffff;">
            ${this.customNotice}
          </div>
        ` : ''}

        <div id="authStepContainer">
          ${this.step === 1 ? this.renderPhoneStep() : this.renderOTPStep()}
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('active'), 10);
    this.attachEvents();
  }

  renderPhoneStep() {
    return `
      <form id="phoneForm" style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left;">
        <div>
          <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">MOBILE PHONE NUMBER *</label>
          <div style="display: flex; gap: 0.5rem;">
            <span style="padding: 0.8rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: #fff; font-size: 0.9rem; font-weight: 600;">+91</span>
            <input type="tel" id="mobileNumberInput" required class="input-field" placeholder="9876543210" value="${this.phoneNumber ? this.phoneNumber.replace('+91', '').trim() : ''}" style="font-size: 1rem; letter-spacing: 0.05em;" />
          </div>
        </div>

        <div id="phoneErrorMsg" style="color: var(--accent-danger); font-size: 0.8rem; display: none;"></div>

        <button type="submit" class="btn-primary" style="width: 100%; padding: 1.1rem; margin-top: 0.5rem;">
          GET 6-DIGIT OTP
        </button>

        <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 0.75rem;">
          New users will be registered automatically upon verification.
        </p>
      </form>
    `;
  }

  renderOTPStep() {
    return `
      <form id="otpForm" style="display: flex; flex-direction: column; text-align: center;">
        <div class="otp-container" id="otpBoxContainer">
          <input type="text" maxlength="1" class="otp-box" data-index="0" autofocus />
          <input type="text" maxlength="1" class="otp-box" data-index="1" />
          <input type="text" maxlength="1" class="otp-box" data-index="2" />
          <input type="text" maxlength="1" class="otp-box" data-index="3" />
          <input type="text" maxlength="1" class="otp-box" data-index="4" />
          <input type="text" maxlength="1" class="otp-box" data-index="5" />
        </div>

        <div id="otpErrorMsg" style="color: #ef4444; font-size: 0.8rem; display: none; margin-bottom: 1rem; font-weight: 600;"></div>

        <button type="submit" class="btn-primary" id="verifyOtpBtn" style="width: 100%; padding: 1.1rem; margin-bottom: 1.25rem;">
          VERIFY & LOG IN
        </button>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
          <button type="button" id="changeNumberBtn" style="color: var(--text-secondary); background: none; border: none; cursor: pointer;">
            &larr; Change Number
          </button>

          <span id="timerContainer" style="color: var(--text-muted);">
            Resend in <strong id="timerCount" style="color: #fff;">${this.timerCountdown}s</strong>
          </span>
          <button type="button" id="resendOtpBtn" style="display: none; color: #fff; font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer;">
            Resend OTP
          </button>
        </div>
      </form>
    `;
  }

  attachEvents() {
    document.getElementById('closeAuthBtn')?.addEventListener('click', () => this.close());

    // Step 1: Submit Phone Number
    const phoneForm = document.getElementById('phoneForm');
    if (phoneForm) {
      phoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawDigits = document.getElementById('mobileNumberInput').value.trim();
        const errEl = document.getElementById('phoneErrorMsg');

        if (rawDigits.length < 10) {
          if (errEl) {
            errEl.innerText = "Please enter a valid 10-digit mobile number";
            errEl.style.display = 'block';
          }
          return;
        }

        this.phoneNumber = rawDigits.startsWith('+') ? rawDigits : `+91 ${rawDigits}`;
        
        // Request SMS OTP via Supabase client
        const res = await supabaseService.sendSMSOTP(this.phoneNumber);
        if (res.isDevMode) {
          store.showToast(res.message);
        }

        this.step = 2;
        this.render();
        this.startTimer();
      });
    }

    // Step 2: 6-Digit OTP Box Logic (Auto-advance, backspace, paste, auto-submit)
    const boxes = document.querySelectorAll('.otp-box');
    if (boxes.length > 0) {
      boxes[0].focus();

      boxes.forEach((box, idx) => {
        // Typing auto-advance
        box.addEventListener('input', (e) => {
          const val = e.target.value;
          if (val && idx < 5) {
            boxes[idx + 1].focus();
          }

          // Auto-submit when all 6 filled
          const currentCode = Array.from(boxes).map(b => b.value).join('');
          if (currentCode.length === 6) {
            this.handleOTPVerification(currentCode);
          }
        });

        // Keydown (Backspace navigation)
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !box.value && idx > 0) {
            boxes[idx - 1].focus();
          }
        });

        // Paste 6-digit code support
        box.addEventListener('paste', (e) => {
          e.preventDefault();
          const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
          if (/^\d{6}$/.test(pasted)) {
            pasted.split('').forEach((digit, i) => {
              if (boxes[i]) boxes[i].value = digit;
            });
            boxes[5].focus();
            this.handleOTPVerification(pasted);
          }
        });
      });
    }

    // OTP Form Direct Submission
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
      otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = Array.from(document.querySelectorAll('.otp-box')).map(b => b.value).join('');
        this.handleOTPVerification(code);
      });
    }

    // Back to Step 1
    document.getElementById('changeNumberBtn')?.addEventListener('click', () => {
      this.step = 1;
      this.render();
    });

    // Resend OTP
    document.getElementById('resendOtpBtn')?.addEventListener('click', async () => {
      const res = await supabaseService.sendSMSOTP(this.phoneNumber);
      store.showToast(res.message);
      this.startTimer();
    });
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerCountdown = 30;
    const timerContainer = document.getElementById('timerContainer');
    const timerCount = document.getElementById('timerCount');
    const resendBtn = document.getElementById('resendOtpBtn');

    if (timerContainer) timerContainer.style.display = 'inline';
    if (resendBtn) resendBtn.style.display = 'none';

    this.timerInterval = setInterval(() => {
      this.timerCountdown--;
      if (timerCount) timerCount.innerText = `${this.timerCountdown}s`;

      if (this.timerCountdown <= 0) {
        clearInterval(this.timerInterval);
        if (timerContainer) timerContainer.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  async handleOTPVerification(code) {
    const errEl = document.getElementById('otpErrorMsg');
    const boxContainer = document.getElementById('otpBoxContainer');

    if (code.length < 6) {
      if (errEl) {
        errEl.innerText = "Please enter all 6 digits of the OTP";
        errEl.style.display = 'block';
      }
      return;
    }

    const res = await supabaseService.verifySMSOTP(this.phoneNumber, code);

    if (res.success) {
      // Auto-create or log in customer session
      store.loginCustomerWithPhone(this.phoneNumber);
      this.close();
      if (this.onSuccessCallback) this.onSuccessCallback();
    } else {
      // Show Error State: Red borders + Shake animation
      if (boxContainer) {
        boxContainer.classList.add('otp-error');
        setTimeout(() => boxContainer.classList.remove('otp-error'), 800);
      }

      if (errEl) {
        errEl.innerText = res.message || "Invalid 6-digit OTP code";
        errEl.style.display = 'block';
      }
    }
  }
}

export const authModal = new AuthModal();
