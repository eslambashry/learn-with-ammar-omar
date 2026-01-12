export const emailTemplate = ({ link, linkData, subject }) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #F4F6F8;
    }

    .email-container {
      width: 600px;
      max-width: 95%;
      margin: 40px auto;
      background-color: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    }

    /* ===== HEADER ===== */
    .header {
      background: linear-gradient(135deg, #1A3F51, #153443);
      padding: 30px 20px;
      text-align: center;
    }

    .logo svg {
      max-width: 170px;
      height: auto;
      fill: #FFFFFF;
    }

    .header a {
      display: inline-block;
      margin-top: 12px;
      font-size: 13px;
      color: #D5A939;
      text-decoration: none;
    }

    /* ===== CONTENT ===== */
    .content {
      padding: 40px 30px;
      text-align: center;
      color: #4A4A4A;
    }

    .content h1 {
      color: #1A3F51;
      font-size: 26px;
      margin-bottom: 18px;
    }

    .content p {
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 25px;
    }

    /* ===== BUTTON ===== */
    .button {
      display: inline-block;
      padding: 14px 36px;
      background-color: #D5A939;
      color: #1A3F51 !important;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      font-size: 15px;
      letter-spacing: 0.5px;
    }

    /* ===== FOOTER ===== */
    .footer {
      padding: 22px;
      text-align: center;
      font-size: 13px;
      color: #8A8A8A;
      background-color: #F1F3F5;
      border-top: 1px solid #E2E6EA;
    }

    .footer span {
      color: #1A3F51;
      font-weight: bold;
    }

    @media (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }

      .content h1 {
        font-size: 22px;
      }
    }
  </style>
</head>

<body>
  <div class="email-container">

    <!-- HEADER -->
    <div class="header">
      <div class="logo">
        <!-- Your SVG Logo -->
        <svg width="180" height="99" viewBox="0 0 180 99" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="50%" text-anchor="middle" fill="#FFFFFF" font-size="22" font-weight="bold" dy=".3em">
            MOHAMMED ALHABSI
          </text>
        </svg>
      </div>
      <a href="https://edu-smart-al-habsi-8dk2.vercel.app/" target="_blank">View on Website</a>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <h1>${subject}</h1>
      <p>
        Please click the button below to continue.  
        If you did not request this action, you can safely ignore this email.
      </p>

      <a href="${link}" class="button">
        ${linkData}
      </a>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      Stay connected with <span>MOHAMMED ALHABSI</span><br/>
      &copy; ${new Date().getFullYear()} MOHAMMED ALHABSI. All rights reserved.
    </div>

  </div>
</body>
</html>`;
};
