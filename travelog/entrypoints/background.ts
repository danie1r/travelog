
export default defineBackground(() => {
  
  browser.runtime.onInstalled.addListener(({ reason }) => {
    const OpenAIKEY = ''
    if (reason === 'install') {
      browser.storage.local.set({ installDate: Date.now() });
      browser.storage.local.set({ "openaikey" : OpenAIKEY})
    }
  });
  
  
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
