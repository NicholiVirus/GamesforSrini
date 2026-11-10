/**
 * Pakistan Runner as a Google Apps Script web app.
 * Deploy > New deployment > Web app, then open the web app URL to play.
 * Built from pakistan-runner/ by tools/build-gas.js; edit the originals, not these files.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Pakistan Runner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Pulls one of the other HTML files into index.html. */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
