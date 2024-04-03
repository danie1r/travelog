
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { PageInfo } from '@/types/baseTypes.ts';
import { parseToOpenAI } from '~/helper';

const currentInfo = reactive<PageInfo>({
  url : undefined,
  domain : undefined,
  accessed_date : new Date(),
  places : undefined
})

const isLoading = ref(false);
const contentLoaded = ref(false);
const errorParsing = ref(false);
const openai = parseToOpenAI();

function parseHTML(data: string) {
  let text = ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(data, 'text/html')
  function extractText(node : Node) {
    let text = ''
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent + ' ';
      } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName !== 'SCRIPT' && child.nodeName !== 'STYLE'){
        text += extractText(child) + ' '
      }
    }
    return text.trim()
  }

  return extractText(doc.body)
}

async function getDomain() {
  errorParsing.value = false;
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await browser.tabs.query(queryOptions);
  isLoading.value = true;
  currentInfo.url = tab.url
  currentInfo.domain = tab.title
  
  return browser.scripting.executeScript({
    target: { tabId: tab.id! },
    injectImmediately: true,  // uncomment this to make it execute straight away, other wise it will wait for document_idle
    func: DOMtoString,
    args: ['body']  // you can use this to target what element to get the html for
  }).then(async function (results) {
    
    const response = parseHTML(results[0].result)
    const parsed = await openai.startParsing(response)
    currentInfo.places = parsed
    isLoading.value = false;
    contentLoaded.value = true;
  }).catch(function (error) {
    isLoading.value = false
    contentLoaded.value = true;
    errorParsing.value = true;
    console.log(`Error: ${error}`)
  });
}

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
    <div>
      <div v-if="currentInfo.domain">{{ currentInfo.domain }}</div>
    </div>
    <div>
      
      <div v-if="!isLoading && !contentLoaded">I wonder whats in store...</div>
      <div v-if="!isLoading && contentLoaded" v-for="place in currentInfo.places">
        <div>{{ place.name }}</div>
        <div>{{ place.type }}</div>
        <div>{{ place.address }}</div>
        <div>{{ place.description }}</div>
        <div>-------------</div>
      </div>
      <div v-if="isLoading">Parsing the website...</div>
      
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
../../helper@/types/browserTypes