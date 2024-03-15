
<script lang="ts" setup>
import HelloWorld from '@/components/HelloWorld.vue';
import { onMounted, reactive, ref } from 'vue';
import { PageInfo } from '@/types/PageInfo.ts';
import { startOpenAI } from '../helper';


const currentInfo = reactive({
  url : "",
  domain : "",
  accessed_date : new Date(),
  dom : document.documentElement.outerText
})

const isLoading = ref(false);
const contentLoaded = ref(false);
const errorParsing = ref(false);

// function savePageInfoLocal(type:string, message:PageInfo) {
//   browser.runtime.sendMessage({type: type,data: message});
// }

async function getDomain() {
  errorParsing.value = false;
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await browser.tabs.query(queryOptions);
  isLoading.value = true;
  const tabInfo : PageInfo = {
    url : tab.url,
    accessed_date: new Date(),
    domain : tab.title
  }
  currentInfo.domain = tabInfo.domain ? tabInfo.domain : "N/A"
  
  const message = document.querySelector("#message");
  return browser.scripting.executeScript({
    target: { tabId: tab.id! },
    // injectImmediately: true,  // uncomment this to make it execute straight away, other wise it will wait for document_idle
    func: DOMtoString,
    // args: ['body']  // you can use this to target what element to get the html for
  }).then(function (results) {
    tabInfo.dom = results[0].result;
    const openai = startOpenAI()
    const res = openai.startParsing(results[0].result)
    message!.innerHTML = JSON.stringify(res);
    isLoading.value = false;
    contentLoaded.value = true;
  }).catch(function (error) {
    isLoading.value = false
    contentLoaded.value = true;
    errorParsing.value = true;
    message!.innerHTML = 'There was an error injecting script : \n' + error.message;
  });
}

// onMounted(()=>{
//   getDomain()
// })

function DOMtoString(selector : any) {
    if (selector) {
        selector = document.querySelector(selector);
        if (!selector) return "ERROR: querySelector failed to find node"
    } else {
        selector = document.documentElement;
    }
    
    return selector.outerHTML;
}
</script>

<template>
  <div>
    <!-- <a href="https://wxt.dev" target="_blank">
      <img src="/wxt.svg" class="logo" alt="WXT logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="@/assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="WXT + Vue" /> -->
    <div>
      
      <div v-if="!isLoading && !contentLoaded">I wonder whats in store...</div>
      <div v-if="!isLoading && contentLoaded"></div>
      <div v-if="isLoading">Parsing the website...</div>
      <div id="message"></div>
    </div>
    

    <div>
      <button v-if="!isLoading && errorParsing" @click="getDomain">Try Again</button>
      <button v-if="!isLoading && !errorParsing" @click="getDomain">Get Started!</button>
      <button v-if="isLoading" disabled>Loading...</button>
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #54bc4ae0);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

</style>
