const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
    const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
    await page.goto(base);
    await page.getByRole('link', {name:'Python →'}).click();
    await page.getByRole('status').getByText(/Pronto/).waitFor({timeout:120000});
    await page.getByRole('button', {name:'+ Blocco'}).click();
    await page.locator('#name').fill('prezzo');
    await page.locator('#value').fill('3');
    await page.getByRole('button', {name:'Aggiungi', exact:true}).click();
    await page.getByRole('button', {name:'Codice', exact:true}).click();
    if (!((await page.locator('#code').inputValue()).includes('prezzo = 3'))) {
      throw Error('Il blocco non ha prodotto Python.');
    }
    await page.getByRole('button', {name:'Chiudi'}).click();
    const original = '# nota\nprezzo = 3  # euro\n';
    await page.locator('#file').setInputFiles({
      name:'prova.py', mimeType:'text/x-python', buffer:Buffer.from(original)
    });
    await page.getByRole('button', {name:'Codice', exact:true}).click();
    if (await page.locator('#code').inputValue() !== original) {
      throw Error('Importazione non conservativa.');
    }
    await page.getByRole('button', {name:'Chiudi'}).click();
    console.log('Python Drop mobile smoke: OK');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
