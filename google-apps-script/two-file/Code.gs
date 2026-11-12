/** Pakistan Runner: Deploy > New deployment > Web app, then open the URL to play. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pakistan Runner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
