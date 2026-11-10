# Pakistan Runner on Google Apps Script

These files run the game as a Google Apps Script **web app**: a link anyone can open
to play, hosted by Google. They are built from `pakistan-runner/` by
`node tools/build-gas.js`, so change the originals and rebuild rather than editing here.

## Set it up in the browser (no tools needed)

1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Rename the project to **Pakistan Runner**.
3. Replace everything in `Code.gs` with the contents of `Code.gs` from this folder.
4. For each of these files, click **+** next to *Files*, choose **HTML**, type the name
   **without** `.html`, and paste in that file's contents:
   `index`, `style`, `three`, `data`, `art`, `world`, `audio`, `game`.
   (`three` is the big one, about 600 KB; it can take a few seconds to paste.)
5. Click **Save**.
6. Click **Deploy → New deployment**, pick the type **Web app**, set
   *Execute as* to **Me** and *Who has access* to **Anyone** (or just your school or
   family account), then click **Deploy** and allow access when asked.
7. Open the **Web app URL**. That link is the game. Share it to let others play.

After changing anything, use **Deploy → Manage deployments → Edit → New version**
so the link picks up the change.

## Set it up with clasp (for programmers)

```bash
npm install -g @google/clasp
clasp login
cd google-apps-script
clasp create --type webapp --title "Pakistan Runner"
clasp push
clasp deploy
```

## Notes

- Progress is saved in the player's browser, as in the normal version.
- Click the game once before using the keyboard, so it has focus.
- The game needs WebGL (3D graphics), which every modern browser has.
