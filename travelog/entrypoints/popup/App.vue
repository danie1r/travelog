<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { PageInfo, Place } from "@/types/baseTypes";
import { parseToOpenAI } from "~/helper";
import PlaceInLine from "../components/PlaceInLine.vue";
import background from "../background";

const currentInfo = reactive<PageInfo>({
  url: undefined,
  domain: undefined,
  accessed_date: new Date(),
  places: undefined,
});

const menuIndex = ref(0);
const menuItems = ["Home", "Saved", "Recents"];
const isLoading = ref(false);
const contentLoaded = ref(false);
const errorParsing = ref(false);
const recents = ref([] as Place[]);
const openai = parseToOpenAI();

function parseHTML(data: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "text/html");
  function extractText(node: Node) {
    let text = "";
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent + " ";
      } else if (
        child.nodeType === Node.ELEMENT_NODE &&
        child.nodeName !== "SCRIPT" &&
        child.nodeName !== "STYLE"
      ) {
        text += extractText(child) + " ";
      }
    }
    return text.trim();
  }

  return extractText(doc.body);
}

async function getDomain() {
  errorParsing.value = false;
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await browser.tabs.query(queryOptions);
  isLoading.value = true;
  currentInfo.url = tab.url;
  currentInfo.domain = tab.title;

  return browser.scripting
    .executeScript({
      target: { tabId: tab.id! },
      injectImmediately: true, // uncomment this to make it execute straight away, other wise it will wait for document_idle
      func: DOMtoString,
      args: ["body"], // you can use this to target what element to get the html for
    })
    .then(async function (results) {
      const response = parseHTML(results[0].result);
      const parsed = await openai.startParsing(
        response,
        currentInfo.domain,
        currentInfo.url
      );
      currentInfo.places = parsed;
      isLoading.value = false;
      contentLoaded.value = true;
      browser.runtime.sendMessage({ action: "save_recents", data: parsed });
    })
    .catch(function (error) {
      isLoading.value = false;
      contentLoaded.value = true;
      errorParsing.value = true;
      console.log(`Error: ${error}`);
    });
}

function DOMtoString(selector: any) {
  if (selector) {
    selector = document.querySelector(selector);
    if (!selector) return "ERROR: querySelector failed to find node";
  } else {
    selector = document.documentElement;
  }

  return selector.outerHTML;
}

const menuButtonStyle = (index: number) => ({
  cursor: "pointer",
  borderBottom: menuIndex.value === index ? "2px solid #4caf50" : "none",
  background: "none",
  borderRadius: "0",
  padding: "5",
});

const selectMenuItem = (index: number) => {
  menuIndex.value = index;
  if (menuIndex.value == 2) {
    getRecents()
  }
};

function getRecents() {
  try {
    browser.storage.local.get("data").then((res) => {
      let response = res['data'] as Place[];
      recents.value = response;
      console.log(recents.value)
    })
  } catch (e) {
    console.log("Error: " + e)
  }
}
</script>

<template>
  <div>
    <div class="homeMenu" no-gutters>
      <div v-for="(item, index) in menuItems" :key="index">
        <button :style="menuButtonStyle(index)" @click="selectMenuItem(index)">
          {{ item }}
        </button>
      </div>
    </div>
    <div class="main-body">
      <div v-if="menuIndex === 0" style="margin-top: 10%;">
        <div v-if="!isLoading && !contentLoaded">
          I wonder whats in store...
        </div>
        <div v-if="!isLoading && contentLoaded">
          <div v-for="place in currentInfo.places" :key="place.name">
            <PlaceInLine :place="place" />
          </div>
        </div>
        <div v-if="isLoading">Parsing the website...</div>
        <div>
          <button v-if="!isLoading && errorParsing" @click="getDomain">
            Try Again
          </button>
          <button v-if="!isLoading && !errorParsing && !currentInfo.places" @click="getDomain">
            Get Started!
          </button>
          <button v-if="isLoading" disabled>Loading...</button>
        </div>
      </div>
      <div v-if="menuIndex === 1">

      </div>
      <div v-if="menuIndex === 2">
        <div v-for="place in recents">
          <PlaceInLine :place="place" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.homeMenu {
  display: flex;
  position: static;
  top: 0;
  width: 100%;
  justify-content: center;
}

button:hover {
  outline: none;
}

.main-body {
  height: 500px;
  overflow-y: auto;
  width: 100%;
  
}
</style>
