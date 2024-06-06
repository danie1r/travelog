<script lang="ts" setup>

function pauseTrack() {
  browser.runtime.sendMessage({action: 'stop_track'})
}
</script>

<template>
  <div class="main">
    <button style="background-color: red;" @click="pauseTrack()">Stop</button>
  </div>
</template>

<style scoped>
.main {
  height: 30%;
  overflow-y: auto;
  width: 100%;
}
</style>