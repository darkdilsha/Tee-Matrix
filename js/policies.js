// TEE MATRIX - Standard Indian E-Commerce Legal Policies & Compliance Engine
// Meets PhonePe PG, Razorpay, and Indian Merchant Onboarding Regulations

export function renderSiteFooter() {
  return `
    <footer class="site-footer" style="padding: 4.5rem 0 2rem; border-top: 1px solid var(--border-color); background: #070709; margin-top: 3rem;">
      <div class="container">
        <div class="footer-grid" style="display: grid; grid-template-columns: 2fr 1.2fr 1.5fr 1.5fr; gap: 3rem; margin-bottom: 3.5rem;">
          
          <!-- Col 1: Brand Info -->
          <div>
            <span class="brand-font" style="font-size: 1.6rem; color: #fff; display: block; margin-bottom: 1rem; letter-spacing: 0.15em;">TEE MATRIX</span>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; max-width: 340px; margin-bottom: 1.2rem;">
              Architectural heavyweight streetwear atelier. Direct-to-consumer online exclusive drops engineered with high-density cotton, custom garment washes, and boxy oversized cuts.
            </p>
            <div style="display: flex; gap: 0.6rem; align-items: center; font-size: 0.75rem; color: var(--accent-gold);">
              <span>🛡️ 256-Bit SSL Encrypted</span>
              <span>&bull;</span>
              <span>🇮🇳 Pan-India Express Delivery</span>
            </div>
          </div>

          <!-- Col 2: Atelier Catalog -->
          <div>
            <h4 style="font-size: 0.85rem; letter-spacing: 0.18em; text-transform: uppercase; color: #fff; margin-bottom: 1.2rem; font-weight: 700;">COLLECTION</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.7rem; font-size: 0.85rem; color: var(--text-secondary);">
              <li><a href="#shop" class="footer-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">All Oversized Tees</a></li>
              <li><a href="#new-arrivals" class="footer-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">New Arrivals Drops</a></li>
              <li><a href="#shop" class="footer-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Acid Wash Series</a></li>
              <li><a href="#shop" class="footer-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Heavyweight Minimal</a></li>
              <li><a href="#shop" class="footer-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Graphic Edition</a></li>
            </ul>
          </div>

          <!-- Col 3: Legal & Compliance Policies -->
          <div>
            <h4 style="font-size: 0.85rem; letter-spacing: 0.18em; text-transform: uppercase; color: #fff; margin-bottom: 1.2rem; font-weight: 700;">LEGAL & POLICIES</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.7rem; font-size: 0.85rem; color: var(--text-secondary);">
              <li><a href="#terms-and-conditions" class="footer-link policy-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Terms & Conditions</a></li>
              <li><a href="#privacy-policy" class="footer-link policy-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Privacy Policy</a></li>
              <li><a href="#shipping-policy" class="footer-link policy-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Shipping & Delivery</a></li>
              <li><a href="#refund-policy" class="footer-link policy-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Refund Policy</a></li>
              <li><a href="#return-policy" class="footer-link policy-link" style="color: var(--text-secondary); text-decoration: none; transition: color 0.2s;">Return & Exchange Policy</a></li>
            </ul>
          </div>

          <!-- Col 4: Support & Merchant Contact -->
          <div>
            <h4 style="font-size: 0.85rem; letter-spacing: 0.18em; text-transform: uppercase; color: #fff; margin-bottom: 1.2rem; font-weight: 700;">SUPPORT & CONTACT</h4>
            <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.6rem; line-height: 1.5;">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase;">Customer Support Email</span>
                <a href="mailto:support@teematrix.in" style="color: var(--accent-gold); font-weight: 600; text-decoration: none;">support@teematrix.in</a>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase;">Customer Helpline / WhatsApp</span>
                <span style="color: #fff; font-weight: 600;">+91 98765 43210</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">(Mon – Sat, 10:00 AM – 7:00 PM IST)</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase;">Registered Atelier Address</span>
                <span style="color: #d1d5db; font-size: 0.8rem;">Koramangala 5th Block, Bangalore, Karnataka - 560095, India</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.5rem; font-size: 0.78rem; color: var(--text-muted); flex-wrap: wrap; gap: 1rem;">
          <div>&copy; 2026 TEE MATRIX ONLINE ATELIER. ALL RIGHTS RESERVED.</div>
          <div style="display: flex; gap: 1.5rem; align-items: center;">
            <span>Payments Accepted: UPI (GPay, PhonePe, Paytm, CRED) &bull; Visa &bull; MasterCard &bull; NetBanking &bull; COD</span>
            <a href="#admin" style="color: var(--text-muted); font-size: 0.72rem; text-decoration: none; opacity: 0.6;">Admin Portal</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

export class PoliciesPage {
  constructor(navigateToShopCallback) {
    this.navigateToShop = navigateToShopCallback;
    this.currentPolicy = 'terms-and-conditions';
  }

  render(policyType = 'terms-and-conditions') {
    this.currentPolicy = policyType;

    const policies = [
      { id: 'terms-and-conditions', name: 'Terms & Conditions', tag: 'USER AGREEMENT' },
      { id: 'privacy-policy', name: 'Privacy Policy', tag: 'DATA PROTECTION' },
      { id: 'shipping-policy', name: 'Shipping & Delivery', tag: 'DOMESTIC LOGISTICS' },
      { id: 'refund-policy', name: 'Refund Policy', tag: 'PAYMENT SETTLEMENT' },
      { id: 'return-policy', name: 'Return & Exchange', tag: '7-DAY ASSURANCE' }
    ];

    return `
      <div>
        <div class="policy-page-container container" style="padding-top: 6.5rem; padding-bottom: 3rem; min-height: 80vh;">
          
          <!-- Breadcrumb & Header Row -->
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.75rem;">
              <a href="#landing" class="policy-breadcrumb-link" style="color: var(--text-secondary); text-decoration: none;">HOME</a>
              <span>/</span>
              <span style="color: var(--accent-gold);">LEGAL & POLICIES</span>
              <span>/</span>
              <span style="color: #fff;">${this.getPolicyTitle(policyType)}</span>
            </div>

            <span class="section-tag" style="letter-spacing: 0.25em;">INDIAN STATUTORY & PAYMENT GATEWAY COMPLIANCE</span>
            <h1 class="brand-font" style="font-size: clamp(2rem, 4vw, 3rem); color: #fff; line-height: 1.1; margin-bottom: 0.5rem;">
              ${this.getPolicyTitle(policyType).toUpperCase()}
            </h1>
            <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 750px;">
              Effective Date: January 1, 2026 &bull; Last Updated: August 21, 2026 &bull; Brand: <strong>Tee Matrix</strong>
            </p>
          </div>

          <!-- Policy Navigation Pills -->
          <div class="category-scroll-row" style="display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
            ${policies.map(p => `
              <a href="#${p.id}" class="pill-btn policy-nav-btn ${this.currentPolicy === p.id ? 'active' : ''}" data-policy="${p.id}" style="padding: 0.6rem 1.2rem; font-size: 0.78rem; border-radius: 20px; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
                <span>${p.name}</span>
              </a>
            `).join('')}
          </div>

          <!-- Policy Main Content Card -->
          <div class="glass-panel" style="padding: 2.5rem; border-radius: 12px; background: #0d0d10; border: 1px solid rgba(255,255,255,0.1); line-height: 1.7; font-size: 0.92rem; color: #d1d5db;">
            ${this.renderPolicyContent(policyType)}
          </div>

          <!-- Merchant Contact & Support Details Card -->
          <div style="margin-top: 3rem; padding: 2rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;">
            <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 1rem; font-family: var(--font-heading); display: flex; align-items: center; gap: 0.5rem;">
              📞 Merchant & Customer Grievance Support
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.2rem;">
              For queries, order assistance, payment concerns, or return requests, reach out to our dedicated support concierge:
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; font-size: 0.85rem;">
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;">Brand Entity</span>
                <strong style="color: #fff;">Tee Matrix</strong>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;">Customer Support Email</span>
                <a href="mailto:support@teematrix.in" style="color: var(--accent-gold); font-weight: 600; text-decoration: none;">support@teematrix.in</a>
              </div>
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;">Helpline / WhatsApp</span>
                <strong style="color: #fff;">+91 98765 43210</strong> (10 AM – 7 PM IST)
              </div>
              <div>
                <span style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;">Operating Atelier Hub</span>
                <span style="color: #eee;">Koramangala 5th Block, Bangalore, Karnataka - 560095, India</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Render Site Footer -->
        ${renderSiteFooter()}
      </div>
    `;
  }

  getPolicyTitle(type) {
    switch (type) {
      case 'terms-and-conditions': return 'Terms & Conditions';
      case 'privacy-policy': return 'Privacy Policy';
      case 'shipping-policy': return 'Shipping & Delivery Policy';
      case 'refund-policy': return 'Refund Policy';
      case 'return-policy': return 'Return & Exchange Policy';
      default: return 'Legal Policy';
    }
  }

  renderPolicyContent(type) {
    switch (type) {
      case 'terms-and-conditions':
        return this.renderTermsContent();
      case 'privacy-policy':
        return this.renderPrivacyContent();
      case 'shipping-policy':
        return this.renderShippingContent();
      case 'refund-policy':
        return this.renderRefundContent();
      case 'return-policy':
        return this.renderReturnContent();
      default:
        return this.renderTermsContent();
    }
  }

  renderTermsContent() {
    return `
      <section style="display: flex; flex-direction: column; gap: 1.8rem;">
        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">1. Introduction & Acceptance of Terms</h2>
          <p>
            Welcome to <strong>Tee Matrix</strong> (the "Website", "Brand", "We", "Us", or "Our"). These Terms and Conditions govern your access to and use of our online storefront accessible via our domain, web applications, and related services.
          </p>
          <p style="margin-top: 0.5rem;">
            By browsing, accessing, registering, or purchasing products on Tee Matrix, you agree to be bound by these Terms, our Privacy Policy, Shipping Policy, and Return/Refund Policies. If you do not agree to these terms, please refrain from using the Website.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">2. User Eligibility</h2>
          <p>
            Use of the Website is available only to persons who can form legally binding contracts under the Indian Contract Act, 1872. If you are a minor (under the age of 18 years), you may use the Website only with the involvement and consent of a parent or legal guardian.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">3. Product Descriptions & Pricing in Indian National Rupees (INR)</h2>
          <p>
            All products displayed on Tee Matrix (heavyweight t-shirts, oversized graphic apparel, and luxury streetwear drops) are described as accurately as possible. However, actual garment colors and acid-wash distress patterns may vary slightly due to digital monitor calibration and custom garment-dyeing techniques.
          </p>
          <p style="margin-top: 0.5rem;">
            All prices are listed in <strong>Indian National Rupees (INR / ₹)</strong>. Prices are subject to change without prior notice, but price changes will not affect orders that have already been confirmed by us. We reserve the right to correct any typographical pricing errors.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">4. Orders, Payments & Order Acceptance</h2>
          <p>
            When you place an order on Tee Matrix, you offer to purchase the specified merchandise. Orders are subject to stock availability and payment verification. We support:
          </p>
          <ul style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>UPI Instant Payments & Dynamic QR</strong> (Google Pay, PhonePe, Paytm, CRED, BHIM)</li>
            <li><strong>Credit & Debit Cards / NetBanking</strong> (Visa, MasterCard, RuPay, Maestro) processed via PCI-DSS compliant gateways (Razorpay / PhonePe)</li>
            <li><strong>Cash on Delivery (COD)</strong> for select eligible pin codes across India</li>
          </ul>
          <p style="margin-top: 0.5rem;">
            We reserve the right to refuse or cancel any order for reasons including stock depletion, suspected fraud, unauthorized payment activity, or inaccurate shipping addresses. In case of cancellation after payment, a 100% full refund will be credited back to your original payment source.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">5. Intellectual Property Rights</h2>
          <p>
            All content on Tee Matrix—including trademarks, brand logos, custom graphic prints, product names, typography, website code, photography, lookbook imagery, and architectural designs—is the exclusive intellectual property of Tee Matrix. Any unauthorized copying, reproduction, or commercial distribution is strictly prohibited.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">6. Limitation of Liability & Governing Law</h2>
          <p>
            To the fullest extent permitted by applicable Indian law, Tee Matrix shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or inability to use our products or services.
          </p>
          <p style="margin-top: 0.5rem;">
            These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bangalore, Karnataka, India</strong>.
          </p>
        </div>
      </section>
    `;
  }

  renderPrivacyContent() {
    return `
      <section style="display: flex; flex-direction: column; gap: 1.8rem;">
        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">1. Privacy Commitment</h2>
          <p>
            At <strong>Tee Matrix</strong>, we are committed to safeguarding your personal privacy and protecting the confidentiality of your personal information in compliance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act (DPDP), India.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">2. Information We Collect</h2>
          <p>When you browse, register, or make a purchase on Tee Matrix, we may collect the following information:</p>
          <ul style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Contact Information:</strong> Full Name, Email Address, Mobile Phone Number.</li>
            <li><strong>Delivery & Shipping Information:</strong> Doorstep Delivery Street Address, City, State, and Pincode.</li>
            <li><strong>Payment Transaction Data:</strong> UPI Reference/UTR numbers, Razorpay Payment IDs, and order transaction tokens. <em>(Note: We NEVER capture, process, or store raw credit/debit card numbers, CVVs, or bank passwords on our servers).</em></li>
            <li><strong>Technical & Browsing Data:</strong> IP Address, browser type, operating system, and session cookies to maintain shopping cart items and authentication state.</li>
          </ul>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">3. How We Use Your Information</h2>
          <p>We use the collected information strictly for:</p>
          <ul style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li>Processing, validating, and fulfilling your apparel orders.</li>
            <li>Coordinating doorstep courier delivery through our verified Indian logistics partners (e.g. Bluedart, Delhivery, Xpressbees).</li>
            <li>Sending transactional SMS and email notifications regarding order confirmation, dispatch, tracking links, and delivery updates.</li>
            <li>Providing customer support and processing authorized returns/refunds.</li>
            <li>Preventing fraudulent transactions and ensuring overall platform security.</li>
          </ul>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">4. Data Protection & Non-Sharing Policy</h2>
          <p>
            We implement 256-bit SSL encryption and strict server-side access controls to protect your data. <strong>We do NOT sell, rent, trade, or share your personal information with any unauthorized third parties for marketing purposes.</strong>
          </p>
          <p style="margin-top: 0.5rem;">
            Information is shared only with trusted operational partners strictly necessary to complete your order (e.g. licensed payment gateways for payment authorization and courier partners for physical doorstep delivery).
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">5. Cookies & Local Storage</h2>
          <p>
            Our website uses browser cookies and local storage to retain your shopping bag contents, remember login sessions via mobile OTP, and offer a smooth checkout experience. You may disable cookies in your browser settings, though certain cart features may not function optimally.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">6. Grievance Redressal Officer</h2>
          <p>
            In accordance with the Information Technology Act, 2000 and rules made thereunder, the name and contact details of our Grievance Officer are provided below:
          </p>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
            <div><strong>Grievance Officer:</strong> Customer Relations Team, Tee Matrix</div>
            <div><strong>Email:</strong> <a href="mailto:support@teematrix.in" style="color: var(--accent-gold); text-decoration: none;">support@teematrix.in</a></div>
            <div><strong>Address:</strong> Koramangala 5th Block, Bangalore, Karnataka - 560095, India</div>
          </div>
        </div>
      </section>
    `;
  }

  renderShippingContent() {
    return `
      <section style="display: flex; flex-direction: column; gap: 1.8rem;">
        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">1. Pan-India Delivery Coverage</h2>
          <p>
            <strong>Tee Matrix</strong> delivers luxury streetwear heavyweight t-shirts across all serviceable pin codes throughout India. We partner with premier logistics carriers including <strong>Delhivery, Bluedart, Xpressbees, and India Post</strong> to ensure prompt, secure doorstep delivery.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">2. Order Processing & Dispatch Timelines</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 0.75rem;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.2rem; border-radius: 6px;">
              <strong style="color: #fff; display: block; font-size: 1rem; margin-bottom: 0.3rem;">⚡ Atelier Dispatch</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">Within <strong>24 to 48 business hours</strong> of order placement & payment verification.</span>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.2rem; border-radius: 6px;">
              <strong style="color: #fff; display: block; font-size: 1rem; margin-bottom: 0.3rem;">🚚 Standard Delivery Timeline</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem;"><strong>5 to 7 business days</strong> across India (Tier 1 Metros: 3–5 days; Regional/NE: 5–7 days).</span>
            </div>
          </div>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">3. Shipping Rates & Free Delivery</h2>
          <ul style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Free Shipping:</strong> Applicable on all prepaid and eligible orders with cart value above <strong>₹2,499</strong>.</li>
            <li><strong>Standard Shipping:</strong> A nominal flat charge of <strong>₹99</strong> is applicable on orders under ₹2,499.</li>
          </ul>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">4. Live Tracking Notifications via SMS & Email</h2>
          <p>
            Once your order is packed and dispatched from our atelier, you will receive an automatic dispatch notification containing the <strong>Tracking AWB Number</strong> and a direct tracking link via SMS and Email to monitor your parcel in real time.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">5. Transit Damage & Delivery Inspection</h2>
          <p>
            If you notice that the outer parcel packaging is visibly tampered with or damaged at the time of delivery, please do not accept the package or document photos/video before accepting. Report any damaged items within <strong>48 hours</strong> to <a href="mailto:support@teematrix.in" style="color: var(--accent-gold); text-decoration: none;">support@teematrix.in</a> for immediate priority replacement.
          </p>
        </div>
      </section>
    `;
  }

  renderRefundContent() {
    return `
      <section style="display: flex; flex-direction: column; gap: 1.8rem;">
        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">1. Transparent Refund Policy</h2>
          <p>
            At <strong>Tee Matrix</strong>, we strive to ensure a hassle-free shopping experience. If you are not completely satisfied with your purchase, or if your order is canceled or returned under our Return Policy, we ensure transparent and prompt refund settlements.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">2. Refund Eligibility Criteria</h2>
          <p>Refunds are initiated in the following scenarios:</p>
          <ul style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li>Approved returns received at our atelier within the 7-day window that pass our quality inspection.</li>
            <li>Prepaid orders canceled prior to courier dispatch.</li>
            <li>Orders that cannot be fulfilled due to inventory stock-outs or delivery address non-serviceability.</li>
            <li>Verified defective or transit-damaged items where a replacement is unavailable or declined by the customer.</li>
          </ul>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">3. Refund Mode & Processing Timelines</h2>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 8px; margin-top: 0.5rem;">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <strong style="color: #fff; display: block; font-size: 0.95rem;">⚡ Prepaid Payments (UPI, NetBanking, Credit/Debit Cards)</strong>
                <span style="color: var(--text-secondary); font-size: 0.85rem;">
                  Refunds are credited directly back to the <strong>original payment source (UPI ID / Card / Bank Account)</strong> within <strong>5 to 7 business days</strong> following quality verification.
                </span>
              </div>
              <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                <strong style="color: #fff; display: block; font-size: 0.95rem;">📦 Cash on Delivery (COD) Orders</strong>
                <span style="color: var(--text-secondary); font-size: 0.85rem;">
                  For COD returns, our support team will contact you to provide your verified Bank Account (IMPS/NEFT) or UPI VPA. Funds are transferred within <strong>3 to 5 business days</strong> of receiving details.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">4. Order Cancellations</h2>
          <p>
            You can request order cancellation before the parcel is dispatched by emailing <a href="mailto:support@teematrix.in" style="color: var(--accent-gold); text-decoration: none;">support@teematrix.in</a> or contacting our WhatsApp helpline with your Order ID (#TM-XXXX). Once dispatched, cancellation is not possible, but you may initiate a return upon delivery.
          </p>
        </div>
      </section>
    `;
  }

  renderReturnContent() {
    return `
      <section style="display: flex; flex-direction: column; gap: 1.8rem;">
        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">1. 7-Day Return & Exchange Assurance</h2>
          <p>
            We offer a <strong>7-day return and exchange window</strong> from the date your parcel is marked as delivered by the courier. If your heavyweight t-shirt doesn't fit quite right or if you wish to exchange it for another size/color, we are here to assist.
          </p>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">2. Conditions for Return / Exchange</h2>
          <p>To qualify for a return or exchange, items must meet the following conditions:</p>
          <ul style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li>Garment must be <strong>unused, unworn, unwashed</strong>, and free of stains, perfumes, or alterations.</li>
            <li>All original brand tags, neck labels, and original protective atelier packaging must remain intact.</li>
            <li>Return request must be raised within <strong>7 days</strong> of delivery.</li>
          </ul>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">3. Step-by-Step Return & Pickup Process</h2>
          <ol style="padding-left: 1.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <li><strong>Step 1 — Request:</strong> Email <a href="mailto:support@teematrix.in" style="color: var(--accent-gold); text-decoration: none;">support@teematrix.in</a> or message us on WhatsApp with your Order ID (#TM-XXXX), item photo, and reason for return or desired exchange size.</li>
            <li><strong>Step 2 — Doorstep Reverse Pickup:</strong> Our logistics partner will arrive at your doorstep within <strong>24 to 48 hours</strong> to collect the package.</li>
            <li><strong>Step 3 — Quality Verification:</strong> Once the parcel arrives at our Bangalore atelier, our quality team inspects the garment within 24 hours.</li>
            <li><strong>Step 4 — Settlement:</strong> Your replacement size is dispatched immediately, or a full refund is initiated to your original payment method (5–7 working days).</li>
          </ol>
        </div>

        <div>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 0.6rem; font-family: var(--font-heading);">4. Damaged or Defective Items Replacement</h2>
          <p>
            In the rare event of receiving a manufacturing defect or damaged t-shirt, notify us within <strong>48 hours</strong> of delivery with unboxing photos/video. We will arrange an immediate free replacement or 100% full refund at zero extra cost to you.
          </p>
        </div>
      </section>
    `;
  }

  attachEvents() {
    // Policy Tab Links
    document.querySelectorAll('.policy-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const policyId = btn.getAttribute('data-policy');
        this.currentPolicy = policyId;
        window.location.hash = policyId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.policy-breadcrumb-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = 'landing';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.footer-link.policy-link').forEach(link => {
      link.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }
}

export const policiesPage = new PoliciesPage();
