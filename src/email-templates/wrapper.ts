const ACCENT = "#F49F1E";
const BANNER_BG = "#09090B";
const FONT_STACK =
  "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap";

const logoBannerHtml = () => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <!-- "W" badge -->
            <td
              width="32"
              height="32"
              align="center"
              valign="middle"
              style="
                background-color:${ACCENT};
                border-radius:8px;
                width:32px;
                height:32px;
                font-family:${FONT_STACK};
                font-size:13px;
                font-weight:700;
                color:#ffffff;
              "
            >
              W
            </td>

            <!-- spacer -->
            <td width="10">&nbsp;</td>

            <!-- Wordmark -->
            <td valign="middle">
              <span
                style="
                  font-family:${FONT_STACK};
                  font-size:17px;
                  font-weight:700;
                  letter-spacing:-0.2px;
                  color:#ffffff;
                "
              >
                Work<span style="color:${ACCENT};">spora</span>
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

export const emailTemplate = (
  title: string,
  content: string,
  bannerImageURL?: string,
) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link href="${FONT_IMPORT_URL}" rel="stylesheet" />

    <title>${title}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background-color:#f5f7fa;
      font-family:${FONT_STACK};
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!-- Container -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            style="
              background:#ffffff;
              border-radius:8px;
              overflow:hidden;
            "
          >
            <!-- Banner -->
            <tr>
              <td style="background:${BANNER_BG}; text-align:center;">
                ${
                  bannerImageURL
                    ? `<img
                        src="${bannerImageURL}"
                        alt="Workspora"
                        style="
                          width:100%;
                          max-width:600px;
                          display:block;
                        "
                      />`
                    : logoBannerHtml()
                }
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 24px; color:#0f172a;">
                <h2
                  style="
                    margin-top:0;
                    font-size:20px;
                    font-weight:600;
                  "
                >
${title}
                </h2>

                <div style="font-size:14px; line-height:1.6;">
${content}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background:#f8fafc;
                  padding:24px;
                  text-align:center;
                  font-size:12px;
                  color:#64748b;
                "
              >
                <p style="margin:0 0 12px;">
                  Follow us on
                </p>

                <p style="margin:0 0 16px;">
                  <a
                    href="#"
                    style="color:${ACCENT}; text-decoration:none; margin:0 8px;"
                  >
                    Twitter
                  </a>
                  |
                  <a
                    href="#"
                    style="color:${ACCENT}; text-decoration:none; margin:0 8px;"
                  >
                    LinkedIn
                  </a>
                  |
                  <a
                    href="#"
                    style="color:${ACCENT}; text-decoration:none; margin:0 8px;"
                  >
                    Instagram
                  </a>
                </p>

                <p style="margin:0;">
                  © ${new Date().getFullYear()} Workspora. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
