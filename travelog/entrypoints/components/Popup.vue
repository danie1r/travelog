<script lang="ts" setup>
import { ref, watch } from "vue";
import { Place } from "@/types/baseTypes";
import PlaceInLine from "../composables/PlaceInLine.vue";
const props = defineProps<{
  title?: string;
  tabId: number;
  url?: string;
  places?: Place[];
  searchElement?: string;
}>();

const menuIndex = ref(0);
const menuItems = ["Home", "Search", "Recents"];
const recents = ref<Place[] | undefined>(undefined);
const recentSorts = ref<{ [key: string]: Place[] }>({});

watch(
  () => props.searchElement,
  (newValue) => {
    if (newValue !== undefined) {
      menuIndex.value = 1;
    } else {
      menuIndex.value = 0;
    }
  },
  { immediate: true } // Run the watcher immediately on component mount
);

// Watch for changes to recents
watch(
  recents,
  (newRecents) => {
    const sorts: { [key: string]: Place[] } = {};

    if (newRecents) {
      newRecents.forEach((place) => {
        const dateAccessed = place.dateAccessed;
        if (!sorts[dateAccessed]) {
          sorts[dateAccessed] = [];
        }
        sorts[dateAccessed].push(place);
      });
    }
    recentSorts.value = sorts;
  },
  { immediate: true }
);

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
    browser.runtime.sendMessage({
      type: "message",
      timestamp: Date.now(),
      action: "get_recents",
    });
  }
};

function closePopup() {
  browser.runtime.sendMessage({
    type: "message",
    timestamp: Date.now(),
    action: "stop_track",
  });
}

function clearRecents() {
  recents.value = [];
  browser.runtime.sendMessage({
    type: "message",
    timestamp: Date.now(),
    action: "remove_recents",
  });
}

browser.runtime.onMessage.addListener((message, sender, send) => {
  switch (message.action) {
    case "recents_received":
      recents.value = message.content;
      break;
  }
});
</script>

<template>
  <div>
    <div>
      <button @click="closePopup">close</button>
    </div>
    <div class="homeMenu" no-gutters>
      <div v-for="(item, index) in menuItems" :key="index">
        <button :style="menuButtonStyle(index)" @click="selectMenuItem(index)">
          {{ item }}
        </button>
      </div>
    </div>
    <div class="main-body">
      <div v-if="menuIndex === 0" style="margin-top: 10%">
        <div v-if="places">
          <div>We found these travel related information on {{ title }}</div>

          <div v-for="place in places" :key="place.name">
            <PlaceInLine :place="place" />
          </div>
        </div>
      </div>
      <div v-if="menuIndex === 1">
        <div class="search-container">
          <input
            type="text"
            id="search-input"
            placeholder="What are you searching for?"
            :value="searchElement"
          />
          <button id="search-button">Search</button>
        </div>
      </div>
      <div v-if="menuIndex === 2">
        <button class="clearButton" @click="clearRecents">clear</button>
        <div v-if="recents" v-for="(item, date) in recentSorts" :key="date">
          <div>{{ date }}</div>
          <div v-for="place in recents" :key="place.name">
            <PlaceInLine :place="place" />
          </div>
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

.clearButton {
  display: flex;
  margin-left: auto;
}
</style>
