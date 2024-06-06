<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { PageInfo, Place } from "@/types/baseTypes";
import PlaceInLine from "../composables/PlaceInLine.vue";
const props = defineProps<{
  title?: string
  tabId: number
  url?: string,
  places?: Place[]
}>()

const menuIndex = ref(0);
const menuItems = ["Home", "Saved", "Recents"];
const errorParsing = ref(false);
const recents = ref([] as Place[]);


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
    browser.runtime.sendMessage({type: 'message', timestamp: Date.now(), action: 'get_recents'})
  }
};

function closePopup() {
  browser.runtime.sendMessage({type: 'message', timestamp: Date.now(), action: 'stop_track'})
}

function clearRecents() {
  recents.value = []
  browser.runtime.sendMessage({type: 'message', timestamp: Date.now(), action: 'clear_recents'})
}

browser.runtime.sendMessage({type: 'message', timestamp: Date.now(), action: 'get_contents'})

browser.runtime.onMessage.addListener((message, sender, send) => {
  switch(message.action){
    case "recents_received":
      recents.value = message.content
      break;
    // case "display_parse_results":
    //   currentInfo.places = message.content
    //   isLoading.value = false;
    //   contentLoaded.value = true;
    //   break;
  }
})
</script>

<template>
  <div>
    <div>
      <button @click="closePopup">
        close
      </button>
    </div>
    <div class="homeMenu" no-gutters>
      <div v-for="(item, index) in menuItems" :key="index">
        <button :style="menuButtonStyle(index)" @click="selectMenuItem(index)">
          {{ item }}
        </button>
      </div>
    </div>
    <div class="main-body">
      <div v-if="menuIndex === 0" style="margin-top: 10%;">
        <div v-if="places">
          <div v-for="place in places" :key="place.name">
            <PlaceInLine :place="place" />
          </div>
        </div>
      </div>



      <div v-if="menuIndex === 1">

      </div>
      <div v-if="menuIndex === 2">
        <button class="clearButton" @click="clearRecents">
          clear
        </button>
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

.clearButton {
  display: flex;
  margin-left: auto;
}

</style>
