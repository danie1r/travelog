<script setup lang="ts">
import { computed, ref } from "vue";
import Popup from "../components/Popup.vue";
import { Place } from "@/types/baseTypes";

const openPopup = ref(false);
const searchElement = ref<string | undefined>(undefined);
const tabId = ref<number | undefined>(undefined);
const tabUrl = ref<string | undefined>(undefined);
const tabTitle = ref<string | undefined>(undefined);
const itemFound = ref<boolean>(false);
const items = ref<Place[]>([]);

browser.runtime.onMessage.addListener((message, sender, send) => {
  console.log(message)
  switch(message.action) {
    case "landed":
      openPopup.value = true;
      tabId.value = message.id;
      tabUrl.value = message.url;
      tabTitle.value = message.title;
      itemFound.value = message.content ? true : false;
      if (itemFound){
        items.value = message.content
      }
      break;
    case "app_opened":
      openPopup.value = true;
      tabId.value = message.id;
      tabUrl.value = message.url;
      tabTitle.value = message.title;
      break;
    case "search_element":
      console.log(message)
      openPopup.value = true;
      tabId.value = message.id
      tabUrl.value = message.url;
      tabTitle.value = message.title;
      searchElement.value = message.content;
      break;
    case "stop_track":
      openPopup.value = false;
      break;
  }
});

function handleIcon() {
  browser.runtime.sendMessage({timestamp: Date.now(), popupOpen: true, type: 'message'})
}
</script>

<template>
  <div id="app">
    <div v-if="openPopup && tabId && itemFound && !searchElement">
      <Popup :title="tabTitle" :tabId="tabId" :url="tabUrl" :places="items" />
    </div>
    <div v-else-if="openPopup && tabId && !searchElement">
      <Popup :title="tabTitle" :tabId="tabId" :url="tabUrl" />
    </div>
    <div v-else-if="openPopup && tabId && searchElement">
      <Popup :title="tabTitle" :tabId="tabId" :url="tabUrl" :searchElement="searchElement" />
    </div>
    <div v-else>
      <button class="icon-button" @click="handleIcon">
        <img src="@/assets/vue.svg" class="icon-image" />
        <span class="button-text"><slot></slot></span>
      </button>
    </div>
  </div>
</template>