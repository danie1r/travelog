import { send } from "process";

export default defineBackground(() => {
  
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      browser.storage.local.set({ installDate: Date.now() });
      browser.storage.local.set({'data' : []})
    }
  });
  
  browser.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg === 'testing') {
      console.log("received")
    } else if (msg['action'] === 'save_recents') {
      browser.storage.local.get('data')
      .then(result => {
        let orig = result['data'] || []; 
        orig = orig.concat(msg['data']); 
        browser.storage.local.set({ 'data': orig })
          .then(() => {
            console.log('Data successfully saved.');
          })
          .catch(error => {
            console.error('Error saving data:', error);
          });
      })
      .catch(error => {
        console.error('Error retrieving data:', error);
      });
      console.log("DATA PUSH")
      console.log(browser.storage.local.get('data'))
    }
  })
  
  // browser.runtime.onMessage.addListener((msg,sender, sendResponse) => {
  //   // if (msg === 'CurrentTabInfo'){
  //   //   const currentTabUrl = getCurrentTab();
  //   //   // Optionally, you can send the URL back to the content script
  //   //   sendResponse({received:true});
  //   // }
  //   // if (msg.type === 'start-parse'){
  //   //   const res = registerParsing(msg.data)
  //   //   setTimeout(() => sendResponse(res),1000);
      
  //   //   return true;
  //   // }
  // })

  // return false;
});
