# Cathy & Daniel: Wedding Website

A one-page wedding site that opens with an envelope animation and includes the invitation, a countdown, the details and map, the entourage, the dress code, and an RSVP form whose replies go into a Google Sheet.

| File | What it is |
|---|---|
| `index.html` | The website |
| `styles.css`, `app.js` | Design and behaviour. **Settings are at the top of `app.js`.** |
| `links.html` | Private tool for making a personal invite link for each household |
| `rsvp-google-apps-script.gs` | Code that receives RSVPs into your Google Sheet |
| `assets/` | Florals, dress and suit drawings, icon, and the link-preview image |

---

## 1. Connect the RSVP form to a Google Sheet (about 10 minutes)

1. Create a new Google Sheet, for example "Wedding RSVPs".
2. In the sheet, choose **Extensions → Apps Script**.
3. Delete the sample code, paste in all of `rsvp-google-apps-script.gs`, and save.
4. Click **Deploy → New deployment**. Under "Select type" (the gear icon) choose **Web app**.
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
5. Click **Deploy** and approve the permissions. Google will warn that the app is unverified, because it is your own script. Choose **Advanced → Go to (project)**.
6. Copy the **Web app URL** (it ends in `/exec`).
7. Paste it into `app.js`:
   ```js
   RSVP_ENDPOINT: "https://script.google.com/macros/s/XXXX/exec",
   ```
8. Submit a test RSVP on the site. A new **RSVPs** tab appears in the sheet with your test reply.

If you edit the script later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

Until `RSVP_ENDPOINT` is filled in, the form runs in preview mode. It looks like it works, but nothing is saved.

## 2. Put the site online for free (GitHub Pages)

1. Push these files to the root of your wedding repository.
2. On GitHub go to **Settings → Pages**, set *Source* to **Deploy from a branch**, and choose **main** and **/ (root)**.
3. After about a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.
4. Optional: buy a domain such as `cathyanddaniel.com` and add it under **Settings → Pages → Custom domain**.

## 3. Send personal invites

Open `links.html` on the live site (`…/links.html`). It isn't linked from the main page, and search engines are told to ignore it. Enter one household per line:

```
Tita Marites and Tito Jun, 2
The Santos Family, 4
Adam Cooper, 1
```

Each link greets the guest by name on the envelope, fills in their name on the RSVP form, and caps their party size at the number of seats you set. Their reply arrives in the sheet with the invite name, so you can match it to your guest list. Click **Download as spreadsheet** to keep every link.

The plain address without a personal link still works. It allows up to `DEFAULT_SEATS` guests (2).

## Settings in `app.js`

- `RSVP_DEADLINE`: currently **30 June 2027**
- `DEFAULT_SEATS`: the party size for anyone using the plain link
- `WEDDING_END`: used only for the end time of the calendar entry (currently 10:00 pm)

## Preview locally

Open `index.html` in a browser. For the map and fonts to load you need an internet connection.
